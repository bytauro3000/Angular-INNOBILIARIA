import {
  Component, EventEmitter, Input, OnInit, Output,
  ViewChild, ElementRef, AfterViewInit
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import * as bootstrap from 'bootstrap';

import { LetraCambio } from '../../models/letra-cambio.model';
import { PagoLetraService } from '../../services/pagoletra.service';
import { MoraService } from '../../services/mora.service';
import { PagoLetraRequest } from '../../dto/pagoletrarequest.dto';
import { PagoMoraRequest } from '../../dto/pagomorarequest.dto';
import { CalculoMoraDTO } from '../../dto/calculomora.dto';
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

  @Input() calculoMora: CalculoMoraDTO | null = null;
  @Input() moraPreviamentePagada: boolean = false;

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
    numeroComprobantePersonalizado: undefined,
    observaciones: ''
    // numeroComprobante eliminado: el backend lo genera automáticamente
  };

  // Número de comprobante sugerido: solo para mostrar al cajero (readonly por defecto)
  numeroComprobantePreview: string = '';
  cargandoPreview: boolean = false;

  // Modo manual: permite al usuario ingresar un número personalizado
  modoManualComprobante: boolean = false;
  numeroComprobanteManual: string = '';

  voucherFiles: File[] = [];
  enviando: boolean = false;

  pagarMoraTambien: boolean = false;
  moraDecisionTomada: boolean = false;
  pagandoMora: boolean = false;

  constructor(
    private pagoService: PagoLetraService,
    private moraService: MoraService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.pagoRequest.idLetra = this.letra.idLetra;
    this.pagoRequest.importePagado = this.letra.importe;
    this.pagoRequest.fechaOperacion = new Date().toISOString().split('T')[0];
    this.generarObservaciones();

    if (this.moraPreviamentePagada) {
      this.pagarMoraTambien = false;
      this.moraDecisionTomada = true;
    } else {
      this.pagarMoraTambien = false;
      this.moraDecisionTomada = false;
    }
  }

  ngAfterViewInit(): void {
    this.modal = new bootstrap.Modal(this.modalElement.nativeElement);
    this.modal.show();
  }

  cerrarModal(): void {
    this.modal?.hide();
    setTimeout(() => this.onClose.emit(), 300);
  }

  get numeroLetraLimpio(): string {
    return this.letra?.numeroLetra ? this.letra.numeroLetra.split('/')[0] : '';
  }

  get simboloMoneda(): string {
    return this.contrato?.moneda === 'PEN' ? 'S/.' : '$';
  }

  get totalConMora(): number {
    if (this.pagarMoraTambien && this.calculoMora) {
      return this.letra.importe + this.calculoMora.montoMoraTotal;
    }
    return this.letra.importe;
  }

  togglePagarMora(): void {
    this.pagarMoraTambien = !this.pagarMoraTambien;
    this.moraDecisionTomada = true;
  }

  private generarObservaciones(): void {
    if (!this.contrato || !this.contrato.lotes || this.contrato.lotes.length === 0) {
      this.pagoRequest.observaciones = '';
      return;
    }
    const primerLote = this.contrato.lotes[0];
    const mz = primerLote.manzana || '';
    const lt = primerLote.numeroLote || '';
    const programa: string =
      primerLote.programa?.nombrePrograma
      || primerLote.nombrePrograma
      || this.contrato.programa?.nombrePrograma
      || '';
    this.pagoRequest.observaciones =
      `Pago de letra N° ${this.numeroLetraLimpio} de la Mz. ${mz} Lt. ${lt} del Programa: ${programa}`;
  }

  onMedioPagoChange(): void {
    if (this.pagoRequest.medioPago === MedioPago.EFECTIVO) {
      this.pagoRequest.numeroOperacion = '';
      this.voucherFiles = [];
    }
  }

  /**
   * Al seleccionar el tipo de comprobante, consulta al backend el siguiente
   * número que se emitirá y lo muestra como preview readonly.
   * El campo es solo informativo: el backend genera el número real al guardar.
   */
  onTipoComprobanteChange(): void {
    this.numeroComprobantePreview = '';
    this.modoManualComprobante = false;
    this.numeroComprobanteManual = '';
    if (this.pagoRequest.tipoComprobante) {
      this.cargandoPreview = true;
      this.pagoService.previewSiguienteNumeroComprobante(this.pagoRequest.tipoComprobante).subscribe({
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
      // Pre-llenar con el prefijo de serie (ej: "RB01-")
      this.numeroComprobanteManual = this.seriePrefix;
      this.pagoRequest.numeroComprobantePersonalizado = undefined;
    } else {
      this.numeroComprobanteManual = '';
      this.pagoRequest.numeroComprobantePersonalizado = undefined;
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
    this.pagoRequest.numeroComprobantePersonalizado = soloDigitos ? valor.trim() : undefined;
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
    if (!this.pagoRequest.tipoComprobante) {
      this.toastr.warning('Debe seleccionar el tipo de comprobante', 'Validación');
      return;
    }
    // Ya no se valida numeroComprobante: lo genera el backend
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
        if (this.pagarMoraTambien && this.calculoMora && !this.moraPreviamentePagada) {
          this.registrarPagoMoraTrasLetra(response.idPago);
        } else {
          this.finalizarPago(response.idPago);
        }
      },
      error: (err) => {
        const mensaje = err.error?.message || 'Error al registrar el pago';
        this.toastr.error(mensaje, 'Error');
        this.enviando = false;
      }
    });
  }

  private registrarPagoMoraTrasLetra(idPagoLetra: number): void {
    this.pagandoMora = true;

    this.moraService.listarPorLetra(this.letra.idLetra).subscribe({
      next: (moras) => {
        const moraPendiente = moras.find(m => m.estadoMora === 'PENDIENTE');
        if (!moraPendiente) {
          this.toastr.warning(
            'La letra fue pagada. No se encontró mora pendiente para registrar.',
            'Aviso'
          );
          this.pagandoMora = false;
          this.finalizarPago(idPagoLetra);
          return;
        }

        const fechaPago: string =
          this.pagoRequest.fechaOperacion || new Date().toISOString().split('T')[0];

        const pagoMora: PagoMoraRequest = {
          idMora:          moraPendiente.idMora,
          montoPagado:     moraPendiente.montoMoraTotal,
          fechaPago:       fechaPago,
          medioPago:       this.pagoRequest.medioPago,
          numeroOperacion: this.pagoRequest.numeroOperacion,
          tipoComprobante: this.pagoRequest.tipoComprobante,
          // numeroComprobante eliminado: el backend asigna el siguiente en secuencia
          observaciones:   `Mora pagada junto con la letra N° ${this.numeroLetraLimpio}`
        };

        this.moraService.pagarMora(pagoMora).subscribe({
          next: (pagoMoraRes) => {
            this.toastr.success('Letra y mora pagadas correctamente', 'Éxito');
            this.pagandoMora = false;
            this.abrirComprobanteMora(pagoMoraRes.idPagoMora);
            this.finalizarPago(idPagoLetra);
          },
          error: (err) => {
            const msg = err?.error?.message
              || 'La letra fue pagada pero hubo un error al registrar la mora.';
            this.toastr.warning(
              msg + ' Puedes pagarla desde "Ver Moras".',
              'Pago parcial'
            );
            this.pagandoMora = false;
            this.finalizarPago(idPagoLetra);
          }
        });
      },
      error: () => {
        this.toastr.warning(
          'Letra pagada. No se pudo consultar la mora. Revisa en "Ver Moras".',
          'Aviso'
        );
        this.pagandoMora = false;
        this.finalizarPago(idPagoLetra);
      }
    });
  }

  private finalizarPago(idPago: number): void {
    this.enviando = false;
    this.cerrarModal();
    this.onPagoExitoso.emit();

    this.pagoService.descargarComprobante(idPago).subscribe({
      next: (blob) => { window.open(URL.createObjectURL(blob), '_blank'); },
      error: () => {
        this.toastr.warning(
          'Pago guardado. No se pudo abrir el comprobante automáticamente.',
          'Aviso'
        );
      }
    });
  }

  private abrirComprobanteMora(idPagoMora: number): void {
    this.moraService.descargarComprobante(idPagoMora).subscribe({
      next: (blob) => { window.open(URL.createObjectURL(blob), '_blank'); },
      error: () => {}
    });
  }
}