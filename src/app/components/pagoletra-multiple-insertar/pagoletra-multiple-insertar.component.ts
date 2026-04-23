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
    observaciones: ''
    // numeroComprobante eliminado: el backend lo genera automáticamente
  };

  // Preview readonly del número que se emitirá (informativo)
  numeroComprobantePreview: string = '';
  cargandoPreview: boolean = false;

  // Modo manual: permite ingresar un número personalizado
  modoManualComprobante: boolean = false;
  numeroComprobanteManual: string = '';

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

  /**
   * Al seleccionar tipo de comprobante, consulta el siguiente número disponible
   * y lo muestra como preview readonly (el backend asigna el número real al guardar).
   */
  onTipoComprobanteChange(): void {
    this.numeroComprobantePreview = '';
    this.modoManualComprobante = false;
    this.numeroComprobanteManual = '';
    if (this.datosComunes.tipoComprobante) {
      this.cargandoPreview = true;
      this.pagoService.previewSiguienteNumeroComprobante(this.datosComunes.tipoComprobante).subscribe({
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
    } else {
      this.numeroComprobanteManual = '';
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

    if (!this.datosComunes.tipoComprobante) {
      this.toastr.warning('Debe seleccionar el tipo de comprobante', 'Validación');
      return;
    }
    // Eliminada la validación de numeroComprobante: el backend lo genera

    const requests: PagoLetraRequest[] = this.letras.map(letra => ({
      idLetra: letra.idLetra,
      importePagado: letra.importe,
      medioPago: this.datosComunes.medioPago,
      numeroOperacion: this.datosComunes.numeroOperacion,
      fechaOperacion: this.datosComunes.fechaOperacion,
      tipoComprobante: this.datosComunes.tipoComprobante,
      numeroComprobantePersonalizado: this.modoManualComprobante && this.numeroComprobanteManual.trim()
        ? this.numeroComprobanteManual.trim()
        : undefined,
      observaciones: this.datosComunes.observaciones
      // numeroComprobante eliminado del request
    }));

    this.enviando = true;
    this.pagoService.registrarPagosMultiples(requests, this.voucherFiles).subscribe({
      next: (res: any) => {
        this.toastr.success('Pagos registrados correctamente', 'Éxito');
        this.enviando = false;
        // Descargar comprobante consolidado usando el numeroCompleto que devuelve el backend
        const numeroComprobante = res?.numeroComprobanteGenerado || res?.numeroCompleto;
        if (numeroComprobante) {
          this.pagoService.descargarComprobanteMultiple(numeroComprobante).subscribe({
            next: (blob) => { window.open(URL.createObjectURL(blob), '_blank'); },
            error: () => {}
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