import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastrService } from 'ngx-toastr';
import Swal from 'sweetalert2';
import { MoraService } from '../../services/mora.service';
import { CalculoMoraDTO } from '../../dto/calculomora.dto';
import { MoraResponse } from '../../dto/moraresponse.dto';
import { MoraPagarComponent } from '../mora-pagar/mora-pagar.component';

@Component({
  selector: 'app-mora-alerta',
  standalone: true,
  imports: [CommonModule, MoraPagarComponent],
  templateUrl: './mora-alerta.html',
  styleUrls: ['./mora-alerta.scss']
})
export class MoraAlertaComponent implements OnInit {
  @Input() idLetra!: number;
  @Input() simboloMoneda: string = '$';

  @Output() onConfirmarSinPagarMora      = new EventEmitter<CalculoMoraDTO>();
  @Output() onCancelar                    = new EventEmitter<void>();
  @Output() onMoraPagadaQuierePagarLetra = new EventEmitter<CalculoMoraDTO>();
  @Output() onMoraPagadaSinLetra          = new EventEmitter<void>();

  calculo:            CalculoMoraDTO | null = null;
  cargando           = true;
  error:             string | null = null;
  cargandoEstadoMora = true;
  creandoMora        = false;

  moraPendiente: MoraResponse | null = null;
  moraPagada:    MoraResponse | null = null;

  /** Mora que se pasa al componente mora-pagar; cuando es non-null, el modal se abre */
  moraParaPagar: MoraResponse | null = null;

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

  private cargarEstadoMora(): void {
    this.cargandoEstadoMora = true;
    this.moraService.listarPorLetra(this.idLetra).subscribe({
      next: (moras) => {
        this.moraPendiente      = moras.find(m => m.estadoMora === 'PENDIENTE') ?? null;
        this.moraPagada         = moras.find(m => m.estadoMora === 'PAGADO')    ?? null;
        this.cargandoEstadoMora = false;
      },
      error: () => {
        this.moraPendiente      = null;
        this.moraPagada         = null;
        this.cargandoEstadoMora = false;
      }
    });
  }

  get moraYaPagada():   boolean { return this.moraPagada   !== null; }
  get moraEsPendiente():boolean { return this.moraPendiente !== null; }

  get idMoraParaPago(): number | null {
    if (this.moraPendiente) return this.moraPendiente.idMora;
    if (this.calculo?.tieneMoraPrevia && this.calculo.idMoraPrevia) return this.calculo.idMoraPrevia;
    return null;
  }

  /**
   * Botón "Pagar Mora": si ya existe una mora pendiente la pasa directamente
   * al componente mora-pagar; si no, la crea primero y luego la pasa.
   */
  abrirFormPagarMora(): void {
    if (!this.calculo || this.creandoMora || this.moraYaPagada) return;

    if (this.moraPendiente) {
      // Ya tenemos la mora pendiente → abrimos mora-pagar directamente
      this.moraParaPagar = this.moraPendiente;
    } else {
      // Hay que crear la mora primero
      this.creandoMora = true;
      this.moraService.crearMoraPendiente(this.idLetra).subscribe({
        next: (mora) => {
          this.moraPendiente = mora as MoraResponse;
          this.moraParaPagar = this.moraPendiente;
          this.creandoMora   = false;
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
        if (this.moraPendiente) {
          this.moraParaPagar = this.moraPendiente;
        } else {
          this.toastr.error('No se encontró mora pendiente para esta letra.', 'Error');
        }
      },
      error: () => this.toastr.error('Error al buscar la mora registrada.', 'Error')
    });
  }

  /** Llamado por (onClose) de mora-pagar: el usuario cerró sin pagar */
  cerrarModalPago(): void {
    this.moraParaPagar = null;
    // mora-pagar usa bootstrap.Modal con dispose(), que a veces no limpia el body
    document.body.classList.remove('modal-open');
    document.body.style.removeProperty('overflow');
    document.body.style.removeProperty('padding-right');
    document.querySelectorAll('.modal-backdrop').forEach(el => el.remove());
  }

  /**
   * Llamado por (onPagoExitoso) de mora-pagar cuando el pago se registró OK.
   * Descarga el comprobante y pregunta si cobrar la letra ahora.
   */
  onPagoMoraExitoso(idPagoMora: number): void {
    this.moraParaPagar = null;
    this.moraPagada    = { ...this.moraPendiente!, estadoMora: 'PAGADO' } as MoraResponse;
    this.moraPendiente = null;

    // Descarga automática del comprobante PDF
    this.moraService.descargarComprobante(idPagoMora).subscribe({
      next:  (blob) => window.open(URL.createObjectURL(blob), '_blank'),
      error: () => {}
    });

    Swal.fire({
      title: '¿Cobrar la letra ahora?',
      text: `La mora ha sido pagada. ¿Desea registrar el pago de la letra N° ${this.calculo?.numeroLetra} ahora?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#27ae60',
      cancelButtonColor:  '#6b7280',
      confirmButtonText:  'Sí, cobrar letra',
      cancelButtonText:   'No, cerrar'
    }).then(result => {
      if (result.isConfirmed && this.calculo) {
        this.onMoraPagadaQuierePagarLetra.emit(this.calculo);
      } else {
        this.onMoraPagadaSinLetra.emit();
      }
    });
  }

  confirmarPagarSoloLetra(): void {
    if (this.moraYaPagada || this.moraEsPendiente) {
      if (this.calculo) this.onConfirmarSinPagarMora.emit(this.calculo);
    } else {
      Swal.fire({
        title: 'Pagar solo la letra',
        html: `La mora de <strong>${this.simboloMoneda} ${this.calculo?.montoMoraTotal.toFixed(2)}</strong>
               quedará registrada como <strong>PENDIENTE</strong> para cobrarla después.<br><br>
               ¿Desea continuar?`,
        icon: 'warning',
        showCancelButton:     true,
        confirmButtonColor:   '#27ae60',
        cancelButtonColor:    '#6b7280',
        confirmButtonText:    'Sí, pagar letra',
        cancelButtonText:     'Cancelar'
      }).then(result => {
        if (result.isConfirmed && this.calculo) this.onConfirmarSinPagarMora.emit(this.calculo);
      });
    }
  }

  cancelar(): void { this.onCancelar.emit(); }
}