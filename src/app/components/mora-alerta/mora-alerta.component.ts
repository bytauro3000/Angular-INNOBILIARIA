import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import Swal from 'sweetalert2';
import { MoraService } from '../../services/mora.service';
import { PagoLetraService } from '../../services/pagoletra.service';
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
  creandoMora   = false;

  medioPagoOptions       = Object.values(MedioPago);
  tipoComprobanteOptions = Object.values(TipoComprobante);

  moraPendiente: MoraResponse | null = null;
  moraPagada:    MoraResponse | null = null;
  cargandoEstadoMora = true;

  // Preview readonly del número de comprobante (el backend asigna el real)
  numeroComprobantePreview: string = '';
  cargandoPreview: boolean = false;

  // Modo manual: permite ingresar un número personalizado
  modoManualComprobante: boolean = false;
  numeroComprobanteManual: string = '';

  request: PagoMoraRequest = {
    idMora: 0,
    montoPagado: 0,
    fechaPago: '',
    medioPago: MedioPago.EFECTIVO,
    numeroOperacion: '',
    tipoComprobante: undefined,
    numeroComprobantePersonalizado: undefined,
    // numeroComprobante eliminado: el backend lo genera automáticamente
    observaciones: ''
  };

  constructor(
    private moraService: MoraService,
    private pagoLetraService: PagoLetraService,
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

  get moraYaPagada(): boolean { return this.moraPagada !== null; }
  get moraEsPendiente(): boolean { return this.moraPendiente !== null; }

  get idMoraParaPago(): number | null {
    if (this.moraPendiente) return this.moraPendiente.idMora;
    if (this.calculo?.tieneMoraPrevia && this.calculo.idMoraPrevia) return this.calculo.idMoraPrevia;
    return null;
  }

  abrirFormPagarMora(): void {
    if (!this.calculo || this.creandoMora || this.moraYaPagada) return;

    this.request.montoPagado       = this.calculo.montoMoraTotal;
    this.request.fechaPago         = new Date().toISOString().split('T')[0];
    this.request.medioPago         = MedioPago.EFECTIVO;
    this.request.numeroOperacion   = '';
    this.request.tipoComprobante   = undefined;
    this.request.observaciones     = `Pago de mora - Letra N° ${this.calculo.numeroLetra}`;
    // Limpiar preview y modo manual al abrir el formulario
    this.numeroComprobantePreview      = '';
    this.modoManualComprobante         = false;
    this.numeroComprobanteManual       = '';
    this.request.numeroComprobantePersonalizado = undefined;

    const idMora = this.idMoraParaPago;

    if (idMora) {
      this.request.idMora = idMora;
      this.mostrarFormPagarMora = true;
    } else {
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

  /**
   * Al seleccionar tipo de comprobante, consulta el siguiente número disponible
   * desde el endpoint centralizado y lo muestra como preview readonly.
   * El backend asigna el número real y correlativo al guardar.
   */
  onTipoComprobanteChange(): void {
    this.numeroComprobantePreview = '';
    this.modoManualComprobante = false;
    this.numeroComprobanteManual = '';
    this.request.numeroComprobantePersonalizado = undefined;
    if (this.request.tipoComprobante) {
      this.cargandoPreview = true;
      this.pagoLetraService.previewSiguienteNumeroComprobante(this.request.tipoComprobante).subscribe({
        next:  (numero) => { this.numeroComprobantePreview = numero; this.cargandoPreview = false; },
        error: ()       => { this.cargandoPreview = false; }
      });
    }
  }

  /** Alterna entre modo automático y modo manual para el N° comprobante */
  private get seriePrefix(): string {
    const idx = this.numeroComprobantePreview.indexOf('-');
    return idx >= 0 ? this.numeroComprobantePreview.substring(0, idx + 1) : '';
  }

  toggleModoManual(): void {
    if (this.cargandoPreview) return;
    this.modoManualComprobante = !this.modoManualComprobante;
    if (this.modoManualComprobante) {
      this.numeroComprobanteManual = this.seriePrefix;
      this.request.numeroComprobantePersonalizado = undefined;
    } else {
      this.numeroComprobanteManual = '';
      this.request.numeroComprobantePersonalizado = undefined;
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
    this.request.numeroComprobantePersonalizado = soloDigitos ? valor.trim() : undefined;
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
    // Eliminada la validación de numeroComprobante: el backend lo genera

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

  confirmarPagarSoloLetra(): void {
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