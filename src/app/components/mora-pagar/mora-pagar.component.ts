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
  sugerindoNumero = false;

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
   * Cuando el usuario cambia el tipo de comprobante, consulta al backend
   * el siguiente número disponible considerando TANTO pagos de letra
   * como pagos de mora (secuencia compartida).
   */
  onTipoComprobanteChange(): void {
  if (this.request.tipoComprobante) {
    this.sugerindoNumero = true;
    this.pagoLetraService.sugerirNumeroComprobante(this.request.tipoComprobante).subscribe({
      next: (res) => {
        this.request.numeroComprobante = res.numeroSugerido;
        this.sugerindoNumero = false;
      },
      error: () => { this.sugerindoNumero = false; }
    });
  } else {
    this.request.numeroComprobante = '';
  }
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
    if (!this.request.numeroComprobante?.trim()) {
      this.toastr.warning('Debe ingresar el número de comprobante', 'Validación');
      return;
    }

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