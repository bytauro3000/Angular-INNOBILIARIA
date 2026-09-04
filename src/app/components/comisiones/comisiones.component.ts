import { Component, OnInit, ViewChild, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ComisionVendedorService } from '../../services/comision-vendedor.service';
import { ProgramaService } from '../../services/programa.service';
import { VendedorService } from '../../services/vendedor.service';
import { Programa } from '../../models/programa.model';
import { Vendedor } from '../../models/vendedor.model';
import { CurrencyFormatterDirective } from '../../directives/currency-formatter';
import { PagoComisionModal } from '../pago-comision-modal/pago-comision-modal.component';
import {
  ComisionVendedorDTO,
  PagoComisionMensualDTO
} from '../../dto/comision-vendedor.dto';
import { ToastrService } from 'ngx-toastr';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-comisiones',
  standalone: true,
  imports: [CommonModule, FormsModule, CurrencyFormatterDirective, PagoComisionModal],
  templateUrl: './comisiones.html',
  styleUrls: ['./comisiones.scss']
})
export class ComisionesComponent implements OnInit {

  @ViewChild('pagoComisionModal') pagoComisionModal!: PagoComisionModal;

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

  // ── Modal de pago de comisión ─────────────────────────────────────────────
  modalTipo: 'ADELANTO' | 'MENSUAL' = 'ADELANTO';
  modalComision: ComisionVendedorDTO | null = null;
  modalLetras: PagoComisionMensualDTO[] = [];
  /** Comisiones seleccionadas para pago mensual multi-lote. */
  seleccionadasPago: Set<number> = new Set();

  // ── Filtro por Programa + MZ + LT (resalta y hace scroll, NO filtra) ────────
  programas: Programa[] = [];
  programaSeleccionado: number | null = null;
  manzanaBusqueda: string = '';
  numeroLoteBusqueda: string = '';
  /** Id de comisión actualmente resaltada por el buscador. */
  resaltadaId: number | null = null;
  private resaltarTimeout: any = null;

  // ── Filtro por Vendedor (autocomplete, tipo contrato-insertar) ─────────────
  vendedores: Vendedor[] = [];
  vendedoresFiltrados: Vendedor[] = [];
  mostrarVendedores: boolean = false;
  filtroVendedor: string = '';
  vendedorSeleccionado: Vendedor | null = null;

  // ── Filtro por Estado (chips, estilo api-sunat) ─────────────────────────────
  filtroEstado: string = 'TODOS';
  estadosDisponibles: string[] = ['PENDIENTE', 'EN_PAGO', 'COMPLETADA', 'ANULADA'];

