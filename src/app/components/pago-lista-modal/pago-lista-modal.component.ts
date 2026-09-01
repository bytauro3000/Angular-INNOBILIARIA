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
import { VoucherPreviewComponent } from '../voucher-preview/voucher-preview.componente';
import { VoucherOcrData } from '../../services/ocr-voucher.service';

@Component({
  selector: 'app-pago-lista-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, VoucherPreviewComponent],
  templateUrl: './pago-lista-modal.html',
  styleUrls: ['./pago-lista-modal.scss']
})
export class PagoListaModalComponent implements OnInit, AfterViewInit {
  @ViewChild('modalElement') modalElement!: ElementRef;
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

  // ── Editor de voucher (reutiliza voucher-preview: recorte + rotación + OCR) ──
  editandoVoucher = false;
  voucherPago: PagoLetraResponse | null = null;
  voucherFechaOperacion: string = '';
  voucherNumeroOperacion: string = '';
  /** Archivos del voucher en edición (controlados por voucher-preview). */
  voucherFiles: File[] = [];
  /** Números de operación detectados por OCR, por nombre de archivo. */
  private ocrOperationNumbers: Map<string, string> = new Map();
  /** Fechas detectadas por OCR. */
  private ocrFechas: string[] = [];
  /** Para evitar re-asignar el ngModel cada render. */
  voucherFilesModel: File[] = [];

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

  /** Abre el editor de voucher (recorte + rotación + OCR) para el pago. */
  editarVoucher(pago: PagoLetraResponse): void {
    this.voucherPago = pago;
    this.voucherFechaOperacion = pago.fechaOperacion ? pago.fechaOperacion.slice(0, 10) : '';
    this.voucherNumeroOperacion = pago.numeroOperacion || '';
    this.voucherFiles = [];
    this.voucherFilesModel = [];
    this.ocrOperationNumbers.clear();
    this.ocrFechas = [];
    this.editandoVoucher = true;
  }

  /** Recibe los archivos del voucher (después de recorte) desde voucher-preview. */
  onVoucherFilesChange(files: File[]): void {
    this.voucherFiles = files || [];
  }

  /**
   * OCR: autollena la fecha de operación (la MÁS ALTA detectada entre todos los
   * vouchers) y el número de operación separado por coma (igual que el registro).
   */
  onVoucherOcr(data: VoucherOcrData): void {
    if (data.fechaPago) {
      this.ocrFechas.push(data.fechaPago);
      this.actualizarFechaOperacionDesdeOcr();
    }
    if (data.numeroOperacion && data.fileName) {
      this.ocrOperationNumbers.set(data.fileName, data.numeroOperacion);
      this.actualizarNumeroOperacionDesdeOcr();
    }
  }

  private actualizarFechaOperacionDesdeOcr(): void {
    const fechasValidas = this.ocrFechas.filter(f => !!f && !isNaN(new Date(f).getTime()));
    if (fechasValidas.length === 0) return;
    // La fecha más alta (más reciente) de los vouchers
    const max = fechasValidas.reduce((a, b) => (new Date(b) > new Date(a) ? b : a));
    this.voucherFechaOperacion = max.slice(0, 10);
  }

  private actualizarNumeroOperacionDesdeOcr(): void {
    const numeros = Array.from(this.ocrOperationNumbers.values()).filter(Boolean);
    this.voucherNumeroOperacion = numeros.length > 0 ? Array.from(new Set(numeros)).join(', ') : '';
  }

  /** Cierra el editor sin guardar. */
  cancelarEditarVoucher(): void {
    this.editandoVoucher = false;
    this.voucherPago = null;
    this.voucherFiles = [];
    this.voucherFilesModel = [];
    this.ocrOperationNumbers.clear();
    this.ocrFechas = [];
  }

  /** Sube los vouchers recortados con la fecha y número de operación. */
  guardarVoucher(): void {
    if (!this.voucherPago || this.voucherFiles.length === 0 || this.subiendoVoucher) return;
    this.subiendoVoucher = true;

    const request: PagoLetraRequest = {
      idLetra: this.voucherPago.idLetra ?? 0,
      importePagado: this.voucherPago.importePagado ?? 0,
      medioPago: (this.voucherPago.medioPago as MedioPago) ?? 'EFECTIVO',
      numeroOperacion: this.voucherNumeroOperacion || this.voucherPago.numeroOperacion,
      fechaPago: this.voucherPago.fechaPago,
      fechaOperacion: this.voucherFechaOperacion || undefined,
      observaciones: this.voucherPago.observaciones
    };

    this.pagoService.actualizarPago(this.voucherPago.idPago, request, this.voucherFiles).subscribe({
      next: () => {
        this.toastr.success(`Voucher${this.voucherFiles.length > 1 ? 's' : ''} actualizado correctamente`, 'Éxito');
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