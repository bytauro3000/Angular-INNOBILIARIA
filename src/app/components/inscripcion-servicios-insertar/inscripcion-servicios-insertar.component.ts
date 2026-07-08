import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InscripcionService, SaldoInscripcionDTO } from '../../services/inscripcion.service';
import { AbonoInscripcionRequest } from '../../dto/AbonoInscripcionRequest.dto';
import { InscripcionServicioDTO } from '../../dto/InscripcionServicio.dto';
import { TipoServicios } from '../../enums/tiposervicio';
import { MedioPago } from '../../enums/mediopago.enum';
import { TipoComprobante } from '../../enums/tipocomprobante';
import { ToastrService } from 'ngx-toastr';
import { VoucherPreviewComponent } from '../voucher-preview/voucher-preview.componente';
import { obtenerFechaPeru } from '../../utils/fecha-peru';
import { VoucherOcrData } from '../../services/ocr-voucher.service';

@Component({
  selector: 'app-inscripcion-servicios-insertar',
  standalone: true,
  imports: [CommonModule, FormsModule, VoucherPreviewComponent],
  templateUrl: './inscripcion-servicios-insertar.html',
  styleUrls: ['./inscripcion-servicios-insertar.scss']
})
export class InscripcionServiciosInsertarComponent {
  @Output() inscripcionExitosa = new EventEmitter<void>();
  /** Se emite cuando la inscripción (Paso 1) se registra con éxito,
   *  ANTES de que el usuario complete el pago. Permite al padre refrescar
   *  la lista para que si el modal se cierra accidentalmente, al reabrirlo
   *  detecte el pendiente y vaya directo al Paso 2. */
  @Output() inscripcionCreada  = new EventEmitter<void>();

  estaAbierto: boolean = false;
  idContrato!: number;
  manzana: string = '';
  numeroLote: string = '';
  nombrePrograma: string = '';

  /** 1 = seleccionar servicio | 2 = registrar abono */
  paso: 1 | 2 = 1;

  tipoServicio: TipoServicios = TipoServicios.LUZ;

  /** Servicios que ya tienen inscripción completamente pagada — se bloquean en el Paso 1 */
  luzInscrita:  boolean = false;
  aguaInscrita: boolean = false;

  /** Servicios que tienen inscripción con pago pendiente (no completamente pagados) */
  luzPendiente:  boolean = false;
  aguaPendiente: boolean = false;

  idInscripcion!: number;
  montoTotal: number = 0;
  montoAcumulado: number = 0;
  saldoPendiente: number = 0;
  montoAbono: number = 0;

  medioPago: MedioPago               = MedioPago.EFECTIVO;
  tipoComprobante?: TipoComprobante;
  fechaPago: string                  = obtenerFechaPeru();
  numeroOperacion: string            = '';
  observaciones: string              = '';

  numeroComprobantePreview: string   = '';
  cargandoPreview: boolean           = false;
  modoManualComprobante: boolean     = false;
  numeroComprobanteManual: string    = '';

  voucherInscripcionFiles: File[]    = [];

  loading: boolean = false;

  TipoServicios          = TipoServicios;
  MedioPago              = MedioPago;
  medioPagoOptions       = Object.values(MedioPago);
  tipoComprobanteOptions = Object.values(TipoComprobante).filter(t => t === 'RECIBO' || t === 'BOLETA');

  constructor(
    private inscripcionService: InscripcionService,
    private toastr: ToastrService
  ) {}

