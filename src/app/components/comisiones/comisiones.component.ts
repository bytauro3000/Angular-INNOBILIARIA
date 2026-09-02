import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ComisionVendedorService } from '../../services/comision-vendedor.service';
import { ProgramaService } from '../../services/programa.service';
import { Programa } from '../../models/programa.model';
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
  /** Monto acordado editable (negociado por el gerente) por comisión. */
  montoAcordadoEditable: Map<number, number> = new Map();
  /** Comisiones cuyo editor de monto acordado está abierto. */
  editandoMontoAcordado: Set<number> = new Set();
  /** Registrando para evitar doble clic. */
  registrando: boolean = false;

  // ── Filtro por Programa + MZ + LT (resalta y hace scroll, NO filtra) ────────
  programas: Programa[] = [];
  programaSeleccionado: number | null = null;
  manzanaBusqueda: string = '';
  numeroLoteBusqueda: string = '';
  /** Id de comisión actualmente resaltada por el buscador. */
  resaltadaId: number | null = null;
  private resaltarTimeout: any = null;

  constructor(
    private comisionService: ComisionVendedorService,
    private programaService: ProgramaService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.cargar();
    this.programaService.listarProgramas().subscribe({
      next: (data) => { this.programas = data; },
      error: () => { this.toastr.warning('No se pudieron cargar los programas', 'Aviso'); }
    });
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
        this.montoAcordadoEditable = new Map();
        this.editandoMontoAcordado = new Set();
      },
      error: () => {
        this.toastr.error('Error al cargar las comisiones', 'Error');
        this.cargando = false;
      }
    });
  }

  // ── Buscador (resalta y hace scroll, NO filtra la lista) ───────────────────

  /** Busca la comisión cuyo programa+MZ+LT coincide y la resalta + scroll. */
  buscarYResaltar(): void {
    const programaNombre = this.programaSeleccionado
      ? (this.programas.find(p => p.idPrograma === this.programaSeleccionado)?.nombrePrograma || '').toLowerCase()
      : '';
    const mz = this.manzanaBusqueda.trim().toLowerCase();
    const lt = this.numeroLoteBusqueda.trim().toLowerCase();

    if (!programaNombre && !mz && !lt) {
      this.resaltadaId = null;
      return;
    }

    // Coincidencia exacta primero; si no, coincidencia parcial (contains).
    let encontrada = this.comisiones.find(c => this.coincidenciaExacta(c, programaNombre, mz, lt))
      || this.comisiones.find(c => this.coincidenciaParcial(c, programaNombre, mz, lt));

    if (!encontrada) {
      this.resaltadaId = null;
      this.toastr.info('No se encontró esa comisión en la lista', 'Buscar');
      return;
    }

    this.resaltadaId = encontrada.idComision;

    // Hacer scroll hasta la tarjeta resaltada tras un tick (para que el DOM se actualice).
    setTimeout(() => {
      const el = document.getElementById('comision-' + encontrada.idComision);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // Quitar el resaltado después de unos segundos.
        if (this.resaltarTimeout) clearTimeout(this.resaltarTimeout);
        this.resaltarTimeout = setTimeout(() => {
          this.resaltadaId = null;
        }, 3000);
      }
    }, 50);
  }

  private coincidenciaExacta(c: ComisionVendedorDTO, programaNombre: string, mz: string, lt: string): boolean {
    const progCoincide = !programaNombre || (c.programa || '').toLowerCase() === programaNombre;
    const mzCoincide = !mz || (c.manzanas || '').toLowerCase() === mz;
    const ltCoincide = !lt || (c.numeroLotes || '').toLowerCase() === lt;
    return progCoincide && mzCoincide && ltCoincide;
  }

  private coincidenciaParcial(c: ComisionVendedorDTO, programaNombre: string, mz: string, lt: string): boolean {
    const progCoincide = !programaNombre || (c.programa || '').toLowerCase().includes(programaNombre);
    const mzCoincide = !mz || (c.manzanas || '').toLowerCase().includes(mz);
    const ltCoincide = !lt || (c.numeroLotes || '').toLowerCase().includes(lt);
    return progCoincide && mzCoincide && ltCoincide;
  }

  limpiarBusqueda(): void {
    this.programaSeleccionado = null;
    this.manzanaBusqueda = '';
    this.numeroLoteBusqueda = '';
    this.resaltadaId = null;
  }

  get nombreProgramaSeleccionado(): string {
    if (!this.programaSeleccionado) return '';
    return this.programas.find(p => p.idPrograma === this.programaSeleccionado)?.nombrePrograma || '';
  }

  estaResaltada(idComision: number): boolean {
    return this.resaltadaId === idComision;
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

  // ── Monto acordado (negociado por el gerente) ─────────────────────────────

  /** Máximo permitido: 3% del monto total del contrato. */
  maximoComision(c: ComisionVendedorDTO): number {
    return Math.floor((c.montoTotalContrato || 0) * 0.03);
  }

  montoAcordado(c: ComisionVendedorDTO): number {
    if (!this.montoAcordadoEditable.has(c.idComision)) {
      this.montoAcordadoEditable.set(c.idComision, c.montoComisionTotal || 0);
    }
    return this.montoAcordadoEditable.get(c.idComision)!;
  }

  setMontoAcordado(c: ComisionVendedorDTO, valor: string): void {
    this.montoAcordadoEditable.set(c.idComision, Number(valor) || 0);
  }

  /** Editable solo mientras NO haya pagos registrados (estado PENDIENTE sin adelanto). */
  puedeEditarMonto(c: ComisionVendedorDTO): boolean {
    return c.estado === 'PENDIENTE' && c.montoAdelanto == null;
  }

  estaEditandoMonto(c: ComisionVendedorDTO): boolean {
    return this.editandoMontoAcordado.has(c.idComision);
  }

  toggleEditarMonto(c: ComisionVendedorDTO): void {
    if (!this.puedeEditarMonto(c)) return;
    if (this.editandoMontoAcordado.has(c.idComision)) {
      this.editandoMontoAcordado.delete(c.idComision);
    } else {
      this.editandoMontoAcordado.add(c.idComision);
    }
  }

  guardarMontoAcordado(c: ComisionVendedorDTO): void {
    if (this.registrando) return;
    const monto = this.montoAcordado(c);
    const maximo = this.maximoComision(c);
    if (!monto || monto <= 0) {
      this.toastr.warning('Ingrese un monto mayor a 0', 'Atención');
      return;
    }
    if (monto > maximo) {
      this.toastr.warning(`El monto no puede superar el 3% del contrato (${this.simbolo(c.moneda)} ${maximo})`, 'Atención');
      return;
    }
    this.registrando = true;
    this.comisionService.actualizarMontoComision(c.idComision, monto).subscribe({
      next: (actualizado) => {
        this.registrando = false;
        this.toastr.success('Monto de comisión actualizado', 'Éxito');
        const idx = this.comisiones.findIndex(x => x.idComision === c.idComision);
        if (idx >= 0) this.comisiones[idx] = actualizado;
      },
      error: (err) => {
        this.registrando = false;
        this.toastr.error(this.extraerError(err), 'Error');
      }
    });
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