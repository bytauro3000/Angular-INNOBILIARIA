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

  /**
   * Si viene con valor, la letra está vencida y existe cálculo de mora.
   * El operador puede decidir si pagar la mora ahora o dejarla pendiente.
   * Si viene NULL aquí, puede significar:
   *   a) La letra no está vencida (sin mora), O
   *   b) La mora YA FUE PAGADA antes de abrir este modal (flujo: Pagar Mora → Pagar Letra)
   * En ambos casos NO se debe volver a crear ni cobrar mora.
   */
  @Input() calculoMora: CalculoMoraDTO | null = null;

  /**
   * NUEVO: bandera que indica explícitamente que la mora ya fue pagada
   * en el paso anterior (desde mora-alerta). Se usa para no mostrar
   * el aviso de mora ni intentar registrarla de nuevo.
   */
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
    numeroComprobante: '',
    observaciones: ''
  };

  voucherFiles: File[] = [];
  enviando: boolean = false;

  // ── Lógica de mora ────────────────────────────────────────────────────────
  // true  = el operador marcó "quiero pagar mora ahora"
  pagarMoraTambien: boolean = false;
  // true  = el operador ya interactuó con el checkbox (oculta la sección alerta inicial)
  moraDecisionTomada: boolean = false;
  // true  = spinner mientras se llama al endpoint de pago de mora
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

    // Si la mora ya fue pagada previamente, ocultamos el aviso de mora
    // y marcamos la decisión como ya tomada para no mostrar el checkbox.
    if (this.moraPreviamentePagada) {
      this.pagarMoraTambien = false;
      this.moraDecisionTomada = true; // oculta la sección de alerta de mora
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

  // ── Computed getters ──────────────────────────────────────────────────────

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

  // ── Toggle del checkbox de mora ───────────────────────────────────────────

  togglePagarMora(): void {
    this.pagarMoraTambien = !this.pagarMoraTambien;
    this.moraDecisionTomada = true;
  }

  // ── Helpers privados ──────────────────────────────────────────────────────

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
   * CORRECCIÓN: El autoincremento del número de comprobante ahora consulta
   * al servicio de mora (endpoint /api/moras/sugerir-numero), el cual en
   * el backend compara los registros de pago_mora Y pago_letra, toma el
   * valor más alto de los dos y le añade 1 para el siguiente número.
   * Esto garantiza que el número sea único y correlativo entre ambas tablas.
   */
  onTipoComprobanteChange(): void {
    if (this.pagoRequest.tipoComprobante) {
      this.moraService.sugerirNumeroComprobante(this.pagoRequest.tipoComprobante).subscribe({
        next: (res) => { this.pagoRequest.numeroComprobante = res.numeroSugerido; },
        error: (err) => { console.error('Error al obtener sugerencia de número', err); }
      });
    }
  }

  // ── Guardar pago ──────────────────────────────────────────────────────────

  guardarPago(): void {
    // ── Validaciones básicas
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
    if (!this.pagoRequest.numeroComprobante?.trim()) {
      this.toastr.warning('Debe ingresar el número de comprobante', 'Validación');
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
        /**
         * CORRECCIÓN PRINCIPAL:
         * Solo intentamos registrar la mora si se cumplen las 3 condiciones:
         *   1. El operador eligió pagar la mora también (checkbox activo)
         *   2. Existe un cálculo de mora (la letra está vencida)
         *   3. La mora NO fue pagada previamente en el paso anterior
         *
         * Si moraPreviamentePagada = true, significa que el operador ya pagó
         * la mora desde el modal de mora-alerta, por lo tanto NO se debe
         * volver a buscar ni registrar una mora PENDIENTE para esta letra.
         */
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

  /**
   * Después de registrar el pago de la letra, el backend ya creó la mora
   * en estado PENDIENTE. Ahora la consultamos por idLetra y la pagamos.
   * Este método SOLO se llama cuando pagarMoraTambien=true Y moraPreviamentePagada=false.
   */
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
          idMora:            moraPendiente.idMora,
          montoPagado:       moraPendiente.montoMoraTotal,
          fechaPago:         fechaPago,
          medioPago:         this.pagoRequest.medioPago,
          numeroOperacion:   this.pagoRequest.numeroOperacion,
          tipoComprobante:   this.pagoRequest.tipoComprobante,
          numeroComprobante: this.pagoRequest.numeroComprobante,
          observaciones:     `Mora pagada junto con la letra N° ${this.numeroLetraLimpio}`
        };

        this.moraService.pagarMora(pagoMora).subscribe({
          next: (pagoMoraRes) => {
            this.toastr.success('Letra y mora pagadas correctamente', 'Éxito');
            this.pagandoMora = false;
            // Abrir comprobante de mora también
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

    // Abrir comprobante de letra en nueva pestaña
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
      error: () => { /* silencioso — el operador puede descargarlo desde el listado */ }
    });
  }
}