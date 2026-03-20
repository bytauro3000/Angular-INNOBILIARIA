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
  selector: 'app-pago-multiple-form',
  standalone: true,
  imports: [CommonModule, FormsModule, VoucherPreviewComponent],
  templateUrl: './pagoletra-multiple-insertar.html',
  styleUrls: ['./pagoletra-multiple-insertar.scss']
})
export class PagoLetraMultipleInsertarComponent implements OnInit, AfterViewInit {
  @ViewChild('modalElement') modalElement!: ElementRef;
  private modal?: bootstrap.Modal;

  @Input() letras: LetraCambio[] = [];
  @Input() contrato!: any;
  @Output() onClose = new EventEmitter<void>();
  @Output() onPagoExitoso = new EventEmitter<void>();

  medioPagoOptions = Object.values(MedioPago);
  tipoComprobanteOptions = Object.values(TipoComprobante);

  datosComunes = {
    medioPago: MedioPago.EFECTIVO,
    numeroOperacion: '',
    fechaOperacion: '',
    tipoComprobante: undefined as TipoComprobante | undefined,
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
    this.datosComunes.fechaOperacion = new Date().toISOString().split('T')[0];
    this.generarObservaciones();
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
    if (this.datosComunes.medioPago === MedioPago.EFECTIVO) {
      this.datosComunes.numeroOperacion = '';
      this.voucherFiles = [];
    }
  }

  getNumeroLetraLimpio(numeroLetra: string): string {
    return numeroLetra ? numeroLetra.split('/')[0] : '';
  }

  get importeTotal(): number {
    return this.letras.reduce((sum, l) => sum + l.importe, 0);
  }

  private generarObservaciones(): void {
    if (!this.contrato || !this.contrato.lotes || this.contrato.lotes.length === 0) {
      this.datosComunes.observaciones = '';
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

    const numeros = this.letras.map(l => this.getNumeroLetraLimpio(l.numeroLetra));

    let listaNumeros = '';
    if (numeros.length === 1) {
      listaNumeros = numeros[0];
    } else {
      const primeros = numeros.slice(0, -1).join(', ');
      listaNumeros = `${primeros} y ${numeros[numeros.length - 1]}`;
    }

    this.datosComunes.observaciones = `Pago de letras N° ${listaNumeros} de la Mz. ${mz} Lt. ${lt} del Programa: ${programa}`;
  }

  onTipoComprobanteChange(): void {
    if (this.datosComunes.tipoComprobante) {
      this.pagoService.sugerirNumeroComprobante(this.datosComunes.tipoComprobante).subscribe({
        next: (res) => {
          this.datosComunes.numeroComprobante = res.numeroSugerido;
        },
        error: (err) => console.error('Error al obtener sugerencia', err)
      });
    }
  }

  guardar(): void {
    if (!this.datosComunes.medioPago) {
      this.toastr.warning('Seleccione medio de pago', 'Validación');
      return;
    }

    if (this.datosComunes.medioPago !== MedioPago.EFECTIVO) {
      if (!this.datosComunes.numeroOperacion?.trim()) {
        this.toastr.warning('El número de operación es obligatorio para este medio de pago', 'Validación');
        return;
      }
      if (this.voucherFiles.length === 0) {
        this.toastr.warning('Debe adjuntar al menos un voucher para este medio de pago', 'Validación');
        return;
      }
    }

    if (!this.datosComunes.fechaOperacion) {
      this.toastr.warning('Ingrese fecha de operación', 'Validación');
      return;
    }
    if (!this.datosComunes.numeroComprobante?.trim()) {
      this.toastr.warning('Ingrese número de comprobante', 'Validación');
      return;
    }

    const requests: PagoLetraRequest[] = this.letras.map(letra => ({
      idLetra: letra.idLetra,
      importePagado: letra.importe,
      medioPago: this.datosComunes.medioPago,
      numeroOperacion: this.datosComunes.numeroOperacion,
      fechaOperacion: this.datosComunes.fechaOperacion,
      tipoComprobante: this.datosComunes.tipoComprobante,
      numeroComprobante: this.datosComunes.numeroComprobante,
      observaciones: this.datosComunes.observaciones
    }));

    this.enviando = true;
    this.pagoService.registrarPagosMultiples(requests, this.voucherFiles).subscribe({
      next: () => {
        this.toastr.success('Pagos registrados correctamente', 'Éxito');
        this.enviando = false;
        // Abrir comprobante consolidado automáticamente
        if (this.datosComunes.numeroComprobante) {
          this.pagoService.descargarComprobanteMultiple(this.datosComunes.numeroComprobante).subscribe({
            next: (blob) => {
              const url = URL.createObjectURL(blob);
              window.open(url, '_blank');
            },
            error: () => {} // Si falla no interrumpir el flujo
          });
        }
        this.cerrarModal();
        this.onPagoExitoso.emit();
      },
      error: (err) => {
        console.error('Error al registrar pagos múltiples:', err);
        const mensaje = err.error?.message || 'Error al registrar los pagos';
        this.toastr.error(mensaje, 'Error');
        this.enviando = false;
      }
    });
  }
}