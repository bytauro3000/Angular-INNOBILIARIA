import { Component, EventEmitter, Input, OnInit, Output, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import * as bootstrap from 'bootstrap';

import { LetraCambio } from '../../models/letra-cambio.model';
import { PagoLetraService } from '../../services/pagoletra.service';
import { PagoLetraRequest } from '../../dto/pagoletrarequest .dto';
import { MedioPago } from '../../enums/mediopago.enum';
import { TipoComprobante } from '../../enums/tipocomprobante';

@Component({
  selector: 'app-pago-letra-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
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

  voucherFile: File | null = null;
  enviando: boolean = false;

  constructor(
    private pagoService: PagoLetraService,
    private toastr: ToastrService
  ) {}

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

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.voucherFile = file;
    }
  }

  onMedioPagoChange(): void {
    // Si es EFECTIVO, limpiamos los campos que se bloquean (opcional)
    if (this.pagoRequest.medioPago === MedioPago.EFECTIVO) {
      this.pagoRequest.numeroOperacion = '';
      this.voucherFile = null;
      // Resetear input file
      const fileInput = document.getElementById('voucher') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
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
    // Si no es efectivo, validamos que los campos estén llenos
    if (this.pagoRequest.medioPago !== MedioPago.EFECTIVO) {
      if (!this.pagoRequest.numeroOperacion?.trim()) {
        this.toastr.warning('El número de operación es obligatorio para este medio de pago', 'Validación');
        return;
      }
      if (!this.voucherFile) {
        this.toastr.warning('Debe adjuntar un voucher para este medio de pago', 'Validación');
        return;
      }
    }

    this.enviando = true;
    this.pagoService.registrarPago(this.pagoRequest, this.voucherFile || undefined).subscribe({
      next: () => {
        this.toastr.success('Pago registrado correctamente', 'Éxito');
        this.enviando = false;
        this.cerrarModal();
        this.onPagoExitoso.emit();
      },
      error: (err) => {
        console.error('Error al registrar pago:', err);
        this.toastr.error('Error al registrar el pago', 'Error');
        this.enviando = false;
      }
    });
  }
}