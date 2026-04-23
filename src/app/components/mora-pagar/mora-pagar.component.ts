import {
  Component, EventEmitter, Input, OnInit, Output,
  ViewChild, ElementRef, AfterViewInit
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import * as bootstrap from 'bootstrap';
import { MoraService } from '../../services/mora.service';
import { MoraResponse } from '../../dto/moraresponse.dto';
import { PagoMoraRequest } from '../../dto/pagomorarequest.dto';
import { MedioPago } from '../../enums/mediopago.enum';
import { TipoComprobante } from '../../enums/tipocomprobante';
import { PagoLetraService } from '../../services/pagoletra.service';

@Component({
  selector: 'app-mora-pagar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './mora-pagar.html',
  styleUrls: ['./mora-pagar.scss']
})
export class MoraPagarComponent implements OnInit, AfterViewInit {
  @ViewChild('modalElement') modalElement!: ElementRef;
  private modal?: bootstrap.Modal;

  @Input() mora!: MoraResponse;
  @Input() simboloMoneda: string = '$';

  @Output() onClose = new EventEmitter<void>();
  @Output() onPagoExitoso = new EventEmitter<number>();

  medioPagoOptions    = Object.values(MedioPago);
  tipoComprobanteOptions = Object.values(TipoComprobante);
  enviando = false;

  // Preview readonly del número que se emitirá
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
    private toastr: ToastrService,
    private pagoLetraService: PagoLetraService
  ) {}

  ngOnInit(): void {
    this.request.idMora      = this.mora.idMora;
    this.request.montoPagado = this.mora.montoMoraTotal;
    this.request.fechaPago   = new Date().toISOString().split('T')[0];
    this.request.observaciones = `Pago de mora - Letra N° ${this.mora.numeroLetra}`;
  }

  ngAfterViewInit(): void {
    this.modal = new bootstrap.Modal(this.modalElement.nativeElement);
    this.modal.show();
  }

  cerrarModal(): void {
    this.modal?.hide();
    setTimeout(() => this.onClose.emit(), 300);
  }

  onMedioPagoChange(): void {
    if (this.request.medioPago === MedioPago.EFECTIVO) {
      this.request.numeroOperacion = '';
    }
  }

  /**
   * Al seleccionar tipo de comprobante, consulta el siguiente número disponible
   * (secuencia compartida con pagos de letra) y lo muestra como preview readonly.
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
        next: (numero) => {
          this.numeroComprobantePreview = numero;
          this.cargandoPreview = false;
        },
        error: () => { this.cargandoPreview = false; }
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

  guardarPago(): void {
    if (!this.request.medioPago) {
      this.toastr.warning('Debe seleccionar un medio de pago', 'Validación');
      return;
    }
    if (this.request.medioPago !== MedioPago.EFECTIVO && !this.request.numeroOperacion?.trim()) {
      this.toastr.warning('El número de operación es obligatorio para este medio de pago', 'Validación');
      return;
    }
    if (!this.request.tipoComprobante) {
      this.toastr.warning('Debe seleccionar el tipo de comprobante', 'Validación');
      return;
    }
    // Eliminada la validación de numeroComprobante: el backend lo genera

    this.enviando = true;
    this.moraService.pagarMora(this.request).subscribe({
      next: (res) => {
        this.toastr.success('Mora pagada correctamente', 'Éxito');
        this.enviando = false;
        this.cerrarModal();
        this.onPagoExitoso.emit(res.idPagoMora);
      },
      error: (err) => {
        const msg = err?.error?.message || 'Error al registrar el pago de mora';
        this.toastr.error(msg, 'Error');
        this.enviando = false;
      }
    });
  }
}