  /**
   * Abre el modal.
   *
   * Si se pasa inscripcionPendiente (idInscripcion + montoTotal + montoAcumulado
   * + tipoServicio), va directo al Paso 2 para registrar el abono pendiente.
   * De lo contrario, inicia en el Paso 1 para crear una nueva inscripción.
   */
  abrirModal(
    idContrato: number,
    inscripcionPendiente?: { idInscripcion: number; tipoServicio: TipoServicios; montoTotal: number; montoAcumulado: number },
    serviciosInscritos?: { tieneLuz: boolean; tieneAgua: boolean; tienePendienteLuz?: boolean; tienePendienteAgua?: boolean },
    datosContrato?: { manzana?: string; numeroLote?: string; nombrePrograma?: string }
  ): void {
    this.idContrato    = idContrato;
    this.manzana       = datosContrato?.manzana       ?? '';
    this.numeroLote    = datosContrato?.numeroLote    ?? '';
    this.nombrePrograma = datosContrato?.nombrePrograma ?? '';
    this.loading       = false;
    this.estaAbierto   = true;
    // tieneLuz/tieneAgua = pagado completamente
    this.luzInscrita   = serviciosInscritos?.tieneLuz  ?? false;
    this.aguaInscrita  = serviciosInscritos?.tieneAgua ?? false;
    // pendientes = inscrito pero sin terminar de pagar
    this.luzPendiente  = serviciosInscritos?.tienePendienteLuz  ?? false;
    this.aguaPendiente = serviciosInscritos?.tienePendienteAgua ?? false;
    this.resetearPaso2();

    if (inscripcionPendiente) {
      this.tipoServicio   = inscripcionPendiente.tipoServicio;
      this.idInscripcion  = inscripcionPendiente.idInscripcion;
      this.montoTotal     = inscripcionPendiente.montoTotal;
      this.montoAcumulado = inscripcionPendiente.montoAcumulado;
      this.saldoPendiente = inscripcionPendiente.montoTotal - inscripcionPendiente.montoAcumulado;
      this.montoAbono     = this.saldoPendiente;
      this.paso           = 2;
    } else {
      // Auto-seleccionar el único servicio disponible si el otro ya está inscrito o pendiente
      const luzBloqueada  = this.luzInscrita  || this.luzPendiente;
      const aguaBloqueada = this.aguaInscrita || this.aguaPendiente;
      if (!luzBloqueada && !aguaBloqueada) {
        this.tipoServicio = TipoServicios.LUZ;
      } else if (luzBloqueada && !aguaBloqueada) {
        this.tipoServicio = TipoServicios.AGUA;
      } else if (!luzBloqueada && aguaBloqueada) {
        this.tipoServicio = TipoServicios.LUZ;
      }
      this.paso = 1;
    }
    // Regenerar la observación por defecto ahora que tipoServicio ya está asignado
    this.observaciones = this.generarObservacionesAutomatica();
  }

  cerrarModal(): void {
    this.estaAbierto = false;
  }

  private resetearPaso2(): void {
    this.idInscripcion            = 0;
    this.montoTotal               = 0;
    this.montoAcumulado           = 0;
    this.saldoPendiente           = 0;
    this.montoAbono               = 0;
    this.medioPago                = MedioPago.EFECTIVO;
    this.tipoComprobante          = undefined;
    this.fechaPago                = obtenerFechaPeru();
    this.numeroOperacion          = '';
    this.observaciones            = '';
    this.numeroComprobantePreview = '';
    this.modoManualComprobante    = false;
    this.numeroComprobanteManual  = '';
    this.voucherInscripcionFiles  = [];
  }

  /**
   * Genera la observación por defecto: "Pago de inscripción de {servicio}
   * de la Mz. {manzana} Lt. {lote} - Programa: {programa}".
   * Si falta algún dato, usa "___" como placeholder.
   */
  generarObservacionesAutomatica(): string {
    const tipo   = this.tipoServicio ?? 'servicio';
    const mz     = this.manzana       || '___';
    const lt     = this.numeroLote    || '___';
    const prog   = this.nombrePrograma || '___';
    return `Pago de inscripción de ${tipo} de la Mz. ${mz} Lt. ${lt} - Programa: ${prog}`;
  }

  confirmarTipoServicio(): void {
    this.loading = true;

    this.inscripcionService.registrarInscripcion(this.idContrato, this.tipoServicio).subscribe({
      next: (inscripcion: InscripcionServicioDTO) => {
        this.loading        = false;
        this.idInscripcion  = inscripcion.idInscripcion!;
        this.montoTotal     = inscripcion.montoTotal!;
        this.montoAcumulado = inscripcion.montoAcumulado ?? 0;
        this.saldoPendiente = inscripcion.montoTotal! - (inscripcion.montoAcumulado ?? 0);
        this.montoAbono     = this.saldoPendiente;
        this.paso           = 2;

        // Notificar al padre para que refresque la lista.
        // Si el usuario cierra el modal antes de pagar, al reabrirlo
        // el sistema detectará el pendiente y abrirá directo el Paso 2.
        this.inscripcionCreada.emit();

        this.toastr.info(
          `Inscripción de ${this.tipoServicio} creada. Monto total: $${this.montoTotal.toFixed(2)}`,
          'Paso 2: Registrar abono'
        );
      },
      error: (err) => {
        this.loading = false;
        this.toastr.error(
          err.error?.message || err.error || 'Error al crear la inscripción.',
          'Error'
        );
      }
    });
  }

  onMedioPagoChange(): void {
    if (this.medioPago === MedioPago.EFECTIVO) {
      this.numeroOperacion = '';
      this.voucherInscripcionFiles = [];
    }
  }

