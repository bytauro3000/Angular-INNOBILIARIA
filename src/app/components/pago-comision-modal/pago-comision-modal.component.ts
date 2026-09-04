import { Component, OnInit, AfterViewInit, ViewChild, ElementRef, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import * as bootstrap from 'bootstrap';
import { ComisionVendedorService } from '../../services/comision-vendedor.service';
import { TokenService } from '../../auth/token.service';
import { VoucherPreviewComponent } from '../voucher-preview/voucher-preview.componente';
import { VoucherOcrData } from '../../services/ocr-voucher.service';
import { MedioPago } from '../../enums/mediopago.enum';
import { obtenerFechaPeru } from '../../utils/fecha-peru';
import { ToastrService } from 'ngx-toastr';
import {
  ComisionVendedorDTO,
  PagoComisionMensualDTO,
  PagoComisionRequest
} from '../../dto/comision-vendedor.dto';

@Component({
  selector: 'app-pago-comision-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, VoucherPreviewComponent],
  templateUrl: './pago-comision-modal.html',
  styleUrls: ['./pago-comision-modal.scss']
})
export class PagoComisionModal implements OnInit, AfterViewInit {

  @ViewChild('modalElement') modalElement!: ElementRef;
  @Input() comision!: ComisionVendedorDTO;
  @Input() tipo: 'ADELANTO' | 'MENSUAL' = 'ADELANTO';
  /** Para MENSUAL: letras pagadas de la comisión (con montoComision calculado). */
  @Input() letrasHabilitadas: PagoComisionMensualDTO[] = [];
  @Output() onClose = new EventEmitter<void>();
  @Output() onPagoExitoso = new EventEmitter<void>();

  private modal?: bootstrap.Modal;

  medioPagoOptions = Object.values(MedioPago);
  fechaPago: string = obtenerFechaPeru();
  fechaOperacion: string = '';
  numeroOperacion: string = '';
  medioPago: string = 'EFECTIVO';
  monto: number = 0;
  observacion: string = '';
  voucherFiles: File[] = [];
  enviando: boolean = false;
  /** Número del recibo de egreso que se generará (ej: EG01-7). */
  numeroEgresoPreview: string = '';

  private ocrOperationNumbers: Map<string, string> = new Map();

  constructor(
    private comisionService: ComisionVendedorService,
    private tokenSvc: TokenService,
    private toastr: ToastrService
  ) {}

  get esSoporte(): boolean {
    return this.tokenSvc.getRole() === 'ROLE_SOPORTE';
  }

  get esEfectivo(): boolean {
    return this.medioPago === 'EFECTIVO';
  }

  ngOnInit(): void {}

  ngAfterViewInit(): void {
    this.modal = new bootstrap.Modal(this.modalElement.nativeElement, {
      backdrop: 'static',
      keyboard: false
    });
  }

  abrir(): void {
    // Fecha de pago por defecto:
    // - SOPORTE + ADELANTO (primer pago) → fecha del contrato (el primer pago se hace
    //   al firmar el contrato).
    // - Resto (MENSUAL, o secretaría que no edita la fecha) → fecha actual.
    if (this.esSoporte && this.tipo === 'ADELANTO' && this.comision.fechaContrato) {
      this.fechaPago = this.extraerFechaISO(this.comision.fechaContrato);
    } else {
      this.fechaPago = obtenerFechaPeru();
    }
    this.fechaOperacion = '';
    this.numeroOperacion = '';
    this.medioPago = 'EFECTIVO';
    this.voucherFiles = [];
    this.ocrOperationNumbers = new Map();
    this.numeroEgresoPreview = '';

    // El monto se calcula ANTES de la observación (para restarlo del saldo).
    if (this.tipo === 'ADELANTO') {
      this.monto = this.comision.montoAdelantoSugerido || 0;
    } else {
      this.monto = this.letrasHabilitadas
        .reduce((s, l) => s + (l.montoComision || 0), 0);
    }
    this.observacion = this.observacionDefecto();

    // Preview del número de recibo de egreso que se generará (EG01-n)
    this.comisionService.previewSiguienteEgreso().subscribe({
      next: (num) => { this.numeroEgresoPreview = num; },
      error: () => { this.numeroEgresoPreview = 'EG01-?'; }
    });

    this.modal?.show();
  }

  /** Texto por defecto de observaciones según el tipo de pago. El saldo mostrado
   *  es el saldo restante DESPUÉS de descontar el monto que se está pagando. */
  private observacionDefecto(): string {
    const mz = this.comision.manzanas || '—';
    const lt = this.comision.numeroLotes || '—';
    const programa = this.comision.programa || '—';
    const saldoBase = this.comision.saldoPendiente ?? 0;
    const saldoDespues = Math.max(0, saldoBase - (this.monto || 0));
    const saldo = `${this.simbolo} ${saldoDespues.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    if (this.tipo === 'ADELANTO') {
      return `Pago de la 1ra cuota de comisión de la MZ: ${mz} LT: ${lt} y programa: ${programa} - saldo: ${saldo}`;
    }
    return `Pago de comisión mensual de la MZ: ${mz} LT: ${lt} y programa: ${programa} - saldo: ${saldo}`;
  }

  cerrar(): void {
    this.modal?.hide();
  }

  /** Extrae yyyy-mm-dd de un LocalDate sin usar new Date() (evita zona horaria). */
  private extraerFechaISO(fecha: any): string {
    if (Array.isArray(fecha) && fecha.length >= 3) {
      const [y, m, d] = fecha;
      return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    }
    const s = String(fecha);
    const match = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
    return match ? match[0] : s.slice(0, 10);
  }

  onMedioPagoChange(): void {
    if (this.esEfectivo) {
      this.numeroOperacion = '';
      this.fechaOperacion = '';
      this.voucherFiles = [];
      this.ocrOperationNumbers = new Map();
    } else if (!this.fechaOperacion) {
      this.fechaOperacion = obtenerFechaPeru();
    }
  }

  onVoucherOcr(data: VoucherOcrData): void {
    const cambios: string[] = [];
    if (data.numeroOperacion && data.fileName) {
      this.ocrOperationNumbers.set(data.fileName, data.numeroOperacion);
      this.actualizarNumeroOperacion();
      cambios.push(`N° op: ${data.numeroOperacion}`);
    }
    if (data.fechaPago) {
      this.fechaOperacion = data.fechaPago;
      cambios.push(`Fecha op: ${data.fechaPago}`);
    }
    if (cambios.length > 0) {
      this.toastr.info(`Detectado (${data.confidence.toFixed(0)}% conf.): ${cambios.join(' | ')}`, 'OCR');
    } else {
      this.toastr.warning('No se pudieron extraer datos del voucher. Llénelos manualmente.', 'OCR');
    }
  }

  onVoucherFilesChange(files: File[]): void {
    const nombresActuales = new Set(files.map(f => f.name));
    for (const fileName of this.ocrOperationNumbers.keys()) {
      if (!nombresActuales.has(fileName)) this.ocrOperationNumbers.delete(fileName);
    }
    this.actualizarNumeroOperacion();
  }

  private actualizarNumeroOperacion(): void {
    const numeros = Array.from(this.ocrOperationNumbers.values());
    this.numeroOperacion = numeros.length > 0 ? numeros.join(', ') : '';
  }

  get simbolo(): string {
    return this.comision.moneda === 'PEN' ? 'S/' : '$';
  }

  /** Saldo pendiente actual de la comisión (antes de este pago). */
  get saldoPendienteActual(): number {
    return this.comision.saldoPendiente ?? 0;
  }

  /** Al cambiar el monto del adelanto, recalcula la observación con el nuevo saldo. */
  onMontoChange(): void {
    this.observacion = this.observacionDefecto();
  }

  formatFecha(fecha: string): string {
    if (!fecha) return '—';
    const d = new Date(fecha);
    if (isNaN(d.getTime())) return fecha;
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    return `${dd}/${mm}/${d.getFullYear()}`;
  }

  get totalMensualSeleccionado(): number {
    return this.letrasHabilitadas.reduce((s, l) => s + (l.montoComision || 0), 0);
  }

  guardar(): void {
    if (this.enviando) return;

    if (!this.monto || this.monto <= 0) {
      this.toastr.warning('El monto debe ser mayor a 0', 'Atención');
      return;
    }
    const esBancario = !this.esEfectivo;
    if (esBancario) {
      if (!this.numeroOperacion?.trim()) {
        this.toastr.warning('Ingrese el N° de operación para medios bancarios', 'Atención');
        return;
      }
      if (!this.fechaOperacion) {
        this.toastr.warning('Ingrese la fecha de operación', 'Atención');
        return;
      }
      if (this.voucherFiles.length === 0) {
        this.toastr.warning('Adjunte el voucher del pago', 'Atención');
        return;
      }
    }

    const request: PagoComisionRequest = {
      tipo: this.tipo,
      medioPago: this.medioPago,
      numeroOperacion: esBancario ? this.numeroOperacion : undefined,
      fechaOperacion: esBancario ? this.fechaOperacion : undefined,
      fechaPago: this.fechaPago,
      observacion: this.observacion || undefined
    };

    if (this.tipo === 'ADELANTO') {
      request.idComision = this.comision.idComision;
      request.monto = this.monto;
    } else {
      request.idLetras = this.letrasHabilitadas.map(l => l.idLetra);
    }

    this.enviando = true;
    this.comisionService.registrarPagoComision(request, this.voucherFiles).subscribe({
      next: (res) => {
        this.enviando = false;
        this.toastr.success(`Pago registrado (${res.numerosEgreso[0]})`, 'Éxito');
        this.cerrar();
        if (res.numerosEgreso?.[0]) {
          this.descargarEgreso(res.numerosEgreso[0]);
        }
        this.onPagoExitoso.emit();
      },
      error: (err) => {
        this.enviando = false;
        this.toastr.error(this.extraerError(err), 'Error');
      }
    });
  }

  private descargarEgreso(numeroEgreso: string): void {
    this.comisionService.descargarEgresoPdf(numeroEgreso).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        window.open(url, '_blank');
        setTimeout(() => window.URL.revokeObjectURL(url), 10000);
      },
      error: () => {
        this.toastr.error('No se pudo descargar el recibo de egreso', 'Error');
      }
    });
  }

  private extraerError(err: any): string {
    if (err?.error && typeof err.error === 'string') return err.error;
    if (err?.error?.message) return err.error.message;
    return 'Ocurrió un error inesperado';
  }
}