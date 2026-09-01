import { Component, EventEmitter, Input, OnInit, Output, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import * as bootstrap from 'bootstrap';
import Swal from 'sweetalert2';

import { PagoLetraService } from '../../services/pagoletra.service';
import { PagoLetraResponse } from '../../dto/pagoletraresponse.dto';
import { PagoLetraRequest } from '../../dto/pagoletrarequest.dto';
import { MedioPago } from '../../enums/mediopago.enum';
import { Moneda } from '../../dto/moneda.enum';
import { TokenService } from '../../auth/token.service';
import { jwtDecode } from 'jwt-decode';

/** Imagen de voucher en edición, con su propio estado de recorte/rotación. */
interface VoucherEditItem {
  file: File;
  url: string;
  image: HTMLImageElement;
  rotation: number;
  scale: number;
  panX: number;
  panY: number;
}

@Component({
  selector: 'app-pago-lista-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './pago-lista-modal.html',
  styleUrls: ['./pago-lista-modal.scss']
})
export class PagoListaModalComponent implements OnInit, AfterViewInit {
  @ViewChild('modalElement') modalElement!: ElementRef;
  @ViewChild('fileVoucher') fileVoucher!: ElementRef;
  private modal?: bootstrap.Modal;

  @Input() idContrato!: number;
  @Input() monedaContrato: Moneda = 'USD';
  @Output() onClose = new EventEmitter<void>();
  @Output() onPagoEliminado = new EventEmitter<void>();

  pagos: PagoLetraResponse[] = [];
  cargando = false;
  eliminando = false;
  anulando = false;
  esAdministrador = false;
  /** Pago en espera de seleccionar un nuevo voucher. */
  pagoParaEditarVoucher: PagoLetraResponse | null = null;
  subiendoVoucher = false;

  // ── Editor de voucher (múltiples fotos: recorte + rotación) ──
  editandoVoucher = false;
  voucherPago: PagoLetraResponse | null = null;
  voucherFechaOperacion: string = '';
  voucherNumeroOperacion: string = '';
  /** Imágenes en edición (cada una con su propio recorte/rotación). */
  voucherItems: VoucherEditItem[] = [];
  /** Índice de la imagen activa en el editor. */
  voucherIndex = 0;
  dragging = false;
  dragStartX = 0;
  dragStartY = 0;

  @ViewChild('voucherCanvas') voucherCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('voucherViewport') voucherViewport!: ElementRef<HTMLDivElement>;

  constructor(
    private pagoService: PagoLetraService,
    private toastr: ToastrService,
    private tokenService: TokenService
  ) {}

  ngOnInit(): void {
    this.verificarRol();
    this.cargarPagos();
  }

  ngAfterViewInit(): void {
    this.modal = new bootstrap.Modal(this.modalElement.nativeElement, {
      backdrop: 'static',
      keyboard: false
    });
    this.modal.show();
  }

  private verificarRol(): void {
    const token = this.tokenService.getToken();
    if (!token) return;
    try {
      const decoded: { rol: string } = jwtDecode(token);
      this.esAdministrador = decoded.rol === 'ROLE_ADMINISTRADOR';
    } catch {
      this.esAdministrador = false;
    }
  }

  cerrarModal(): void {
    this.modal?.hide();
    setTimeout(() => {
      this.modal?.dispose();
      document.body.classList.remove('modal-open');
      document.body.style.removeProperty('overflow');
      document.body.style.removeProperty('padding-right');
      document.querySelectorAll('.modal-backdrop').forEach(el => el.remove());
      this.onClose.emit();
    }, 300);
  }

  cargarPagos(): void {
    if (!this.idContrato) return;
    this.cargando = true;
    this.pagoService.listarPorContrato(this.idContrato).subscribe({
      next: (data) => { this.pagos = data; this.cargando = false; },
      error: () => { this.toastr.error('No se pudieron cargar los pagos'); this.cargando = false; }
    });
  }

  getNumeroLetraLimpio(numeroLetra: string | undefined): string {
    return numeroLetra ? numeroLetra.split('/')[0] : '';
  }

  getNumeroComprobante(pago: PagoLetraResponse): string | undefined {
    return (pago as any).comprobante?.numeroCompleto ?? pago.numeroComprobante;
  }

  eliminarPago(idPago: number): void {
    if (this.eliminando) return;

    const pago = this.pagos.find(p => p.idPago === idPago);
    const numeroComprobante = this.getNumeroComprobante(pago!);
    const pagosDelMismoComprobante = numeroComprobante
      ? this.pagos.filter(p => this.getNumeroComprobante(p) === numeroComprobante)
      : [];
    const esMultiple = pagosDelMismoComprobante.length > 1;

    const numerosLetra = (esMultiple ? pagosDelMismoComprobante : [pago!])
      .map(p => p.numeroLetra ? p.numeroLetra.split('/')[0].trim() : '?')
      .sort((a, b) => parseInt(a) - parseInt(b));

    const letrasTexto = numerosLetra.length === 1
      ? `la Letra N° <strong>${numerosLetra[0]}</strong>`
      : `las Letras N° <strong>${numerosLetra.slice(0, -1).join(', ')} y ${numerosLetra[numerosLetra.length - 1]}</strong>`;

    Swal.fire({
      title: esMultiple ? '¿Eliminar pago múltiple?' : '¿Eliminar comprobante?',
      html: esMultiple
        ? `El comprobante <strong>${numeroComprobante}</strong> agrupa ${letrasTexto}. Se eliminarán los ${pagosDelMismoComprobante.length} pagos. ¡Esta acción no se puede revertir!`
        : `Se eliminará el comprobante <strong>${numeroComprobante}</strong> correspondiente a ${letrasTexto}. ¡Esta acción no se puede revertir!`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#6b7280',
      confirmButtonText: esMultiple ? `Sí, eliminar los ${pagosDelMismoComprobante.length} pagos` : 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then(result => {
      if (result.isConfirmed) {
        this.eliminando = true;
        const ids = esMultiple ? pagosDelMismoComprobante.map(p => p.idPago) : [idPago];
        this.eliminarSecuencial(ids, 0);
      }
    });
  }

  private eliminarSecuencial(ids: number[], index: number): void {
    if (index >= ids.length) {
      this.toastr.success(
        ids.length > 1 ? `${ids.length} pagos eliminados correctamente` : 'Pago eliminado correctamente',
        'Éxito'
      );
      this.eliminando = false;
      this.cargarPagos();
      this.onPagoEliminado.emit();
      return;
    }
    this.pagoService.eliminarPago(ids[index]).subscribe({
      next: () => this.eliminarSecuencial(ids, index + 1),
      error: () => {
        this.toastr.error(`Error al eliminar el pago ID ${ids[index]}`, 'Error');
        this.eliminando = false;
        this.cargarPagos();
        this.onPagoEliminado.emit();
      }
    });
  }

  anularPago(idPago: number): void {
    if (this.anulando) return;
    const pago = this.pagos.find(p => p.idPago === idPago);

    Swal.fire({
      title: 'Anular pago',
      html: `
        <p style="margin-bottom:12px">Ingrese el motivo de anulación del pago de la letra <strong>N° ${this.getNumeroLetraLimpio(pago?.numeroLetra)}</strong>:</p>
        <textarea id="motivo-anulacion" class="swal2-textarea" placeholder="Motivo obligatorio..." rows="3" style="width:100%;resize:vertical"></textarea>
      `,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Anular pago',
      cancelButtonText: 'Cancelar',
      preConfirm: () => {
        const motivo = (document.getElementById('motivo-anulacion') as HTMLTextAreaElement)?.value?.trim();
        if (!motivo) {
          Swal.showValidationMessage('El motivo es obligatorio');
          return false;
        }
        return motivo;
      }
    }).then(result => {
      if (result.isConfirmed && result.value) {
        this.anulando = true;
        this.pagoService.anularPago(idPago, result.value).subscribe({
          next: () => {
            this.toastr.success('Pago anulado correctamente', 'Éxito');
            this.anulando = false;
            this.cargarPagos();
            this.onPagoEliminado.emit();
          },
          error: (err) => {
            const msg = err?.error?.message || 'No se pudo anular el pago';
            this.toastr.error(msg, 'Error');
            this.anulando = false;
          }
        });
      }
    });
  }

  /** Abre el selector de archivo para reemplazar el voucher del pago. */
  editarVoucher(pago: PagoLetraResponse): void {
    this.pagoParaEditarVoucher = pago;
    this.fileVoucher?.nativeElement?.click();
  }

  /** Al elegir uno o más archivos, los carga en el editor (multi-foto). */
  onVoucherSeleccionado(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);
    input.value = ''; // permite volver a elegir el mismo archivo después

    if (files.length === 0) return;

    const pago = this.pagoParaEditarVoucher;
    this.pagoParaEditarVoucher = null;

    // Si aún no hay pago en edición, es la primera carga
    const esPrimera = !this.editandoVoucher || !this.voucherPago;
    const pagoDestino = esPrimera ? pago : this.voucherPago;
    if (!pagoDestino) {
      this.pagoParaEditarVoucher = null;
      return;
    }

    // Si es la primera, inicializar estado del editor
    if (esPrimera) {
      this.voucherPago = pagoDestino;
      this.voucherFechaOperacion = pagoDestino.fechaOperacion ? pagoDestino.fechaOperacion.slice(0, 10) : '';
      this.voucherNumeroOperacion = pagoDestino.numeroOperacion || '';
      this.voucherItems = [];
      this.voucherIndex = 0;
      this.editandoVoucher = true;
    }

    // Cargar cada archivo como un item editable
    let pendientes = files.length;
    for (const file of files) {
      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.onload = () => {
          this.voucherItems.push({
            file,
            url: reader.result as string,
            image: img,
            rotation: 0,
            scale: 1,
            panX: 0,
            panY: 0
          });
          pendientes--;
          if (pendientes === 0) {
            this.voucherIndex = this.voucherItems.length - 1;
            setTimeout(() => this.renderVoucherEditor(), 50);
          }
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  /** Devuelve el item activo del editor (imagen que se está editando). */
  private getItemActivo(): VoucherEditItem | undefined {
    return this.voucherItems[this.voucherIndex];
  }

  /** Selecciona otra foto del editor para editar su recorte/rotación. */
  seleccionarVoucherItem(index: number): void {
    if (index < 0 || index >= this.voucherItems.length) return;
    this.voucherIndex = index;
    this.renderVoucherEditor();
  }

  /** Permite agregar más fotos al editor (voucher pagado en varias partes). */
  agregarVoucherFoto(): void {
    if (!this.voucherPago) return;
    // Se marca para que onVoucherSeleccionado sepa que ya hay editor abierto
    this.pagoParaEditarVoucher = null;
    this.fileVoucher?.nativeElement?.click();
  }

  /** Quita una foto del editor. */
  quitarVoucherItem(index: number): void {
    this.voucherItems.splice(index, 1);
    if (this.voucherItems.length === 0) {
      this.cancelarEditarVoucher();
      return;
    }
    if (this.voucherIndex >= this.voucherItems.length) {
      this.voucherIndex = this.voucherItems.length - 1;
    }
    this.renderVoucherEditor();
  }

  /** Renderiza la imagen activa en el canvas aplicando rotación, zoom y recorte. */
  renderVoucherEditor(): void {
    const canvas = this.voucherCanvas?.nativeElement;
    const item = this.getItemActivo();
    if (!canvas || !item) return;

    // Área de recorte fija (el canvas es el "viewport" del recorte)
    const W = 420;
    const H = 300;
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, W, H);

    const img = item.image;
    // Tamaño base que cubre el canvas manteniendo proporción
    const baseScale = Math.max(W / img.naturalWidth, H / img.naturalHeight);
    const drawW = img.naturalWidth * baseScale * item.scale;
    const drawH = img.naturalHeight * baseScale * item.scale;

    ctx.save();
    ctx.translate(W / 2 + item.panX, H / 2 + item.panY);
    ctx.rotate((item.rotation * Math.PI) / 180);

    const cos = Math.abs(Math.cos((item.rotation * Math.PI) / 180));
    const sin = Math.abs(Math.sin((item.rotation * Math.PI) / 180));
    const boxW = drawW * cos + drawH * sin;
    const boxH = drawW * sin + drawH * cos;

    ctx.drawImage(img, -boxW / 2, -boxH / 2, boxW, boxH);
    ctx.restore();

    // Cuadrícula de recorte (marca visual del área)
    ctx.strokeStyle = 'rgba(2,62,138,0.6)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(0, 0, W, H);
    ctx.strokeStyle = 'rgba(255,255,255,0.4)';
    ctx.setLineDash([6, 6]);
    ctx.strokeRect(1, 1, W - 2, H - 2);
    ctx.setLineDash([]);
  }

  /** Rota la imagen activa 90° a la izquierda o derecha. */
  rotarVoucher(dir: 'left' | 'right'): void {
    const item = this.getItemActivo();
    if (!item) return;
    item.rotation = (item.rotation + (dir === 'right' ? 90 : -90)) % 360;
    this.renderVoucherEditor();
  }

  /** Acerca o aleja (zoom del recorte) de la imagen activa. */
  zoomVoucher(dir: 'in' | 'out'): void {
    const item = this.getItemActivo();
    if (!item) return;
    const step = 0.15;
    item.scale = Math.min(4, Math.max(1, item.scale + (dir === 'in' ? step : -step)));
    this.renderVoucherEditor();
  }

  /** Reinicia rotación, zoom y posición de la imagen activa. */
  resetVoucher(): void {
    const item = this.getItemActivo();
    if (!item) return;
    item.rotation = 0;
    item.scale = 1;
    item.panX = 0;
    item.panY = 0;
    this.renderVoucherEditor();
  }

  onPanStart(event: MouseEvent | TouchEvent): void {
    this.dragging = true;
    const pt = this.getPointer(event);
    this.dragStartX = pt.x;
    this.dragStartY = pt.y;
    event.preventDefault();
  }

  onPanMove(event: MouseEvent | TouchEvent): void {
    if (!this.dragging) return;
    const item = this.getItemActivo();
    if (!item) return;
    const pt = this.getPointer(event);
    const dx = pt.x - this.dragStartX;
    const dy = pt.y - this.dragStartY;
    this.dragStartX = pt.x;
    this.dragStartY = pt.y;
    item.panX += dx;
    item.panY += dy;
    this.renderVoucherEditor();
    event.preventDefault();
  }

  onPanEnd(): void {
    this.dragging = false;
  }

  private getPointer(event: MouseEvent | TouchEvent): { x: number; y: number } {
    if ('touches' in event && event.touches.length > 0) {
      return { x: event.touches[0].clientX, y: event.touches[0].clientY };
    }
    const me = event as MouseEvent;
    return { x: me.clientX, y: me.clientY };
  }

  /** Cierra el editor sin guardar. */
  cancelarEditarVoucher(): void {
    this.editandoVoucher = false;
    this.voucherPago = null;
    this.voucherItems = [];
    this.voucherIndex = 0;
  }

  /** Convierte el canvas (recorte/rotación) de un item en un archivo. */
  private itemToFile(item: VoucherEditItem, index: number): Promise<File> {
    return new Promise((resolve, reject) => {
      const canvas = this.voucherCanvas?.nativeElement;
      if (!canvas) { reject(new Error('Canvas no disponible')); return; }

      // Renderiza el item específico en el canvas y lo exporta
      const W = 420;
      const H = 300;
      canvas.width = W;
      canvas.height = H;
      const ctx = canvas.getContext('2d');
      if (!ctx) { reject(new Error('Canvas 2D no disponible')); return; }

      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, W, H);

      const img = item.image;
      const baseScale = Math.max(W / img.naturalWidth, H / img.naturalHeight);
      const drawW = img.naturalWidth * baseScale * item.scale;
      const drawH = img.naturalHeight * baseScale * item.scale;

      ctx.save();
      ctx.translate(W / 2 + item.panX, H / 2 + item.panY);
      ctx.rotate((item.rotation * Math.PI) / 180);
      const cos = Math.abs(Math.cos((item.rotation * Math.PI) / 180));
      const sin = Math.abs(Math.sin((item.rotation * Math.PI) / 180));
      const boxW = drawW * cos + drawH * sin;
      const boxH = drawW * sin + drawH * cos;
      ctx.drawImage(img, -boxW / 2, -boxH / 2, boxW, boxH);
      ctx.restore();

      canvas.toBlob((blob) => {
        if (!blob) { reject(new Error('No se pudo generar la imagen')); return; }
        const name = item.file.name || `voucher-${index + 1}.jpg`;
        resolve(new File([blob], name, { type: 'image/jpeg' }));
      }, 'image/jpeg', 0.92);
    });
  }

  /** Genera los blobs recortados y sube todos los vouchers con fecha/número de operación. */
  async guardarVoucher(): Promise<void> {
    if (!this.voucherPago || this.voucherItems.length === 0 || this.subiendoVoucher) return;
    this.subiendoVoucher = true;
    try {
      const archivos: File[] = [];
      for (let i = 0; i < this.voucherItems.length; i++) {
        archivos.push(await this.itemToFile(this.voucherItems[i], i));
      }
      this.subirVoucher(this.voucherPago, archivos);
    } catch (e) {
      this.toastr.error('No se pudo generar el recorte de alguna foto', 'Error');
      this.subiendoVoucher = false;
    }
  }

  /** Llama al backend para actualizar el pago y reemplazar sus vouchers (todos). */
  private subirVoucher(pago: PagoLetraResponse, files: File[]): void {
    if (this.subiendoVoucher) return;
    this.subiendoVoucher = true;

    const request: PagoLetraRequest = {
      idLetra: pago.idLetra ?? 0,
      importePagado: pago.importePagado ?? 0,
      medioPago: (pago.medioPago as MedioPago) ?? 'EFECTIVO',
      numeroOperacion: this.voucherNumeroOperacion || pago.numeroOperacion,
      fechaPago: pago.fechaPago,
      fechaOperacion: this.voucherFechaOperacion || undefined,
      observaciones: pago.observaciones
    };

    this.pagoService.actualizarPago(pago.idPago, request, files).subscribe({
      next: () => {
        this.toastr.success(`Voucher${files.length > 1 ? 's' : ''} actualizado correctamente`, 'Éxito');
        this.subiendoVoucher = false;
        this.cancelarEditarVoucher();
        this.cargarPagos();
      },
      error: (err) => {
        const msg = err?.error?.message || 'No se pudo actualizar el voucher';
        this.toastr.error(msg, 'Error');
        this.subiendoVoucher = false;
      }
    });
  }
}