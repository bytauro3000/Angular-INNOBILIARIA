import {
  Component, EventEmitter, Input, OnInit, Output,
  ViewChild, ElementRef, AfterViewInit, OnDestroy, NgZone
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import * as bootstrap from 'bootstrap';

import { MoraService } from '../../services/mora.service';
import { PagoLetraService } from '../../services/pagoletra.service';
import { TokenService } from '../../auth/token.service';
import { MoraResponse } from '../../dto/moraresponse.dto';
import { MoraPagoItem, MoraPagosMultiplesRequest, MoraPagosMultiplesResponse } from '../../dto/moraspagosmultiplesrequest.dto';
import { MedioPago } from '../../enums/mediopago.enum';
import { TipoComprobante } from '../../enums/tipocomprobante';
import { VoucherPreviewComponent } from '../voucher-preview/voucher-preview.componente';
import { VoucherOcrData } from '../../services/ocr-voucher.service';
import { obtenerFechaPeru } from '../../utils/fecha-peru';

@Component({
  selector: 'app-mora-multiple-pagar',
  standalone: true,
  imports: [CommonModule, FormsModule, VoucherPreviewComponent],
  templateUrl: './mora-multiple-pagar.html',
  styleUrls: ['./mora-multiple-pagar.scss']
})
export class MoraMultiplePagarComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('modalElement') modalElement!: ElementRef;
  @ViewChild('numeroComprobanteInput') numeroComprobanteInput!: ElementRef<HTMLInputElement>;
  private modal?: bootstrap.Modal;

  @Input() moras: MoraResponse[] = [];
  @Input() simboloMoneda = '$';

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
    numeroComprobantePersonalizado: undefined as string | undefined,
    observaciones: ''
  };

  /** Monto a pagar por mora (editable → permite pago parcial por mora). */
  montos: Record<number, number> = {};

  aplicarDescuento = false;
  descuentoNegociado = 0;
  motivoDescuento = '';

  numeroComprobantePreview = '';
  cargandoPreview = false;
  modoManualComprobante = false;
  numeroComprobanteManual = '';

  voucherFiles: File[] = [];
  private ocrOperationNumbers: Map<string, string> = new Map();
  private ocrFechaOperacion: string | null = null;
  private ocrHoraOperacion: string | null = null;
  enviando = false;

  // ── Control de cierre limpio ───────────────────────────────────────────────
  private hiddenListener?: () => void;
  private pagoExitosoAlCerrar = false;
  /** Número de comprobante generado por el backend; se emite al padre al cerrar. */
  private numeroComprobanteGenerado: string | null = null;

  constructor(
    private moraService: MoraService,
    private pagoLetraService: PagoLetraService,
    private toastr: ToastrService,
    private ngZone: NgZone,
    private tokenSvc: TokenService
  ) {}

  get esSoporte(): boolean {
    return this.tokenSvc.getRole() === 'ROLE_SOPORTE';
  }

  get subtotalMoras(): number {
    return this.moras.reduce((acc, m) => acc + (this.montos[m.idMora] || 0), 0);
  }

  get importeTotal(): number {
    const desc = this.aplicarDescuento ? (this.descuentoNegociado || 0) : 0;
    return Math.max(0, this.subtotalMoras - desc);
  }

  /** Saldo pendiente de una mora (base del monto editable). */
  saldoDe(mora: MoraResponse): number {
    return mora.saldoPendiente ?? mora.montoMoraTotal;
  }

  /** true si el monto de la mora está fuera del rango válido (0, saldo]. */
  montoInvalido(mora: MoraResponse): boolean {
    const monto = this.montos[mora.idMora] || 0;
    return monto <= 0 || monto > this.saldoDe(mora) + 0.009;
  }

  getNumeroLetraLimpio(numeroLetra: string): string {
    return numeroLetra ? numeroLetra.split('/')[0] : '';
  }

  ngOnInit(): void {
    this.datosComunes.fechaPago = obtenerFechaPeru();
    // Por defecto se paga el saldo completo de cada mora (editable para pago parcial)
    this.moras.forEach(m => { this.montos[m.idMora] = this.saldoDe(m); });
    this.generarObservaciones();
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
      requestAnimationFrame(() => {
        this.limpiarBackdropResidual();
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
   */
  private limpiarBackdropResidual(): void {
    document.querySelectorAll('.modal-backdrop').forEach(el => el.remove());
    if (!document.querySelector('.modal.show')) {
      document.body.classList.remove('modal-open');
    }
  }

  private generarObservaciones(): void {
    const numeros = this.moras
      .map(m => this.getNumeroLetraLimpio(m.numeroLetra))
      .filter(n => n !== '')
      .sort((a, b) => parseInt(a, 10) - parseInt(b, 10));

    if (numeros.length === 0) return;

    const letrasStr = numeros.length === 1
      ? numeros[0]
      : numeros.slice(0, -1).join(', ') + ' y ' + numeros[numeros.length - 1];

    this.datosComunes.observaciones = `Pago de mora de las letras ${letrasStr}`;
  }

  onMedioPagoChange(): void {
    if (this.datosComunes.medioPago === MedioPago.EFECTIVO) {
      this.datosComunes.numeroOperacion = '';
      this.datosComunes.fechaOperacion = '';
      this.ocrFechaOperacion = null;
      this.ocrHoraOperacion = null;
      this.voucherFiles = [];
    } else if (!this.datosComunes.fechaOperacion) {
      this.datosComunes.fechaOperacion = obtenerFechaPeru();
    }
  }

  /**
   * Recibe los datos extraídos por OCR del voucher.
   * Sobrescribe siempre los campos detectados (el usuario puede corregir manualmente después).
   */
  onVoucherOcr(data: VoucherOcrData): void {
    const cambios: string[] = [];

    if (data.numeroOperacion && data.fileName) {
      this.ocrOperationNumbers.set(data.fileName, data.numeroOperacion);
      this.actualizarNumeroOperacion();
      cambios.push(`N° op: ${data.numeroOperacion}`);
    }

    if (data.fechaPago) {
      this.datosComunes.fechaOperacion = data.fechaPago;
      this.ocrFechaOperacion = data.fechaPago;
      cambios.push(`Fecha op: ${data.fechaPago}`);
    }

    if (data.horaOperacion) {
      this.ocrHoraOperacion = data.horaOperacion;
      cambios.push(`Hora op: ${data.horaOperacion}`);
    }

    if (cambios.length > 0) {
      this.toastr.info(
        `Detectado (${data.confidence.toFixed(0)}% conf.): ${cambios.join(' | ')}`,
        'OCR'
      );
    } else {
      this.toastr.warning(
        `No se pudo extraer datos del voucher "${data.fileName ?? ''}". Ingréselos manualmente.`,
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
    if (files.length === 0) {
      this.ocrFechaOperacion = null;
      this.ocrHoraOperacion = null;
    }
    this.actualizarNumeroOperacion();
  }

  private actualizarNumeroOperacion(): void {
    const numeros = Array.from(this.ocrOperationNumbers.values());
    this.datosComunes.numeroOperacion = numeros.length > 0 ? numeros.join(', ') : '';
  }

  /**
   * Al seleccionar tipo de comprobante, consulta el siguiente número disponible
   * (secuencia compartida con pagos de letra) y lo muestra como preview readonly.
   */
  onTipoComprobanteChange(): void {
    this.numeroComprobantePreview = '';
    this.modoManualComprobante = false;
    this.numeroComprobanteManual = '';
    this.datosComunes.numeroComprobantePersonalizado = undefined;
    if (this.datosComunes.tipoComprobante) {
      this.cargandoPreview = true;
      this.pagoLetraService.previewSiguienteNumeroComprobante(this.datosComunes.tipoComprobante).subscribe({
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

  /** Alterna entre modo automático y modo manual para el N° comprobante */
  toggleModoManual(): void {
    if (this.cargandoPreview) return;
    if (!this.datosComunes.tipoComprobante) return;
    this.modoManualComprobante = !this.modoManualComprobante;
    if (this.modoManualComprobante) {
      this.numeroComprobanteManual = this.seriePrefix;
      this.datosComunes.numeroComprobantePersonalizado = undefined;
      setTimeout(() => {
        const input = this.numeroComprobanteInput?.nativeElement;
        if (!input) return;
        input.focus();
        input.setSelectionRange(this.seriePrefix.length, this.seriePrefix.length);
      }, 0);
    } else {
      this.numeroComprobanteManual = '';
      this.datosComunes.numeroComprobantePersonalizado = undefined;
    }
  }

  /** Captura el valor ingresado manualmente, protegiendo el prefijo de serie */
  onNumeroManualChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const prefijo = this.seriePrefix;
    let valor = input.value;
    if (prefijo && !valor.startsWith(prefijo)) {
      valor = prefijo;
      input.value = valor;
    }
    this.numeroComprobanteManual = valor;
    const soloDigitos = valor.substring(prefijo.length).trim();
    this.datosComunes.numeroComprobantePersonalizado = soloDigitos ? valor.trim() : undefined;
  }

  toggleDescuento(): void {
    this.aplicarDescuento = !this.aplicarDescuento;
    if (!this.aplicarDescuento) {
      this.descuentoNegociado = 0;
      this.motivoDescuento = '';
    }
  }

  guardar(): void {
    if (this.enviando) return;

    if (this.moras.length === 0) {
      this.toastr.warning('No hay moras seleccionadas', 'Validación');
      return;
    }

    // Montos por mora (pago parcial: 0 < monto ≤ saldo)
    for (const m of this.moras) {
      const monto = this.montos[m.idMora] || 0;
      if (monto <= 0) {
        this.toastr.warning(
          `Ingrese un monto válido para la mora de la letra N° ${this.getNumeroLetraLimpio(m.numeroLetra)}`,
          'Validación');
        return;
      }
      if (monto > this.saldoDe(m) + 0.009) {
        this.toastr.warning(
          `El monto de la letra N° ${this.getNumeroLetraLimpio(m.numeroLetra)} no puede superar su saldo (${this.simboloMoneda} ${this.saldoDe(m).toFixed(2)})`,
          'Validación');
        return;
      }
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
      if (!this.datosComunes.fechaOperacion) {
        this.toastr.warning('La fecha de operación es obligatoria para este medio de pago', 'Validación');
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
      if (this.descuentoNegociado >= this.subtotalMoras) {
        this.toastr.warning('El descuento debe ser menor al subtotal de las moras', 'Validación');
        return;
      }
      if (!this.motivoDescuento?.trim()) {
        this.toastr.warning('Debe indicar el motivo del descuento', 'Validación');
        return;
      }
    }

    const pagos: MoraPagoItem[] = this.moras.map(m => ({
      idMora: m.idMora,
      importePagado: this.montos[m.idMora]
    }));

    const request: MoraPagosMultiplesRequest = {
      pagos,
      descuentoNegociado: this.aplicarDescuento ? this.descuentoNegociado : undefined,
      motivoDescuento: this.aplicarDescuento ? this.motivoDescuento : undefined,
      fechaPago: this.datosComunes.fechaPago || obtenerFechaPeru(),
      fechaOperacion: this.datosComunes.fechaOperacion,
      // La hora del voucher solo aplica si la fecha de operación sigue siendo la detectada por OCR
      horaOperacion: this.ocrHoraOperacion && this.ocrFechaOperacion &&
        this.datosComunes.fechaOperacion === this.ocrFechaOperacion
        ? this.ocrHoraOperacion
        : undefined,
      medioPago: this.datosComunes.medioPago,
      numeroOperacion: this.datosComunes.numeroOperacion || undefined,
      tipoComprobante: this.datosComunes.tipoComprobante,
      numeroComprobantePersonalizado: this.modoManualComprobante
        ? this.datosComunes.numeroComprobantePersonalizado
        : undefined,
      observaciones: this.datosComunes.observaciones
    };

    this.enviando = true;
    this.moraService.pagarMorasMultiples(request, this.voucherFiles).subscribe({
      next: (res: MoraPagosMultiplesResponse) => {
        this.numeroComprobanteGenerado = res?.numeroComprobanteGenerado ?? null;

        const sunatOk = res?.pagos?.some((p: any) => p.sunatAceptado);
        const sunatAdvertencia = res?.pagos?.find((p: any) => p.sunatAdvertencia)?.sunatAdvertencia;
        let msg = 'Pagos de mora registrados correctamente';
        if (sunatOk) msg += '. Boleta enviada a SUNAT: ACEPTADA';
        this.toastr.success(msg, 'Éxito', { timeOut: 6000 });
        if (sunatAdvertencia) {
          this.toastr.warning(sunatAdvertencia, 'Aviso SUNAT', { timeOut: 10000 });
        }
        this.enviando = false;
        this.pagoExitosoAlCerrar = true;
        this.cerrarModal();
      },
      error: (err) => {
        const mensaje = err.error?.message || 'Error al registrar los pagos de mora';
        this.toastr.error(mensaje, 'Error');
        this.enviando = false;
        if (this.datosComunes.tipoComprobante && mensaje.includes('correlativa')) {
          this.modoManualComprobante = false;
          this.numeroComprobanteManual = '';
          this.datosComunes.numeroComprobantePersonalizado = undefined;
          this.onTipoComprobanteChange();
        }
      }
    });
  }
}
