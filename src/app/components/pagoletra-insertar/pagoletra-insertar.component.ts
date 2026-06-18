import {
  Component, EventEmitter, Input, OnInit, Output,
  ViewChild, ElementRef, AfterViewInit, OnDestroy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import * as bootstrap from 'bootstrap';

import { LetraCambio } from '../../models/letra-cambio.model';
import { PagoLetraService } from '../../services/pagoletra.service';
import { MoraService } from '../../services/mora.service';
import { PagoLetraRequest } from '../../dto/pagoletrarequest.dto';
import { PagoMoraRequest } from '../../dto/pagomorarequest.dto';
import { PagoLetraResponse } from '../../dto/pagoletraresponse.dto';
import { CalculoMoraDTO } from '../../dto/calculomora.dto';
import { MedioPago } from '../../enums/mediopago.enum';
import { TipoComprobante } from '../../enums/tipocomprobante';
import { VoucherPreviewComponent } from '../voucher-preview/voucher-preview.componente';
import { VoucherOcrData } from '../../services/ocr-voucher.service';

@Component({
  selector: 'app-pago-letra-form',
  standalone: true,
  imports: [CommonModule, FormsModule, VoucherPreviewComponent],
  templateUrl: './pagoletra-insertar.html',
  styleUrls: ['./pagoletra-insertar.scss']
})
export class PagoletraInsertarComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('modalElement') modalElement!: ElementRef;
  @ViewChild('numeroComprobanteInput') numeroComprobanteInput!: ElementRef<HTMLInputElement>;
  private modal?: bootstrap.Modal;

  @Input() letra!: LetraCambio;
  @Input() contrato!: any;
  @Input() calculoMora: CalculoMoraDTO | null = null;
  @Input() moraPreviamentePagada: boolean = false;

  @Output() onClose = new EventEmitter<void>();
  @Output() onPagoExitoso = new EventEmitter<void>();

  medioPagoOptions = Object.values(MedioPago);
  tipoComprobanteOptions = Object.values(TipoComprobante).filter(t => t === 'RECIBO' || t === 'BOLETA');

  pagoRequest: PagoLetraRequest = {
    idLetra: 0,
    importePagado: 0,
    medioPago: MedioPago.EFECTIVO,
    numeroOperacion: '',
    fechaPago: '',
    tipoComprobante: undefined,
    numeroComprobantePersonalizado: undefined,
    observaciones: '',
    esPagoAcuenta: false
  };

  saldoActual: number = 0;
  modoPagoAcuenta: boolean = false;
  cargandoSaldo: boolean = false;

  numeroComprobantePreview: string = '';
  cargandoPreview: boolean = false;
  modoManualComprobante: boolean = false;
  numeroComprobanteManual: string = '';
  serieEditable: string = '';

  voucherFiles: File[] = [];
  enviando: boolean = false;
  recalculandoMora: boolean = false;

  pagarMoraTambien: boolean = false;
  moraDecisionTomada: boolean = false;
  pagandoMora: boolean = false;

  // Número de letra más alta ya pagada en el contrato (sin anulados).
  // Se usa para detectar backfill y omitir la auto-descarga del PDF.
  private maximaLetraPagada: number = 0;

  // ── Control de cierre sin race condition ──────────────────────────────────
  private _hiddenHandler?: EventListener;

  constructor(
    private pagoService: PagoLetraService,
    private moraService: MoraService,
    private toastr: ToastrService
  ) {}

  // Fecha con la que se calculó la mora originalmente (para detectar si cambió)
  private fechaCalculoMora: string = '';

  ngOnInit(): void {
    this.pagoRequest.idLetra = this.letra.idLetra;
    this.pagoRequest.fechaPago = new Date().toISOString().split('T')[0];
    // Guardamos la fecha con que se calculó la mora (la fecha actual al abrir el modal)
    this.fechaCalculoMora = this.pagoRequest.fechaPago;
    this.generarObservaciones();

    if (this.letra.estadoLetra === 'PARCIAL') {
      this.cargandoSaldo = true;
      this.pagoService.consultarSaldo(this.letra.idLetra).subscribe({
        next: (res) => {
          this.saldoActual = res.saldoPendiente;
          this.pagoRequest.importePagado = this.saldoActual;
          this.cargandoSaldo = false;
        },
        error: () => {
          this.saldoActual = this.letra.saldoPendiente ?? this.letra.importe;
          this.pagoRequest.importePagado = this.saldoActual;
          this.cargandoSaldo = false;
        }
      });
    } else {
      this.saldoActual = this.letra.importe;
      this.pagoRequest.importePagado = this.saldoActual;
    }

    if (this.moraPreviamentePagada) {
      this.pagarMoraTambien = false;
      this.moraDecisionTomada = true;
    } else {
      this.pagarMoraTambien = false;
      this.moraDecisionTomada = false;
    }

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
          this.pagoRequest.tipoComprobante = ultimoPago.tipoComprobante as TipoComprobante;
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
    const el = this.modalElement.nativeElement;

    // ── SOLUCIÓN DEFINITIVA AL ERROR DE BOOTSTRAP ─────────────────────────
    // El evento 'hidden.bs.modal' se dispara DESPUÉS de que Bootstrap termina
    // su transición CSS de 300ms. Sólo entonces destruimos el componente via
    // onClose.emit(). Esto elimina la race condition entre setTimeout(300ms) y
    // Bootstrap internamente. Con setTimeout ambos corren en paralelo y a veces
    // Bootstrap intenta acceder al DOM cuando Angular ya lo destruyó → crash.
    this._hiddenHandler = () => {
      this._limpiarDOM();
      this.onClose.emit();
    };
    el.addEventListener('hidden.bs.modal', this._hiddenHandler);

    this.modal = new bootstrap.Modal(el, { backdrop: 'static', keyboard: false });
    this.modal.show();
  }

  ngOnDestroy(): void {
    // Limpiar listener si el componente se destruye antes de que el modal cierre
    if (this._hiddenHandler && this.modalElement?.nativeElement) {
      this.modalElement.nativeElement.removeEventListener('hidden.bs.modal', this._hiddenHandler);
    }
    this._limpiarDOM();
    // NO llamar dispose() aquí - puede causar errores si la animación sigue corriendo
  }

  cerrarModal(): void {
    // hide() inicia la animación de cierre de Bootstrap (300ms)
    // Cuando termina, dispara 'hidden.bs.modal' → nuestro _hiddenHandler llama onClose
    this.modal?.hide();
  }

  private _limpiarDOM(): void {
    document.body.classList.remove('modal-open');
    document.body.style.removeProperty('overflow');
    document.body.style.removeProperty('padding-right');
    document.querySelectorAll('.modal-backdrop').forEach(el => el.remove());
  }

  get numeroLetraLimpio(): string {
    return this.letra?.numeroLetra ? this.letra.numeroLetra.split('/')[0] : '';
  }

  get simboloMoneda(): string {
    return this.contrato?.moneda === 'PEN' ? 'S/.' : '$';
  }

  get esParcial(): boolean {
    return this.letra?.estadoLetra === 'PARCIAL';
  }

  get totalConMora(): number {
    if (this.pagarMoraTambien && this.calculoMora) {
      return this.pagoRequest.importePagado + this.calculoMora.montoMoraTotal;
    }
    return this.pagoRequest.importePagado;
  }

  togglePagarMora(): void {
    this.pagarMoraTambien = !this.pagarMoraTambien;
    this.moraDecisionTomada = true;
  }

  togglePagoAcuenta(): void {
    this.modoPagoAcuenta = !this.modoPagoAcuenta;
    this.pagoRequest.esPagoAcuenta = this.modoPagoAcuenta;
    if (!this.modoPagoAcuenta) {
      this.pagoRequest.importePagado = this.saldoActual;
    }
  }

  private generarObservaciones(): void {
    if (!this.contrato || !this.contrato.lotes || this.contrato.lotes.length === 0) {
      this.pagoRequest.observaciones = '';
      return;
    }
    const primerLote = this.contrato.lotes[0];
    const mz = primerLote.manzana || '';
    const lt = primerLote.numeroLote || '';
    const programa: string =
      primerLote.programa?.nombrePrograma
      || primerLote.nombrePrograma
      || this.contrato.programa?.nombrePrograma
      || '';
    this.pagoRequest.observaciones =
      `Pago de letra N° ${this.numeroLetraLimpio} de la Mz. ${mz} Lt. ${lt} del Programa: ${programa}`;
  }

  onMedioPagoChange(): void {
    if (this.pagoRequest.medioPago === MedioPago.EFECTIVO) {
      this.pagoRequest.numeroOperacion = '';
      this.voucherFiles = [];
    }
  }

  /**
   * Recibe los datos extraídos por OCR del voucher.
   * Sobrescribe siempre los campos detectados (el usuario puede corregir manualmente después).
   * Solo autollena si el OCR encontró el valor (no aplica fallbacks).
   */
  onVoucherOcr(data: VoucherOcrData): void {
    console.log('[OCR] Datos extraídos:', data);

    const cambios: string[] = [];

    if (data.numeroOperacion) {
      this.pagoRequest.numeroOperacion = data.numeroOperacion;
      cambios.push(`N° operación: ${data.numeroOperacion}`);
    }

    if (data.fechaPago) {
      this.pagoRequest.fechaPago = data.fechaPago;
      this.onFechaPagoChange();
      cambios.push(`Fecha: ${data.fechaPago}`);
    }

    if (cambios.length > 0) {
      this.toastr.info(
        `Detectado (${data.confidence.toFixed(0)}% conf.): ${cambios.join(' | ')}`,
        'OCR'
      );
    } else {
      this.toastr.warning(
        'No se pudo extraer N° operación ni fecha. Llénalos manualmente.',
        'OCR'
      );
    }
  }

  /**
   * Se llama cuando el usuario cambia la fecha de operación.
   * Si la letra está vencida y la nueva fecha difiere de la fecha con que se
   * calculó la mora originalmente, recalcula la mora con la fecha de operación
   * para que el monto sea correcto al momento del pago retroactivo.
   */
  onFechaPagoChange(): void {
    const fechaActual = this.pagoRequest.fechaPago;
    if (!fechaActual) return;

    const esVencida = this.letra.estadoLetra === 'VENCIDO';
    const fechaCambio = fechaActual !== this.fechaCalculoMora;

    if (!esVencida || !fechaCambio || !this.calculoMora) return;

    this.recalculandoMora = true;
    this.moraService.calcularMoraConFecha(this.letra.idLetra, fechaActual).subscribe({
      next: (nuevoCalculo) => {
        this.calculoMora = nuevoCalculo;
        this.fechaCalculoMora = fechaActual;
        this.recalculandoMora = false;
      },
      error: () => {
        // Si falla (ej: fecha anterior al vencimiento), simplemente no actualiza
        this.recalculandoMora = false;
      }
    });
  }

  onTipoComprobanteChange(): void {
    this.numeroComprobantePreview = '';
    this.modoManualComprobante = false;
    this.numeroComprobanteManual = '';
    if (this.pagoRequest.tipoComprobante) {
      this.cargandoPreview = true;
      this.pagoService.previewSiguienteNumeroComprobante(this.pagoRequest.tipoComprobante).subscribe({
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
    this.modoManualComprobante = !this.modoManualComprobante;
    if (this.modoManualComprobante) {
      this.serieEditable = this.seriePrefix.replace('-', '');
      this.numeroComprobanteManual = '';
      this.pagoRequest.numeroComprobantePersonalizado = undefined;
      this.pagoRequest.seriePersonalizada = undefined;
    } else {
      this.numeroComprobanteManual = '';
      this.serieEditable = '';
      this.pagoRequest.numeroComprobantePersonalizado = undefined;
      this.pagoRequest.seriePersonalizada = undefined;
    }
  }

  onNumeroManualChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const valor = input.value;
    this.numeroComprobanteManual = valor;
    const soloDigitos = valor.trim();
    this.pagoRequest.numeroComprobantePersonalizado = soloDigitos ? soloDigitos : undefined;
  }

  onSerieChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.serieEditable = input.value.trim().toUpperCase();
    if (this.serieEditable) {
      this.pagoRequest.seriePersonalizada = this.serieEditable;
    } else {
      this.pagoRequest.seriePersonalizada = undefined;
    }
  }

  onNumeroComprobanteFocus(event: FocusEvent): void {
    if (!this.modoManualComprobante) return;
    const input = event.target as HTMLInputElement;
    const prefijo = this.seriePrefix;
    if (!prefijo || !input.value.startsWith(prefijo)) return;
    const pos = prefijo.length;
    setTimeout(() => input.setSelectionRange(pos, pos), 0);
  }

  guardarPago(): void {
    if (!this.pagoRequest.importePagado || this.pagoRequest.importePagado <= 0) {
      this.toastr.warning('El importe pagado debe ser mayor a cero', 'Validación');
      return;
    }
    if (this.pagoRequest.importePagado > this.saldoActual) {
      this.toastr.warning(
        `El importe no puede superar el saldo pendiente (${this.simboloMoneda} ${this.saldoActual.toFixed(2)})`,
        'Validación'
      );
      return;
    }
    if (!this.modoPagoAcuenta && this.pagoRequest.importePagado < this.saldoActual) {
      this.toastr.warning(
        'Para pagar un monto menor al saldo, active la opción "Pago a cuenta"',
        'Validación'
      );
      return;
    }
    if (!this.pagoRequest.medioPago) {
      this.toastr.warning('Debe seleccionar un medio de pago', 'Validación');
      return;
    }
    if (!this.pagoRequest.tipoComprobante) {
      this.toastr.warning('Debe seleccionar el tipo de comprobante', 'Validación');
      return;
    }
    if (this.pagoRequest.medioPago !== MedioPago.EFECTIVO) {
      if (!this.pagoRequest.numeroOperacion?.trim()) {
        this.toastr.warning('El número de operación es obligatorio para este medio de pago', 'Validación');
        return;
      }
      if (this.voucherFiles.length === 0) {
        this.toastr.warning('Debe adjuntar al menos un voucher para este medio de pago', 'Validación');
        return;
      }
    }

    this.pagoRequest.esPagoAcuenta = this.modoPagoAcuenta;
    this.enviando = true;

    this.pagoService.registrarPago(this.pagoRequest, this.voucherFiles).subscribe({
      next: (response: PagoLetraResponse) => {
        if (this.pagarMoraTambien && this.calculoMora && !this.moraPreviamentePagada) {
          this.registrarPagoMoraTrasLetra(response);
        } else {
          this.finalizarPago(response);
        }
      },
      error: (err) => {
        const mensaje = err.error?.message || 'Error al registrar el pago';
        this.toastr.error(mensaje, 'Error');
        this.enviando = false;
      }
    });
  }

  private registrarPagoMoraTrasLetra(letraResponse: PagoLetraResponse): void {
    this.pagandoMora = true;
    const idPagoLetra = letraResponse.idPago;

    this.moraService.listarPorLetra(this.letra.idLetra).subscribe({
      next: (moras) => {
        const moraPendiente = moras.find(m => m.estadoMora === 'PENDIENTE');
        if (!moraPendiente) {
          this.toastr.warning(
            'La letra fue pagada. No se encontró mora pendiente para registrar.',
            'Aviso'
          );
          this.pagandoMora = false;
          this.finalizarPago(letraResponse);
          return;
        }

        const fechaPago: string =
          this.pagoRequest.fechaPago || new Date().toISOString().split('T')[0];

        const pagoMora: PagoMoraRequest = {
          idMora:          moraPendiente.idMora,
          montoPagado:     moraPendiente.montoMoraTotal,
          fechaPago:       fechaPago,
          medioPago:       this.pagoRequest.medioPago,
          numeroOperacion: this.pagoRequest.numeroOperacion,
          tipoComprobante: this.pagoRequest.tipoComprobante,
          observaciones:   `Mora pagada junto con la letra N° ${this.numeroLetraLimpio}`
        };

        this.moraService.pagarMora(pagoMora).subscribe({
          next: (pagoMoraRes) => {
            this.toastr.success(
              `Letra N° ${this.numeroLetraLimpio} y mora pagadas correctamente`,
              'Pago registrado',
              { timeOut: 5000 }
            );
            this.pagandoMora = false;
            this.abrirComprobanteMora(pagoMoraRes.idPagoMora);
            this.finalizarPago(letraResponse);
          },
          error: (err) => {
            const msg = err?.error?.message
              || 'La letra fue pagada pero hubo un error al registrar la mora.';
            this.toastr.warning(
              msg + ' Puedes pagarla desde "Ver Moras".',
              'Pago parcial'
            );
            this.pagandoMora = false;
            this.finalizarPago(letraResponse);
          }
        });
      },
      error: () => {
        this.toastr.warning(
          'Letra pagada. No se pudo consultar la mora. Revisa en "Ver Moras".',
          'Aviso'
        );
        this.pagandoMora = false;
        this.finalizarPago(letraResponse);
      }
    });
  }

  private finalizarPago(response: PagoLetraResponse): void {
    this.enviando = false;
    const idPago = response.idPago;

    // ── Mensaje de éxito con número de letra y tipo de pago ───────────────
    let mensaje: string;
    let titulo = 'Pago registrado';
    if (this.modoPagoAcuenta) {
      mensaje = `Pago a cuenta registrado correctamente para la Letra N° ${this.numeroLetraLimpio}`;
    } else {
      mensaje = `Letra N° ${this.numeroLetraLimpio} pagada correctamente`;
    }
    if (response.sunatAceptado) {
      mensaje += '. Boleta enviada a SUNAT: ACEPTADA';
    }
    this.toastr.success(mensaje, titulo, { timeOut: 6000 });

    this.onPagoExitoso.emit();
    this.cerrarModal(); // Bootstrap animará cierre → hidden.bs.modal → onClose

    // ── Auto-abrir PDF solo si NO es backfill ──────────────────────────────
    // Backfill = registrar una letra anterior a la más alta ya pagada
    // (típicamente al cargar recibos físicos antiguos con fecha pasada).
    const letraActual = parseInt(this.numeroLetraLimpio, 10);
    const esBackfill = this.maximaLetraPagada > 0
      && !isNaN(letraActual)
      && letraActual < this.maximaLetraPagada;

    if (esBackfill) {
      return;
    }

    this.pagoService.descargarComprobante(idPago).subscribe({
      next: (blob) => { window.open(URL.createObjectURL(blob), '_blank'); },
      error: () => {
        this.toastr.warning(
          'Pago guardado. No se pudo abrir el comprobante automáticamente.',
          'Aviso'
        );
      }
    });
  }

  private abrirComprobanteMora(idPagoMora: number): void {
    this.moraService.descargarComprobante(idPagoMora).subscribe({
      next: (blob) => { window.open(URL.createObjectURL(blob), '_blank'); },
      error: () => {}
    });
  }
}