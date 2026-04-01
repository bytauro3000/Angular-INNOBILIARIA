import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import Swal from 'sweetalert2';
import { MoraService } from '../../services/mora.service';
import { CalculoMoraDTO } from '../../dto/calculomora.dto';
import { MoraResponse } from '../../dto/moraresponse.dto';
import { PagoMoraRequest } from '../../dto/pagomorarequest.dto';
import { MedioPago } from '../../enums/mediopago.enum';
import { TipoComprobante } from '../../enums/tipocomprobante';

@Component({
  selector: 'app-mora-alerta',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './mora-alerta.html',
  styleUrls: ['./mora-alerta.scss']
})
export class MoraAlertaComponent implements OnInit {
  @Input() idLetra!: number;
  @Input() simboloMoneda: string = '$';

  @Output() onConfirmarSinPagarMora       = new EventEmitter<CalculoMoraDTO>();
  @Output() onCancelar                     = new EventEmitter<void>();
  @Output() onMoraPagadaQuierePagarLetra  = new EventEmitter<CalculoMoraDTO>();
  @Output() onMoraPagadaSinLetra           = new EventEmitter<void>();

  calculo: CalculoMoraDTO | null = null;
  cargando = true;
  error: string | null = null;

  mostrarFormPagarMora = false;
  enviandoMora  = false;
  sugerindoNumero = false;
  creandoMora   = false;

  medioPagoOptions       = Object.values(MedioPago);
  tipoComprobanteOptions = Object.values(TipoComprobante);

  // ── Estado real de la mora en BD ──────────────────────────────────────────
  /**
   * Todas las moras de esta letra (PENDIENTE, PAGADO, ANULADO).
   * Se consulta en ngOnInit para saber exactamente en qué estado está la mora.
   *
   * Reglas de negocio:
   *   - moraPagada    (PAGADO)   → botón "Pagar Mora" DESHABILITADO, botón "Pagar Letra" HABILITADO sin aviso
   *   - moraPendiente (PENDIENTE)→ botón "Pagar Mora" abre formulario (sin crear nueva), botón "Pagar Letra" va directo
   *   - sin mora (null)          → botón "Pagar Mora" crea mora y abre formulario, botón "Pagar Letra" muestra aviso
   */
  moraPendiente: MoraResponse | null = null;  // mora en estado PENDIENTE
  moraPagada:    MoraResponse | null = null;  // mora en estado PAGADO
  cargandoEstadoMora = true;

  request: PagoMoraRequest = {
    idMora: 0,
    montoPagado: 0,
    fechaPago: '',
    medioPago: MedioPago.EFECTIVO,
    numeroOperacion: '',
    tipoComprobante: undefined,
    numeroComprobante: '',
    observaciones: ''
  };

  constructor(
    private moraService: MoraService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.moraService.calcularMora(this.idLetra).subscribe({
      next:  (dto) => { this.calculo = dto; this.cargando = false; },
      error: (err) => { this.error = err?.error?.message || 'No se pudo calcular la mora.'; this.cargando = false; }
    });

    this.cargarEstadoMora();
  }

  // ── Consulta estado actual de la mora en BD ───────────────────────────────

  private cargarEstadoMora(): void {
    this.cargandoEstadoMora = true;
    this.moraService.listarPorLetra(this.idLetra).subscribe({
      next: (moras) => {
        this.moraPendiente = moras.find(m => m.estadoMora === 'PENDIENTE') ?? null;
        this.moraPagada    = moras.find(m => m.estadoMora === 'PAGADO')    ?? null;
        this.cargandoEstadoMora = false;
      },
      error: () => {
        this.moraPendiente = null;
        this.moraPagada    = null;
        this.cargandoEstadoMora = false;
      }
    });
  }

  // ── Getters de estado para el template ───────────────────────────────────

