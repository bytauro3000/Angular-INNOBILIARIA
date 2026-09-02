import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ComisionVendedorService } from '../../services/comision-vendedor.service';
import {
  ComisionVendedorDTO,
  PagoComisionMensualDTO
} from '../../dto/comision-vendedor.dto';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-comisiones',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './comisiones.html',
  styleUrls: ['./comisiones.scss']
})
export class ComisionesComponent implements OnInit {

  comisiones: ComisionVendedorDTO[] = [];
  cargando = true;

  /** Comisiones expandidas para ver sus pagos mensuales habilitados. */
  expandidas: Set<number> = new Set();
  /** Pagos mensuales habilitados cargados por comisión expandida. */
  pagosPorComision: Map<number, PagoComisionMensualDTO[]> = new Map();
  /** Monto editable del adelanto (por comisión). */
  adelantoEditable: Map<number, number> = new Map();
  /** Registrando para evitar doble clic. */
  registrando: boolean = false;

  constructor(
    private comisionService: ComisionVendedorService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.cargando = true;
    this.comisionService.listarComisiones().subscribe({
      next: (data) => {
        this.comisiones = data;
        this.cargando = false;
        this.expandidas = new Set();
        this.pagosPorComision = new Map();
        this.adelantoEditable = new Map();
      },
      error: () => {
        this.toastr.error('Error al cargar las comisiones', 'Error');
        this.cargando = false;
      }
    });
  }

  // ── Resumen ────────────────────────────────────────────────────────────────

  get totalPendienteUsd(): number {
    return this.comisiones
      .filter(c => c.moneda === 'USD' && c.estado !== 'ANULADA')
      .reduce((s, c) => s + (c.saldoPendiente || 0), 0);
  }

  get totalPendientePen(): number {
    return this.comisiones
      .filter(c => c.moneda === 'PEN' && c.estado !== 'ANULADA')
      .reduce((s, c) => s + (c.saldoPendiente || 0), 0);
  }

  get totalAdelantosPendientes(): number {
    return this.comisiones.filter(c => c.adelantoHabilitado).length;
  }

  get totalCompletadas(): number {
    return this.comisiones.filter(c => c.estado === 'COMPLETADA').length;
  }

  // ── Expansión / pagos mensuales ────────────────────────────────────────────

  toggleComision(c: ComisionVendedorDTO): void {
    if (this.expandidas.has(c.idComision)) {
      this.expandidas.delete(c.idComision);
      this.pagosPorComision.delete(c.idComision);
      return;
    }
    this.expandidas.add(c.idComision);
    this.cargarPagosHabilitados(c);
  }

  estaExpandida(idComision: number): boolean {
    return this.expandidas.has(idComision);
  }

  private cargarPagosHabilitados(c: ComisionVendedorDTO): void {
    this.comisionService.pagosMensualesHabilitados(c.idComision).subscribe({
      next: (pagos) => {
        this.pagosPorComision.set(c.idComision, pagos);
      },
      error: () => {
        this.toastr.error('Error al cargar los pagos habilitados', 'Error');
        this.pagosPorComision.set(c.idComision, []);
      }
    });
  }

  pagosDe(c: ComisionVendedorDTO): PagoComisionMensualDTO[] {
    return this.pagosPorComision.get(c.idComision) || [];
  }

  // ── Adelanto ───────────────────────────────────────────────────────────────

  montoAdelanto(c: ComisionVendedorDTO): number {
    if (!this.adelantoEditable.has(c.idComision)) {
      this.adelantoEditable.set(c.idComision, c.montoAdelantoSugerido || 0);
    }
    return this.adelantoEditable.get(c.idComision)!;
  }

  setMontoAdelanto(c: ComisionVendedorDTO, valor: string): void {
    this.adelantoEditable.set(c.idComision, Number(valor) || 0);
  }

  registrarAdelanto(c: ComisionVendedorDTO): void {
    if (this.registrando) return;
    const monto = this.montoAdelanto(c);
    if (!monto || monto <= 0) {
      this.toastr.warning('Ingrese un monto de adelanto mayor a 0', 'Atención');
      return;
    }
    this.registrando = true;
    this.comisionService.registrarAdelanto({
      idComision: c.idComision,
      monto
    }).subscribe({
      next: (res) => {
        this.registrando = false;
        this.toastr.success(`Adelanto registrado (${res.numerosEgreso[0]})`, 'Éxito');
        this.cargar();
      },
      error: (err) => {
        this.registrando = false;
        this.toastr.error(this.extraerError(err), 'Error');
      }
    });
  }

  // ── Pagos mensuales (multiselección) ───────────────────────────────────────

  togglePago(p: PagoComisionMensualDTO): void {
    p.seleccionado = !p.seleccionado;
  }

  seleccionadosDe(c: ComisionVendedorDTO): PagoComisionMensualDTO[] {
    return this.pagosDe(c).filter(p => p.seleccionado);
  }

  montoSeleccionado(c: ComisionVendedorDTO): number {
    return this.seleccionadosDe(c).reduce((s, p) => s + (p.montoComision || 0), 0);
  }

  registrarPagosMensuales(c: ComisionVendedorDTO): void {
    if (this.registrando) return;
    const seleccionados = this.seleccionadosDe(c);
    if (seleccionados.length === 0) {
      this.toastr.warning('Seleccione al menos un pago mensual', 'Atención');
      return;
    }
    this.registrando = true;
    this.comisionService.registrarPagosMensuales({
      idComision: c.idComision,
      idLetras: seleccionados.map(p => p.idLetra)
    }).subscribe({
      next: (res) => {
        this.registrando = false;
        this.toastr.success(`Pagos registrados (${res.numerosEgreso[0]})`, 'Éxito');
        this.cargar();
      },
      error: (err) => {
        this.registrando = false;
        this.toastr.error(this.extraerError(err), 'Error');
      }
    });
  }

  // ── PDF ────────────────────────────────────────────────────────────────────

  descargarEgreso(numeroEgreso: string): void {
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

  // ── Helpers de UI ──────────────────────────────────────────────────────────

  simbolo(moneda: string): string {
    return moneda === 'PEN' ? 'S/' : '$';
  }

  formatFecha(fecha: string): string {
    if (!fecha) return '—';
    const d = new Date(fecha);
    if (isNaN(d.getTime())) return fecha;
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    return `${dd}/${mm}/${d.getFullYear()}`;
  }

  badgeEstado(estado: string): string {
    return estado === 'COMPLETADA' ? 'badge-completada'
      : estado === 'ANULADA' ? 'badge-anulada'
      : estado === 'EN_PAGO' ? 'badge-enpago'
      : 'badge-pendiente';
  }

  pctPagado(c: ComisionVendedorDTO): number {
    const total = c.montoComisionTotal || 0;
    if (total <= 0) return 0;
    const pagado = total - (c.saldoPendiente || 0);
    return Math.min(100, Math.round((pagado / total) * 100));
  }

  private extraerError(err: any): string {
    if (err?.error && typeof err.error === 'string') return err.error;
    if (err?.error?.message) return err.error.message;
    return 'Ocurrió un error inesperado';
  }
}