  constructor(
    private comisionService: ComisionVendedorService,
    private programaService: ProgramaService,
    private vendedorService: VendedorService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.cargar();
    this.programaService.listarProgramas().subscribe({
      next: (data) => { this.programas = data; },
      error: () => { this.toastr.warning('No se pudieron cargar los programas', 'Aviso'); }
    });
    this.vendedorService.listarVendedores().subscribe({
      next: (data) => {
        this.vendedores = data;
        this.vendedoresFiltrados = [...data];
      },
      error: () => { this.toastr.warning('No se pudieron cargar los vendedores', 'Aviso'); }
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

  /** Desplaza suavemente hasta el inicio de la página (filtros de búsqueda). */
  irAlInicio(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  get nombreProgramaSeleccionado(): string {
    if (!this.programaSeleccionado) return '';
    return this.programas.find(p => p.idPrograma === this.programaSeleccionado)?.nombrePrograma || '';
  }

  estaResaltada(idComision: number): boolean {
    return this.resaltadaId === idComision;
  }

  // ── Filtro por Vendedor (autocomplete) ─────────────────────────────────────

  filtrarVendedores(): void {
    const f = this.filtroVendedor.toLowerCase().trim();
    this.vendedoresFiltrados = this.vendedores.filter(v =>
      `${v.nombre} ${v.apellidos}`.toLowerCase().includes(f) || (v.dni || '').includes(f));
    this.mostrarVendedores = true;
  }

  seleccionarVendedor(v: Vendedor): void {
    this.vendedorSeleccionado = v;
    this.filtroVendedor = `${v.nombre} ${v.apellidos}`;
    this.mostrarVendedores = false;
  }

  limpiarFiltroVendedor(): void {
    this.vendedorSeleccionado = null;
    this.filtroVendedor = '';
    this.mostrarVendedores = false;
  }

  // ── Filtro por Estado (chips) ──────────────────────────────────────────────

  setFiltroEstado(estado: string): void {
    this.filtroEstado = estado;
  }

  /** Lista de comisiones aplicando filtros de vendedor y estado (combinables). */
  get comisionesFiltradas(): ComisionVendedorDTO[] {
    let lista = this.comisiones;
    if (this.vendedorSeleccionado?.idVendedor) {
      const id = this.vendedorSeleccionado.idVendedor;
      lista = lista.filter(c => c.idVendedor === id);
    }
    if (this.filtroEstado !== 'TODOS') {
      lista = lista.filter(c => c.estado === this.filtroEstado);
    }
    return lista;
  }

  // ── Cerrar dropdown de vendedor al hacer clic fuera ────────────────────────

  @HostListener('document:click', ['$event'])
  onClickFuera(event: Event): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.custom-select-container')) {
      this.mostrarVendedores = false;
    }
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

  setMontoAdelanto(c: ComisionVendedorDTO, valor: any): void {
    this.adelantoEditable.set(c.idComision, Number(valor) || 0);
  }

  // ── Monto acordado (negociado por el gerente) ─────────────────────────────

  /** Límite para el aviso: monto equivalente al % de comisión congelado del vendedor. */
  maximoComision(c: ComisionVendedorDTO): number {
    return Math.floor((c.montoTotalContrato || 0) * (c.porcentajeComision || 0) / 100);
  }

  montoAcordado(c: ComisionVendedorDTO): number {
    if (!this.montoAcordadoEditable.has(c.idComision)) {
      this.montoAcordadoEditable.set(c.idComision, c.montoComisionTotal || 0);
    }
    return this.montoAcordadoEditable.get(c.idComision)!;
  }

  setMontoAcordado(c: ComisionVendedorDTO, valor: any): void {
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
    const limite = this.maximoComision(c);
    if (!monto || monto <= 0) {
      this.toastr.warning('Ingrese un monto mayor a 0', 'Atención');
      return;
    }

    const confirmarGuardado = () => {
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
    };

    // Si el monto supera el % de comisión congelado del vendedor → confirmación
    if (monto > limite) {
      Swal.fire({
        title: 'Comisión por encima del % del vendedor',
        html: `El monto ingresado (<strong>${this.simbolo(c.moneda)} ${monto.toLocaleString('es-PE')}</strong>)
              supera el <strong>${c.porcentajeComision}%</strong> de comisión registrado
              (${this.simbolo(c.moneda)} ${limite.toLocaleString('es-PE')}).<br/><br/>
              ¿Desea aceptar este monto de todos modos?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sí, aceptar',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#d97706',
        cancelButtonColor: '#6c757d'
      }).then((result) => {
        if (result.isConfirmed) {
          confirmarGuardado();
        }
      });
    } else {
      confirmarGuardado();
    }
  }

  // ── Modal de pago (adelanto o mensual) ─────────────────────────────────────

  /** Abre el modal para registrar el adelanto de la comisión. */
  abrirModalAdelanto(c: ComisionVendedorDTO): void {
    if (!c.adelantoHabilitado) return;
    this.modalTipo = 'ADELANTO';
    this.modalComision = c;
    this.modalLetras = [];
    this.abrirModal();
  }

  /** Abre el modal para pagar las comisiones mensuales de una comisión. */
  abrirModalMensual(c: ComisionVendedorDTO): void {
    if (this.pagosDe(c).length === 0) return;
    this.modalTipo = 'MENSUAL';
    this.modalComision = c;
    this.modalLetras = this.pagosDe(c).filter(p => p.seleccionado);
    this.abrirModal();
  }

  /** Abre el modal para pagar las comisiones mensuales de varias comisiones (multi-lote). */
  abrirModalPagarSeleccionadas(): void {
    const seleccionadas = this.comisiones.filter(c => this.seleccionadasPago.has(c.idComision));
    if (seleccionadas.length === 0) {
      this.toastr.warning('Seleccione al menos una comisión', 'Atención');
      return;
    }
    // Multi-lote: toma la primera comisión para el contexto del modal; el backend
    // genera UN solo egreso con el detalle de todos los lotes.
    this.modalTipo = 'MENSUAL';
    this.modalComision = seleccionadas[0];
    this.modalLetras = seleccionadas.flatMap(c => this.pagosDe(c));
    this.abrirModal();
  }

  /** Espera a que el *ngIf renderice el modal y luego lo abre. */
  private abrirModal(): void {
    setTimeout(() => {
      if (this.pagoComisionModal) {
        this.pagoComisionModal.abrir();
      }
    }, 60);
  }

  toggleSeleccionPago(c: ComisionVendedorDTO): void {
    if (this.seleccionadasPago.has(c.idComision)) {
      this.seleccionadasPago.delete(c.idComision);
    } else {
      this.seleccionadasPago.add(c.idComision);
    }
  }

  onModalCerrado(): void {
    this.modalComision = null;
    this.modalLetras = [];
  }

  onPagoComisionExitoso(): void {
    this.seleccionadasPago.clear();
    this.cargar();
  }

  estaSeleccionadaPago(c: ComisionVendedorDTO): boolean {
    return this.seleccionadasPago.has(c.idComision);
  }

  get tieneSeleccionPago(): boolean {
    return this.seleccionadasPago.size > 0;
  }

  get totalSeleccionadoPago(): number {
    let total = 0;
    this.comisiones.forEach(c => {
      if (this.seleccionadasPago.has(c.idComision)) {
        total += this.pagosDe(c).reduce((s, p) => s + (p.montoComision || 0), 0);
      }
    });
    return total;
  }

  /** Símbolo de moneda de la primera comisión seleccionada (para la barra de pago). */
  get simboloSeleccionPago(): string {
    const primera = this.comisiones.find(c => this.seleccionadasPago.has(c.idComision));
    return primera ? this.simbolo(primera.moneda) : '$';
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
    this.abrirModalMensual(c);
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

  badgePendientes(nivelColor: string): string {
    return nivelColor === 'ROJO' ? 'pend-rojo'
      : nivelColor === 'NARANJA' ? 'pend-naranja'
      : 'pend-verde';
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