  /** La mora YA fue cobrada (PAGADO) → botón "Pagar Mora" debe estar DESHABILITADO */
  get moraYaPagada(): boolean {
    return this.moraPagada !== null;
  }

  /** Existe mora PENDIENTE en BD (registrada pero no cobrada aún) */
  get moraEsPendiente(): boolean {
    return this.moraPendiente !== null;
  }

  /** El idMora a usar al pagar: primero la pendiente, luego la que viene del cálculo */
  get idMoraParaPago(): number | null {
    if (this.moraPendiente) return this.moraPendiente.idMora;
    if (this.calculo?.tieneMoraPrevia && this.calculo.idMoraPrevia) return this.calculo.idMoraPrevia;
    return null;
  }

  // ── Botón AMARILLO: Pagar Mora ────────────────────────────────────────────

  abrirFormPagarMora(): void {
    if (!this.calculo || this.creandoMora || this.moraYaPagada) return;

    this.request.montoPagado       = this.calculo.montoMoraTotal;
    this.request.fechaPago         = new Date().toISOString().split('T')[0];
    this.request.medioPago         = MedioPago.EFECTIVO;
    this.request.numeroOperacion   = '';
    this.request.tipoComprobante   = undefined;
    this.request.numeroComprobante = '';
    this.request.observaciones     = `Pago de mora - Letra N° ${this.calculo.numeroLetra}`;

    const idMora = this.idMoraParaPago;

    if (idMora) {
      // Mora PENDIENTE ya existe → NO crear otra, abrir formulario con la existente
      this.request.idMora = idMora;
      this.mostrarFormPagarMora = true;
    } else {
      // No existe mora → crear por primera vez
      this.creandoMora = true;
      this.moraService.crearMoraPendiente(this.idLetra).subscribe({
        next: (mora) => {
          this.request.idMora = mora.idMora;
          this.moraPendiente  = mora as MoraResponse;
          this.creandoMora    = false;
          this.mostrarFormPagarMora = true;
        },
        error: (err) => {
          this.creandoMora = false;
          const msg: string = err?.error?.message || '';
          if (msg.toLowerCase().includes('ya existe') ||
              msg.toLowerCase().includes('duplicad') ||
              err?.status === 409) {
            this.toastr.info('La mora ya estaba registrada. Cargando datos...', 'Aviso');
            this.recargarEstadoYAbrir();
          } else {
            this.toastr.error(msg || 'No se pudo registrar la mora', 'Error');
          }
        }
      });
    }
  }

  private recargarEstadoYAbrir(): void {
    this.moraService.listarPorLetra(this.idLetra).subscribe({
      next: (moras) => {
        this.moraPendiente = moras.find(m => m.estadoMora === 'PENDIENTE') ?? null;
        this.moraPagada    = moras.find(m => m.estadoMora === 'PAGADO')    ?? null;
        const pendiente = this.moraPendiente;
        if (pendiente) {
          this.request.idMora = pendiente.idMora;
          this.mostrarFormPagarMora = true;
        } else {
          this.toastr.error('No se encontró mora pendiente para esta letra.', 'Error');
        }
      },
      error: () => this.toastr.error('Error al buscar la mora registrada.', 'Error')
    });
  }

  onMedioPagoChange(): void {
    if (this.request.medioPago === MedioPago.EFECTIVO) {
      this.request.numeroOperacion = '';
    }
  }

  /** Usa /api/moras/sugerir-numero que compara pago_mora y pago_letra → devuelve el más alto + 1 */
  onTipoComprobanteChange(): void {
    if (this.request.tipoComprobante) {
      this.sugerindoNumero = true;
      this.moraService.sugerirNumeroComprobante(this.request.tipoComprobante).subscribe({
        next:  (res) => { this.request.numeroComprobante = res.numeroSugerido; this.sugerindoNumero = false; },
        error: ()    => { this.sugerindoNumero = false; }
      });
    } else {
      this.request.numeroComprobante = '';
    }
  }

