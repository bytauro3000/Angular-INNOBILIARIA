import {
  Component, EventEmitter, Input, OnInit, Output,
  ViewChild, ElementRef, AfterViewInit, OnDestroy, NgZone
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import * as bootstrap from 'bootstrap';
import { TokenService } from '../../auth/token.service';

import { LetraCambio } from '../../models/letra-cambio.model';
import { PagoLetraService } from '../../services/pagoletra.service';
import { obtenerFechaPeru } from '../../utils/fecha-peru';
import { PagosMultiplesRequest } from '../../dto/pagosmultiplesrequest.dto';
import { PagoLetraRequest } from '../../dto/pagoletrarequest.dto';
import { MedioPago } from '../../enums/mediopago.enum';
import { TipoComprobante } from '../../enums/tipocomprobante';
import { VoucherPreviewComponent } from '../voucher-preview/voucher-preview.componente';
import { VoucherOcrData } from '../../services/ocr-voucher.service';

@Component({
  selector: 'app-pago-multiple-form',
  standalone: true,
  imports: [CommonModule, FormsModule, VoucherPreviewComponent],
  templateUrl: './pagoletra-multiple-insertar.html',
  styleUrls: ['./pagoletra-multiple-insertar.scss']
})
export class PagoletraMultipleInsertarComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('modalElement') modalElement!: ElementRef;
  @ViewChild('numeroComprobanteInput') numeroComprobanteInput!: ElementRef<HTMLInputElement>;
  private modal?: bootstrap.Modal;

  @Input() letras: LetraCambio[] = [];
  @Input() contrato!: any;

  @Output() onClose = new EventEmitter<void>();
  /** Emite el número de comprobante generado (ej: "EB01-0001") al padre para abrir el PDF. */
  @Output() onPagoExitoso = new EventEmitter<string | null>();

  medioPagoOptions = Object.values(MedioPago);
  tipoComprobanteOptions = Object.values(TipoComprobante).filter(t => t === 'RECIBO' || t === 'BOLETA');

  datosComunes = {
    medioPago: MedioPago.EFECTIVO,
    numeroOperacion: '',
    fechaPago: '',
    fechaOperacion: '',
    tipoComprobante: undefined as TipoComprobante | undefined,
    observaciones: ''
  };

  aplicarDescuento: boolean = false;
  descuentoNegociado: number = 0;
  motivoDescuento: string = '';

  aplicarLetraGratis: boolean = false;
  idLetraGratis: number | null = null;
  motivoLetraGratis: string = '';

  numeroComprobantePreview: string = '';
  cargandoPreview: boolean = false;
  modoManualComprobante: boolean = false;
  numeroComprobanteManual: string = '';

  // Número de letra más alta ya pagada en el contrato (sin anulados).
  // Se usa para detectar backfill y omitir la auto-descarga del PDF.
  private maximaLetraPagada: number = 0;

  voucherFiles: File[] = [];
  private ocrOperationNumbers: Map<string, string> = new Map();
  enviando: boolean = false;

  // ── Control de cierre limpio ───────────────────────────────────────────────
  private hiddenListener?: () => void;
  private pagoExitosoAlCerrar: boolean = false;
  /** Número de comprobante generado por el backend; se emite al padre al cerrar. */
  private numeroComprobanteGenerado: string | null = null;

  get subtotalLetras(): number {
    return this.letras.reduce((acc, l) => acc + l.importe, 0);
  }

  get importeTotal(): number {
    const total = this.subtotalLetras;
    const desc = this.aplicarDescuento ? (this.descuentoNegociado || 0) : 0;
    return Math.max(0, total - desc);
  }

  get simboloMoneda(): string {
    return this.contrato?.moneda === 'PEN' ? 'S/.' : '$';
  }

  get letraGratisSeleccionada(): LetraCambio | undefined {
    return this.letras.find(l => l.idLetra === this.idLetraGratis);
  }

  constructor(
    private pagoService: PagoLetraService,
    private toastr: ToastrService,
    private ngZone: NgZone,
    private tokenSvc: TokenService
  ) {}

  get esSoporte(): boolean {
    return this.tokenSvc.getRole() === 'ROLE_SOPORTE';
  }

  ngOnInit(): void {
    this.datosComunes.fechaPago = obtenerFechaPeru();
    this.generarObservaciones();
    this.cargarTipoComprobanteSugerido();
  }

  private cargarTipoComprobanteSugerido(): void {
    if (!this.contrato?.idContrato) return;
    this.pagoService.listarPorContrato(this.contrato.idContrato).subscribe({
      next: (pagos) => {
        if (!pagos || pagos.length === 0) return;
        const pagosValidos = pagos.filter(p => !p.anulado);
        if (pagosValidos.length === 0) return;
        const ultimoPago = pagosValidos.reduce((max, p) => p.idPago > max.idPago ? p : max);
        if (ultimoPago.tipoComprobante) {
          this.datosComunes.tipoComprobante = ultimoPago.tipoComprobante as TipoComprobante;
          this.onTipoComprobanteChange();
        }
        this.maximaLetraPagada = pagosValidos.reduce((max, p) => {
          const numStr = p.numeroLetra?.split('/')[0];
          const num = numStr ? parseInt(numStr, 10) : NaN;
          return !isNaN(num) && num > max ? num : max;
        }, 0);
      },
      error: () => { /* si falla, no preselecciona nada */ }
    });
  }

  ngAfterViewInit(): void {
    this.modal = new bootstrap.Modal(this.modalElement.nativeElement, {
      backdrop: 'static',
      keyboard: false
    });

    // El evento 'hidden.bs.modal' se dispara cuando Bootstrap TERMINA su animación
    // de cierre y ya restauró todos los estilos del body (_resetAdjustments incluido).
    // Usamos requestAnimationFrame para asegurarnos de que el ciclo de render de
    // Bootstrap haya completado antes de que Angular destruya el componente vía *ngIf.
    this.hiddenListener = () => {
      // Bootstrap ya terminó: podemos limpiar el backdrop residual con seguridad.
      requestAnimationFrame(() => {
        this.limpiarBackdropResidual();
        // Volvemos a zona Angular para emitir el output y disparar change detection.
        this.ngZone.run(() => {
          if (this.pagoExitosoAlCerrar) {
            this.onPagoExitoso.emit(this.numeroComprobanteGenerado);
          } else {
            this.onClose.emit();
          }
        });
      });
    };

    this.modalElement.nativeElement.addEventListener('hidden.bs.modal', this.hiddenListener);
    this.modal.show();
  }

  ngOnDestroy(): void {
    if (this.hiddenListener) {
      this.modalElement?.nativeElement?.removeEventListener('hidden.bs.modal', this.hiddenListener);
    }
    // dispose() solo si el modal ya está oculto para no interrumpir animaciones en curso.
    const el = this.modalElement?.nativeElement;
    if (el && !el.classList.contains('show')) {
      this.modal?.dispose();
    }
  }

  cerrarModal(): void {
    const el = this.modalElement?.nativeElement;
    if (el && el.classList.contains('show')) {
      // Bootstrap cierra con animación → hiddenListener se encarga del resto.
      this.modal?.hide();
    } else {
      // Modal ya oculto (caso borde): emitimos directamente.
      this.limpiarBackdropResidual();
      if (this.pagoExitosoAlCerrar) {
        this.onPagoExitoso.emit(this.numeroComprobanteGenerado);
      } else {
        this.onClose.emit();
      }
    }
  }

  /**
   * Solo elimina backdrops huérfanos que Bootstrap no haya limpiado.
   * NO toca body.style: Bootstrap lo gestiona internamente con _resetAdjustments.
   * Tocarlo mientras Bootstrap corre causa el TypeError de 'style'.
   */
  private limpiarBackdropResidual(): void {
    document.querySelectorAll('.modal-backdrop').forEach(el => el.remove());
    // Quitar modal-open solo si no hay otros modales abiertos
    if (!document.querySelector('.modal.show')) {
      document.body.classList.remove('modal-open');
    }
  }

  getNumeroLetraLimpio(numeroLetra: string): string {
    return numeroLetra ? numeroLetra.split('/')[0] : '';
  }

  private generarObservaciones(): void {
    if (!this.contrato || !this.contrato.lotes || this.contrato.lotes.length === 0) return;
    const primerLote = this.contrato.lotes[0];
    const mz = primerLote.manzana || '';
    const lt = primerLote.numeroLote || '';
    const programa: string =
      primerLote.programa?.nombrePrograma
      || primerLote.nombrePrograma
      || this.contrato.programa?.nombrePrograma
      || '';

    // Obtener los números de letra ordenados numéricamente
    const numerosLetras = this.letras
      .map(l => this.getNumeroLetraLimpio(l.numeroLetra))
      .filter(n => n !== '')
      .sort((a, b) => parseInt(a) - parseInt(b));

    let letrasStr: string;
    if (numerosLetras.length === 0) {
      letrasStr = '';
    } else if (numerosLetras.length === 1) {
      letrasStr = numerosLetras[0];
    } else {
      const anteriores = numerosLetras.slice(0, -1).join(', ');
      const ultima = numerosLetras[numerosLetras.length - 1];
      letrasStr = anteriores + ' y ' + ultima;
    }

    this.datosComunes.observaciones =
      `Pago de las letras ${letrasStr} de la Mz. ${mz} Lt. ${lt} del Programa: ${programa}`;
  }

  onMedioPagoChange(): void {
    if (this.datosComunes.medioPago === MedioPago.EFECTIVO) {
      this.datosComunes.numeroOperacion = '';
      this.voucherFiles = [];
    }
  }

  /**
   * Recibe los datos extraídos por OCR del voucher.
   * Sobrescribe siempre los campos detectados (el usuario puede corregir manualmente después).
   */
  onVoucherOcr(data: VoucherOcrData): void {
    console.log('[OCR] Datos extraídos:', data);

    const cambios: string[] = [];

    if (data.numeroOperacion && data.fileName) {
      this.ocrOperationNumbers.set(data.fileName, data.numeroOperacion);
      this.actualizarNumeroOperacion();
      cambios.push(`N° op: ${data.numeroOperacion}`);
    }

    if (data.fechaPago) {
      this.datosComunes.fechaOperacion = data.fechaPago;
      cambios.push(`Fecha op: ${data.fechaPago}`);
    }

    if (cambios.length > 0) {
      this.toastr.info(
        `Detectado (${data.confidence.toFixed(0)}% conf.): ${cambios.join(' | ')}`,
        'OCR'
      );
    } else {
      this.toastr.warning(
        `No se pudo extraer datos del voucher "${data.fileName ?? ''}". Lláenalos manualmente.`,
        'OCR'
      );
    }
  }

  onVoucherFilesChange(files: File[]): void {
    const nombresActuales = new Set(files.map(f => f.name));
    for (const fileName of this.ocrOperationNumbers.keys()) {
      if (!nombresActuales.has(fileName)) {
        this.ocrOperationNumbers.delete(fileName);
      }
    }
    this.actualizarNumeroOperacion();
  }

  private actualizarNumeroOperacion(): void {
    const numeros = Array.from(this.ocrOperationNumbers.values());
    this.datosComunes.numeroOperacion = numeros.length > 0 ? numeros.join(', ') : '';
  }

  onTipoComprobanteChange(): void {
    this.numeroComprobantePreview = '';
    this.modoManualComprobante = false;
    this.numeroComprobanteManual = '';
    if (this.datosComunes.tipoComprobante) {
      this.cargandoPreview = true;
      this.pagoService.previewSiguienteNumeroComprobante(this.datosComunes.tipoComprobante).subscribe({
        next: (numero) => {
          this.numeroComprobantePreview = numero;
          this.cargandoPreview = false;
        },
        error: () => { this.cargandoPreview = false; }
      });
    }
  }

  private get seriePrefix(): string {
    const idx = this.numeroComprobantePreview.indexOf('-');
    return idx >= 0 ? this.numeroComprobantePreview.substring(0, idx + 1) : '';
  }

  toggleModoManual(): void {
    if (this.cargandoPreview) return;
    if (!this.datosComunes.tipoComprobante) return;
    this.modoManualComprobante = !this.modoManualComprobante;
    if (this.modoManualComprobante) {
      this.numeroComprobanteManual = 'EB01-';
      setTimeout(() => {
        const input = this.numeroComprobanteInput?.nativeElement;
        if (!input) return;
        input.focus();
        input.setSelectionRange(5, 5);
      }, 0);
    } else {
      this.numeroComprobanteManual = '';
    }
  }

  onNumeroManualChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    let valor = input.value;
    if (!valor.startsWith('EB01-')) {
      valor = 'EB01-';
    } else {
      const soloDigitos = valor.substring(5).replace(/\D/g, '');
      valor = 'EB01-' + soloDigitos;
    }
    input.value = valor;
    this.numeroComprobanteManual = valor;
  }

  onNumeroComprobanteFocus(event: FocusEvent): void {
    if (!this.modoManualComprobante) return;
    const input = event.target as HTMLInputElement;
    const guionIdx = input.value.indexOf('-');
    if (guionIdx < 0) return;
    setTimeout(() => input.setSelectionRange(guionIdx + 1, guionIdx + 1), 0);
  }

  onNumeroComprobanteBlur(event: FocusEvent): void {
    if (!this.modoManualComprobante || !this.numeroComprobanteManual) return;
    if (!this.numeroComprobantePreview) return;

    const previewParts = this.numeroComprobantePreview.split('-');
    if (previewParts.length < 2) return;
    const expectedSerie = previewParts[0];
    const expectedNumero = parseInt(previewParts[1], 10);

    const typed = this.numeroComprobanteManual.trim();
    let typedSerie: string;
    let typedNumero: number;

    if (typed.includes('-')) {
      const parts = typed.split('-');
      typedSerie = parts[0].trim().toUpperCase();
      typedNumero = parseInt(parts[1].trim(), 10);
    } else {
      typedSerie = expectedSerie;
      typedNumero = parseInt(typed, 10);
    }

    if (isNaN(typedNumero)) return;

    if (typedSerie.startsWith('B') && typedNumero !== expectedNumero) {
      this.toastr.warning(
        `El siguiente número correlativo es ${this.numeroComprobantePreview}`,
        'Serie correlativa'
      );
      this.numeroComprobanteManual = this.numeroComprobantePreview;
    }
  }

  toggleDescuento(): void {
    this.aplicarDescuento = !this.aplicarDescuento;
    if (!this.aplicarDescuento) {
      this.descuentoNegociado = 0;
      this.motivoDescuento = '';
    }
  }

  toggleLetraGratis(): void {
    this.aplicarLetraGratis = !this.aplicarLetraGratis;
    if (!this.aplicarLetraGratis) {
      this.idLetraGratis = null;
      this.motivoLetraGratis = '';
    }
  }

  guardar(): void {
    if (this.letras.length === 0) {
      this.toastr.warning('No hay letras seleccionadas', 'Validación');
      return;
    }
    if (!this.datosComunes.medioPago) {
      this.toastr.warning('Debe seleccionar un medio de pago', 'Validación');
      return;
    }
    if (!this.datosComunes.tipoComprobante) {
      this.toastr.warning('Debe seleccionar el tipo de comprobante', 'Validación');
      return;
    }
    if (this.datosComunes.medioPago !== MedioPago.EFECTIVO) {
      if (!this.datosComunes.numeroOperacion?.trim()) {
        this.toastr.warning('El número de operación es obligatorio para este medio de pago', 'Validación');
        return;
      }
      if (this.voucherFiles.length === 0) {
        this.toastr.warning('Debe adjuntar al menos un voucher para este medio de pago', 'Validación');
        return;
      }
    }
    if (this.aplicarDescuento) {
      if (!this.descuentoNegociado || this.descuentoNegociado <= 0) {
        this.toastr.warning('Ingrese un monto de descuento válido', 'Validación');
        return;
      }
      if (!this.motivoDescuento?.trim()) {
        this.toastr.warning('Debe indicar el motivo del descuento', 'Validación');
        return;
      }
    }
    if (this.aplicarLetraGratis) {
      if (!this.idLetraGratis) {
        this.toastr.warning('Debe seleccionar la letra que se otorgará como gratis', 'Validación');
        return;
      }
      if (!this.motivoLetraGratis?.trim()) {
        this.toastr.warning('Debe indicar el motivo de la letra gratis', 'Validación');
        return;
      }
    }

    // Excluir la letra gratis del lote de pagos normales (se procesa aparte en el backend)
    const letrasAPagar = this.letras.filter(l => l.idLetra !== this.idLetraGratis);
    const pagos: PagoLetraRequest[] = letrasAPagar.map(l => ({
      idLetra: l.idLetra,
      // Usar saldoPendiente si existe y es > 0 (letras con pagos parciales previos),
      // de lo contrario usar el importe original de la letra.
      importePagado: (l.saldoPendiente != null && l.saldoPendiente > 0) ? l.saldoPendiente : l.importe,
      medioPago: this.datosComunes.medioPago,
      numeroOperacion: this.datosComunes.numeroOperacion || undefined,
      fechaPago: this.datosComunes.fechaPago || obtenerFechaPeru(),
      fechaOperacion: this.datosComunes.fechaOperacion,
      tipoComprobante: this.datosComunes.tipoComprobante,
      numeroComprobantePersonalizado: this.modoManualComprobante && this.numeroComprobanteManual
        ? this.numeroComprobanteManual
        : undefined,
      observaciones: this.datosComunes.observaciones,
      esPagoAcuenta: false
    }));

    const request: PagosMultiplesRequest = {
      pagos,
      descuentoNegociado: this.aplicarDescuento ? this.descuentoNegociado : undefined,
      motivoDescuento: this.aplicarDescuento ? this.motivoDescuento : undefined,
      idLetraGratis: this.aplicarLetraGratis && this.idLetraGratis ? this.idLetraGratis : undefined,
      motivoLetraGratis: this.aplicarLetraGratis ? this.motivoLetraGratis : undefined
    };

    this.enviando = true;
    this.pagoService.registrarPagosMultiples(request, this.voucherFiles).subscribe({
      next: (res) => {
        // Determinar si es backfill: la letra más alta del lote es menor
        // a la letra más alta ya pagada en el contrato.
        const maxLetraLote = this.letras.reduce((max, l) => {
          const numStr = l.numeroLetra?.split('/')[0];
          const num = numStr ? parseInt(numStr, 10) : NaN;
          return !isNaN(num) && num > max ? num : max;
        }, 0);
        const esBackfill = this.maximaLetraPagada > 0
          && !isNaN(maxLetraLote)
          && maxLetraLote < this.maximaLetraPagada;

        // Si es backfill, NO emitir el comprobante para que el padre no abra el PDF
        this.numeroComprobanteGenerado = esBackfill
          ? null
          : (res?.numeroComprobanteGenerado ?? null);

        const sunatOk = res?.pagos?.some((p: any) => p.sunatAceptado);
        let msg = 'Pagos múltiples registrados correctamente';
        if (sunatOk) msg += '. Boleta enviada a SUNAT: ACEPTADA';
        this.toastr.success(msg, 'Éxito', { timeOut: 6000 });
        this.enviando = false;
        this.pagoExitosoAlCerrar = true;
        this.cerrarModal();
      },
      error: (err) => {
        const mensaje = err.error?.message || 'Error al registrar los pagos';
        this.toastr.error(mensaje, 'Error');
        this.enviando = false;
        if (this.datosComunes.tipoComprobante && mensaje.includes('correlativa')) {
          this.modoManualComprobante = false;
          this.numeroComprobanteManual = '';
          this.onTipoComprobanteChange();
        }
      }
    });
  }
}