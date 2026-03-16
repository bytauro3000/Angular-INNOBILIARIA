import { Component, EventEmitter, Input, OnInit, Output, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import * as bootstrap from 'bootstrap';

import { LetraCambio } from '../../models/letra-cambio.model';
import { PagoLetraService } from '../../services/pagoletra.service';
import { PagoLetraRequest } from '../../dto/pagoletrarequest.dto';
import { MedioPago } from '../../enums/mediopago.enum';
import { TipoComprobante } from '../../enums/tipocomprobante';
import { VoucherPreviewComponent } from '../voucher-preview/voucher-preview.componente';

@Component({
  selector: 'app-pago-letra-form',
  standalone: true,
  imports: [CommonModule, FormsModule, VoucherPreviewComponent],
  templateUrl: './pagoletra-insertar.html',
  styleUrls: ['./pagoletra-insertar.scss']
})
export class PagoletraInsertarComponent implements OnInit, AfterViewInit {
  @ViewChild('modalElement') modalElement!: ElementRef;
  private modal?: bootstrap.Modal;

  @Input() letra!: LetraCambio;
  @Input() contrato!: any;
  @Output() onClose = new EventEmitter<void>();
  @Output() onPagoExitoso = new EventEmitter<void>();

  medioPagoOptions = Object.values(MedioPago);
  tipoComprobanteOptions = Object.values(TipoComprobante);

  pagoRequest: PagoLetraRequest = {
    idLetra: 0,
    importePagado: 0,
    medioPago: MedioPago.EFECTIVO,
    numeroOperacion: '',
    fechaOperacion: '',
    tipoComprobante: undefined,
    numeroComprobante: '',
    observaciones: ''
  };

  voucherFiles: File[] = [];
  enviando: boolean = false;

  constructor(
    private pagoService: PagoLetraService,
    private toastr: ToastrService
  ) { }

  ngOnInit(): void {
    this.pagoRequest.idLetra = this.letra.idLetra;
    this.pagoRequest.importePagado = this.letra.importe;
    this.pagoRequest.fechaOperacion = new Date().toISOString().split('T')[0];
    this.generarObservaciones();
  }

  ngAfterViewInit(): void {
    this.modal = new bootstrap.Modal(this.modalElement.nativeElement);
    this.modal.show();
  }

  cerrarModal(): void {
    this.modal?.hide();
    setTimeout(() => {
      this.onClose.emit();
    }, 300);
  }

  get numeroLetraLimpio(): string {
    return this.letra?.numeroLetra ? this.letra.numeroLetra.split('/')[0] : '';
  }

  private generarObservaciones(): void {
    if (!this.contrato || !this.contrato.lotes || this.contrato.lotes.length === 0) {
      this.pagoRequest.observaciones = '';
      return;
    }

    const primerLote = this.contrato.lotes[0];
    const mz = primerLote.manzana || '';
    const lt = primerLote.numeroLote || '';

    let programa = '';
    if (primerLote.programa?.nombrePrograma) {
      programa = primerLote.programa.nombrePrograma;
    } else if (primerLote.nombrePrograma) {
      programa = primerLote.nombrePrograma;
    } else if (this.contrato.programa?.nombrePrograma) {
      programa = this.contrato.programa.nombrePrograma;
    }

    this.pagoRequest.observaciones = `Pago de letra N° ${this.numeroLetraLimpio} de la Mz. ${mz} Lt. ${lt} del Programa: ${programa}`;
  }

  onMedioPagoChange(): void {
    if (this.pagoRequest.medioPago === MedioPago.EFECTIVO) {
      this.pagoRequest.numeroOperacion = '';
      this.voucherFiles = [];
    }
  }

  onTipoComprobanteChange(): void {
    if (this.pagoRequest.tipoComprobante) {
      this.pagoService.sugerirNumeroComprobante(this.pagoRequest.tipoComprobante).subscribe({
        next: (res) => {
          this.pagoRequest.numeroComprobante = res.numeroSugerido;
        },
        error: (err) => {
          console.error('Error al obtener sugerencia de número', err);
        }
      });
    }
  }

  guardarPago(): void {
    if (!this.pagoRequest.importePagado || this.pagoRequest.importePagado <= 0) {
      this.toastr.warning('El importe pagado debe ser mayor a cero', 'Validación');
      return;
    }
    if (!this.pagoRequest.medioPago) {
      this.toastr.warning('Debe seleccionar un medio de pago', 'Validación');
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

    this.enviando = true;
    this.pagoService.registrarPago(this.pagoRequest, this.voucherFiles).subscribe({
      next: (response) => {
        this.toastr.success('Pago registrado correctamente', 'Éxito');
        this.enviando = false;
        this.cerrarModal();
        this.onPagoExitoso.emit();

        // Abrir comprobante PDF automáticamente en nueva pestaña
        this.pagoService.descargarComprobante(response.idPago).subscribe({
          next: (blob) => {
            const url = URL.createObjectURL(blob);
            window.open(url, '_blank');
          },
          error: () => {
            // No interrumpir el flujo si el PDF falla — el pago ya quedó guardado
            this.toastr.warning('Pago guardado. No se pudo abrir el comprobante automáticamente.', 'Aviso');
          }
        });
      },
      error: (err) => {
        console.error('Error al registrar pago:', err);
        const mensaje = err.error?.message || 'Error al registrar el pago';
        this.toastr.error(mensaje, 'Error');
        this.enviando = false;
      }
    });
  }
}