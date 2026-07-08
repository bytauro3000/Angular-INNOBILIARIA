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
import { PagoMoraResponse } from '../../dto/pagomoraresponse.dto';
import { MedioPago } from '../../enums/mediopago.enum';
import { TipoComprobante } from '../../enums/tipocomprobante';
import { PagoLetraService } from '../../services/pagoletra.service';
import { VoucherPreviewComponent } from '../voucher-preview/voucher-preview.componente';
import { VoucherOcrData } from '../../services/ocr-voucher.service';
import { obtenerFechaPeru } from '../../utils/fecha-peru';

@Component({
  selector: 'app-mora-pagar',
  standalone: true,
  imports: [CommonModule, FormsModule, VoucherPreviewComponent],
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
  tipoComprobanteOptions = Object.values(TipoComprobante).filter(t => t === 'RECIBO' || t === 'BOLETA');
  enviando = false;

  // Archivos de voucher seleccionados
  voucherFiles: File[] = [];
  private ocrOperationNumbers: Map<string, string> = new Map();

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
    this.request.fechaPago   = obtenerFechaPeru();
    this.request.observaciones = `Pago de mora - Letra N° ${this.mora.numeroLetra}`;
  }

  ngAfterViewInit(): void {
    this.modal = new bootstrap.Modal(this.modalElement.nativeElement, {
      backdrop: 'static',
      keyboard: false
    });
    this.modal.show();
  }

  cerrarModal(): void {
    this.modal?.hide();
    setTimeout(() => {
      this.modal?.dispose();
      // Restaurar el scroll del body que Bootstrap bloquea al abrir el modal
      document.body.classList.remove('modal-open');
      document.body.style.removeProperty('overflow');
      document.body.style.removeProperty('padding-right');
      // Eliminar el backdrop residual si quedara alguno
      document.querySelectorAll('.modal-backdrop').forEach(el => el.remove());
      this.onClose.emit();
    }, 300);
  }

  onMedioPagoChange(): void {
    if (this.request.medioPago === MedioPago.EFECTIVO) {
      this.request.numeroOperacion = '';
    }
  }

  /**
   * Recibe los datos extraídos por OCR del voucher.
   * Sobrescribe siempre los campos detectados (el usuario puede corregir manualmente después).
   */
  onVoucherOcr(data: VoucherOcrData): void {
    console.log('[OCR] Datos extraídos:', data);

    const cambios: string[] = [];

    if (data.numeroOperacion && data.fileName) {
      this.ocrOperationNumbers.set(data.fileName, data.numeroOperacion);
      this.actualizarNumeroOperacion();
      cambios.push(`N° op: ${data.numeroOperacion}`);
    }

    if (data.fechaPago) {
      this.request.fechaPago = data.fechaPago;
      cambios.push(`Fecha: ${data.fechaPago}`);
    }

    if (cambios.length > 0) {
      this.toastr.info(
        `Detectado (${data.confidence.toFixed(0)}% conf.): ${cambios.join(' | ')}`,
        'OCR'
      );
    } else {
      this.toastr.warning(
        `No se pudo extraer datos del voucher "${data.fileName ?? ''}". Lláenalos manualmente.`,
        'OCR'
      );
    }
  }

  onVoucherFilesChange(files: File[]): void {
    const nombresActuales = new Set(files.map(f => f.name));
    for (const fileName of this.ocrOperationNumbers.keys()) {
      if (!nombresActuales.has(fileName)) {
        this.ocrOperationNumbers.delete(fileName);
      }
    }
    this.actualizarNumeroOperacion();
  }

  private actualizarNumeroOperacion(): void {
    const numeros = Array.from(this.ocrOperationNumbers.values());
    this.request.numeroOperacion = numeros.length > 0 ? numeros.join(', ') : '';
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
    if (this.enviando) return;
    if (!this.request.medioPago) {
      this.toastr.warning('Debe seleccionar un medio de pago', 'Validación');
      return;
    }
    if (this.request.medioPago !== MedioPago.EFECTIVO && !this.request.numeroOperacion?.trim()) {
      this.toastr.warning('El número de operación es obligatorio para este medio de pago', 'Validación');
      return;
    }
    if (this.request.medioPago !== MedioPago.EFECTIVO && this.voucherFiles.length === 0) {
      this.toastr.warning('Debe adjuntar al menos un voucher para este medio de pago', 'Validación');
      return;
    }
    if (!this.request.tipoComprobante) {
      this.toastr.warning('Debe seleccionar el tipo de comprobante', 'Validación');
      return;
    }

    this.enviando = true;
    this.moraService.pagarMora(this.request, this.voucherFiles).subscribe({
      next: (res: PagoMoraResponse) => {
        let mensaje = 'Mora pagada correctamente';
        if (res.sunatAceptado) {
          mensaje += '. Boleta enviada a SUNAT: ACEPTADA';
        }
        this.toastr.success(mensaje, 'Éxito', { timeOut: 6000 });
        this.enviando = false;
        this.voucherFiles = [];
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