  registrarPagoMora(): void {
    if (!this.request.medioPago) {
      this.toastr.warning('Debe seleccionar un medio de pago', 'Validación'); return;
    }
    if (this.request.medioPago !== MedioPago.EFECTIVO && !this.request.numeroOperacion?.trim()) {
      this.toastr.warning('El número de operación es obligatorio para este medio de pago', 'Validación'); return;
    }
    if (!this.request.tipoComprobante) {
      this.toastr.warning('Debe seleccionar el tipo de comprobante', 'Validación'); return;
    }
    if (!this.request.numeroComprobante?.trim()) {
      this.toastr.warning('Debe ingresar el número de comprobante', 'Validación'); return;
    }

    const idMora = this.request.idMora || this.idMoraParaPago;
    if (!idMora) {
      this.toastr.error('No se encontró la mora a pagar. Intente nuevamente.', 'Error'); return;
    }
    this.request.idMora = idMora;
    this.enviandoMora = true;
    this.ejecutarPagoMora();
  }

  private ejecutarPagoMora(): void {
    this.moraService.pagarMora(this.request).subscribe({
      next: (res) => {
        this.enviandoMora = false;
        this.mostrarFormPagarMora = false;
        // Actualizar estado local: ya no hay mora pendiente, ahora está pagada
        this.moraPagada    = { ...this.moraPendiente!, estadoMora: 'PAGADO' } as MoraResponse;
        this.moraPendiente = null;

        this.moraService.descargarComprobante(res.idPagoMora).subscribe({
          next: (blob) => window.open(URL.createObjectURL(blob), '_blank'),
          error: () => {}
        });

        Swal.fire({
          title: '¿Cobrar la letra ahora?',
          text: `La mora ha sido pagada. ¿Desea registrar el pago de la letra N° ${this.calculo?.numeroLetra} ahora?`,
          icon: 'question',
          showCancelButton: true,
          confirmButtonColor: '#27ae60',
          cancelButtonColor: '#6b7280',
          confirmButtonText: 'Sí, cobrar letra',
          cancelButtonText: 'No, cerrar'
        }).then(result => {
          if (result.isConfirmed && this.calculo) {
            this.onMoraPagadaQuierePagarLetra.emit(this.calculo);
          } else {
            this.onMoraPagadaSinLetra.emit();
          }
        });
      },
      error: (err) => {
        this.toastr.error(err?.error?.message || 'Error al registrar el pago de mora', 'Error');
        this.enviandoMora = false;
      }
    });
  }

  // ── Botón VERDE: Pagar Letra ──────────────────────────────────────────────

  confirmarPagarSoloLetra(): void {
    /**
     * Casos:
     *  A) moraYaPagada = true  → mora PAGADA → pagar letra directo, SIN aviso de mora
     *  B) moraEsPendiente = true → mora PENDIENTE registrada → pagar letra directo, ya sabe que hay mora pendiente
     *  C) sin mora → avisar que se creará como PENDIENTE
     */
    if (this.moraYaPagada || this.moraEsPendiente) {
      if (this.calculo) {
        this.onConfirmarSinPagarMora.emit(this.calculo);
      }
    } else {
      Swal.fire({
        title: 'Pagar solo la letra',
        html: `La mora de <strong>${this.simboloMoneda} ${this.calculo?.montoMoraTotal.toFixed(2)}</strong>
               quedará registrada como <strong>PENDIENTE</strong> para cobrarla después.<br><br>
               ¿Desea continuar?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#27ae60',
        cancelButtonColor: '#6b7280',
        confirmButtonText: 'Sí, pagar letra',
        cancelButtonText: 'Cancelar'
      }).then(result => {
        if (result.isConfirmed && this.calculo) {
          this.onConfirmarSinPagarMora.emit(this.calculo);
        }
      });
    }
  }

  cancelar(): void { this.onCancelar.emit(); }
}