import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InscripcionService, InscripcionConPagoRequest } from '../../services/inscripcion.service';
import { TipoServicios } from '../../enums/tiposervicio';
import { MedioPago } from '../../enums/mediopago.enum';
import { TipoComprobante } from '../../enums/tipocomprobante';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-inscripcion-servicios-insertar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './inscripcion-servicios-insertar.html',
  styleUrls: ['./inscripcion-servicios-insertar.scss']
})
export class InscripcionServiciosInsertarComponent {
  @Output() inscripcionExitosa = new EventEmitter<void>();

  // ── Control de apertura ──────────────────────────────────────────────────
  estaAbierto: boolean = false;
  idContrato!: number;

  // ── Datos de la inscripción ──────────────────────────────────────────────
  tipoServicio: TipoServicios = TipoServicios.LUZ;

  /** Monto por defecto: $150. Es editable para pagos parciales. */
  montoPagado: number = 150;

  // ── Datos del pago ───────────────────────────────────────────────────────
  medioPago: MedioPago                = MedioPago.EFECTIVO;
  tipoComprobante?: TipoComprobante;
  fechaPago: string                   = new Date().toISOString().split('T')[0];
  numeroOperacion: string             = '';
  observaciones: string               = '';

  // ── Comprobante (preview automático / modo manual) ───────────────────────
  numeroComprobantePreview: string    = '';
  cargandoPreview: boolean            = false;
  modoManualComprobante: boolean      = false;
  numeroComprobanteManual: string     = '';

  // ── Estado de envío ──────────────────────────────────────────────────────
  loading: boolean = false;

  // ── Opciones de enums para los selects ──────────────────────────────────
  TipoServicios      = TipoServicios;
  medioPagoOptions   = Object.values(MedioPago);
  tipoComprobanteOptions = Object.values(TipoComprobante);

  constructor(
    private inscripcionService: InscripcionService,
    private toastr: ToastrService
  ) {}

  // ── Apertura y cierre del modal ──────────────────────────────────────────

  abrirModal(idContrato: number): void {
    this.idContrato           = idContrato;
    this.tipoServicio         = TipoServicios.LUZ;
    this.montoPagado          = 150;
    this.medioPago            = MedioPago.EFECTIVO;
    this.tipoComprobante      = undefined;
    this.fechaPago            = new Date().toISOString().split('T')[0];
    this.numeroOperacion      = '';
    this.observaciones        = '';
    this.numeroComprobantePreview  = '';
    this.modoManualComprobante     = false;
    this.numeroComprobanteManual   = '';
    this.loading              = false;
    this.estaAbierto          = true;
  }

  cerrarModal(): void {
    this.estaAbierto = false;
  }

  // ── Lógica de medio de pago ──────────────────────────────────────────────

  onMedioPagoChange(): void {
    if (this.medioPago === MedioPago.EFECTIVO) {
      this.numeroOperacion = '';
    }
  }

  // ── Lógica de comprobante (preview automático + modo manual) ─────────────

  onTipoComprobanteChange(): void {
    this.numeroComprobantePreview = '';
    this.modoManualComprobante    = false;
    this.numeroComprobanteManual  = '';

    if (this.tipoComprobante) {
      this.cargandoPreview = true;
      this.inscripcionService.previewSiguienteNumeroComprobante(this.tipoComprobante).subscribe({
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
      this.numeroComprobanteManual = this.seriePrefix;
    } else {
      this.numeroComprobanteManual = '';
    }
  }

  onNumeroManualChange(event: Event): void {
    const input   = event.target as HTMLInputElement;
    const prefijo = this.seriePrefix;
    let valor     = input.value;
    if (prefijo && !valor.startsWith(prefijo)) {
      valor = prefijo;
      input.value = valor;
    }
    this.numeroComprobanteManual = valor;
  }

  get numeroComprobantePersonalizado(): string | undefined {
    if (!this.modoManualComprobante) return undefined;
    const prefijo    = this.seriePrefix;
    const soloDigitos = this.numeroComprobanteManual.substring(prefijo.length).trim();
    return soloDigitos ? this.numeroComprobanteManual.trim() : undefined;
  }

  // ── Validación y envío ───────────────────────────────────────────────────

  confirmarInscripcion(): void {
    if (!this.montoPagado || this.montoPagado <= 0) {
      this.toastr.warning('El monto debe ser mayor a cero.', 'Validación');
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
      this.toastr.warning('El número de operación es obligatorio para este medio de pago.', 'Validación');
      return;
    }

    const request: InscripcionConPagoRequest = {
      idContrato:                    this.idContrato,
      tipoServicio:                  this.tipoServicio,
      montoPagado:                   this.montoPagado,
      fechaPago:                     this.fechaPago,
      medioPago:                     this.medioPago,
      numeroOperacion:               this.numeroOperacion || undefined,
      observaciones:                 this.observaciones
                                       || `Inscripción de servicio de ${this.tipoServicio} - Contrato #${this.idContrato}`,
      tipoComprobante:               this.tipoComprobante,
      numeroComprobantePersonalizado: this.numeroComprobantePersonalizado
    };

    this.loading = true;

    this.inscripcionService.registrarConPago(request).subscribe({
      next: (response) => {
        this.loading = false;
        this.toastr.success(
          `Servicio de ${this.tipoServicio} inscrito correctamente. Comprobante: ${response.numeroComprobante}`,
          '¡Éxito!'
        );
        this.inscripcionExitosa.emit();
        this.cerrarModal();

        // Descargar el comprobante en PDF automáticamente
        this.inscripcionService.descargarComprobante(response.idPagoInicial).subscribe({
          next: (blob) => { window.open(URL.createObjectURL(blob), '_blank'); },
          error: () => {
            this.toastr.warning(
              'Inscripción guardada. No se pudo abrir el comprobante automáticamente.',
              'Aviso'
            );
          }
        });
      },
      error: (err) => {
        this.loading = false;
        this.toastr.error(
          err.error?.message || err.error || 'Error al procesar la inscripción.',
          'Error'
        );
      }
    });
  }
}