  /**
   * Recibe los datos extraídos por OCR del voucher.
   * Sobrescribe siempre los campos detectados (el usuario puede corregir manualmente después).
   */
  onVoucherOcr(data: VoucherOcrData): void {
    console.log('[OCR Pago Inscripción] Datos extraídos:', data);

    const cambios: string[] = [];

    if (data.numeroOperacion) {
      this.numeroOperacion = data.numeroOperacion;
      cambios.push(`N° operación: ${data.numeroOperacion}`);
    }

    if (data.fechaPago) {
      this.fechaPago = data.fechaPago;
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

  onTipoComprobanteChange(): void {
    this.numeroComprobantePreview = '';
    this.modoManualComprobante    = false;
    this.numeroComprobanteManual  = '';

    if (this.tipoComprobante) {
      this.cargandoPreview = true;
      this.inscripcionService.previewSiguienteNumeroComprobante(this.tipoComprobante).subscribe({
        next: (numero) => {
          this.numeroComprobantePreview = numero;
          this.cargandoPreview          = false;
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
    this.modoManualComprobante   = !this.modoManualComprobante;
    this.numeroComprobanteManual = this.modoManualComprobante ? this.seriePrefix : '';
  }

  onNumeroManualChange(event: Event): void {
    const input   = event.target as HTMLInputElement;
    const prefijo = this.seriePrefix;
    let valor     = input.value;
    if (prefijo && !valor.startsWith(prefijo)) {
      valor       = prefijo;
      input.value = valor;
    }
    this.numeroComprobanteManual = valor;
  }

  get numeroComprobantePersonalizado(): string | undefined {
    if (!this.modoManualComprobante) return undefined;
    const prefijo     = this.seriePrefix;
    const soloDigitos = this.numeroComprobanteManual.substring(prefijo.length).trim();
    return soloDigitos ? this.numeroComprobanteManual.trim() : undefined;
  }

  confirmarAbono(): void {
    if (this.loading) return;
    if (!this.montoAbono || this.montoAbono <= 0) {
      this.toastr.warning('El monto debe ser mayor a cero.', 'Validación');
      return;
    }
    if (this.montoAbono > this.saldoPendiente) {
      this.toastr.warning(
        `El monto no puede superar el saldo pendiente de $${this.saldoPendiente.toFixed(2)}.`,
        'Validación'
      );
      return;
    }
    if (!this.medioPago) {
      this.toastr.warning('Debe seleccionar un medio de pago.', 'Validación');
      return;
    }
    if (!this.tipoComprobante) {
      this.toastr.warning('Debe seleccionar el tipo de comprobante.', 'Validación');
      return;
    }
    if (this.medioPago !== MedioPago.EFECTIVO && !this.numeroOperacion.trim()) {
      this.toastr.warning(
        'El número de operación es obligatorio para este medio de pago.',
        'Validación'
      );
      return;
    }
    if (this.medioPago !== MedioPago.EFECTIVO && this.voucherInscripcionFiles.length === 0) {
      this.toastr.warning(
        'Debe adjuntar al menos un voucher para este medio de pago.',
        'Validación'
      );
      return;
    }

    const request: AbonoInscripcionRequest = {
      idInscripcion:                  this.idInscripcion,
      idContrato:                     this.idContrato,
      tipoServicio:                   this.tipoServicio,
      montoPagado:                    this.montoAbono,
      fechaPago:                      this.fechaPago,
      medioPago:                      this.medioPago,
      numeroOperacion:                this.numeroOperacion || undefined,
      observaciones:                  this.observaciones
                                        || `Abono inscripción ${this.tipoServicio} — Contrato #${this.idContrato}`,
      tipoComprobante:                this.tipoComprobante,
      numeroComprobantePersonalizado: this.numeroComprobantePersonalizado
    };

    this.loading = true;

    this.inscripcionService.registrarAbono(this.idInscripcion, request, this.voucherInscripcionFiles).subscribe({
      next: (response) => {
        this.loading = false;

        const pagoCompleto = this.montoAbono >= this.saldoPendiente;
        this.toastr.success(
          pagoCompleto
            ? `Inscripción de ${this.tipoServicio} pagada completamente. Comprobante: ${response.numeroComprobante}`
            : `Abono de $${this.montoAbono.toFixed(2)} registrado. Comprobante: ${response.numeroComprobante}. Saldo restante: $${(this.saldoPendiente - this.montoAbono).toFixed(2)}`,
          '¡Éxito!'
        );

        this.inscripcionExitosa.emit();
        this.cerrarModal();

        this.inscripcionService.descargarComprobante(response.idPagoInscripcionComprobante).subscribe({
          next: (blob) => { window.open(URL.createObjectURL(blob), '_blank'); },
          error: () => {
            this.toastr.warning(
              'Abono guardado. No se pudo abrir el comprobante automáticamente.',
              'Aviso'
            );
          }
        });
      },
      error: (err) => {
        this.loading = false;
        this.toastr.error(
          err.error?.message || err.error || 'Error al registrar el abono.',
          'Error'
        );
      }
    });
  }
}