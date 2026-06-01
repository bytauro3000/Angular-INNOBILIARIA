import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InscripcionService, PagoInscripcionDTO } from '../../services/inscripcion.service';
import { ProgramaService } from '../../services/programa.service';
import { Programa } from '../../models/programa.model';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-pago-inscripcion-listar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './pago-inscripcion-listar.html',
  styleUrls: ['./pago-inscripcion-listar.scss']
})
export class PagoInscripcionListarComponent implements OnInit {

  pagos: PagoInscripcionDTO[] = [];
  pagosFiltrados: PagoInscripcionDTO[] = [];
  pagosPagina: PagoInscripcionDTO[] = [];

  // Filtros
  terminoBusqueda: string = '';
  filtroServicio: 'TODOS' | 'LUZ' | 'AGUA' = 'TODOS';
  idProgramaSeleccionado: number | null = null;

  // Programas para el selector
  programas: Programa[] = [];

  isCargando: boolean = false;
  descargando: number | null = null;

  // Paginación
  pageSize: number = 10;
  currentPage: number = 1;
  totalPages: number = 0;

  constructor(
    private inscripcionService: InscripcionService,
    private programaService: ProgramaService,
    private toastr: ToastrService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.cargarProgramas();
  }

  cargarProgramas(): void {
    this.programaService.listarProgramas().subscribe({
      next: (data) => {
        this.programas = data;
        if (data.length > 0) {
          const defaultProg = data.find(p => p.idPrograma === 4) ?? data[0];
          this.idProgramaSeleccionado = defaultProg.idPrograma ?? null;
        }
        this.cargarPagos();
      },
      error: () => {
        this.toastr.error('Error al cargar los programas.', 'Error');
        this.cargarPagos();
      }
    });
  }

  cargarPagos(): void {
    this.isCargando = true;
    this.inscripcionService.listarPagos().subscribe({
      next: (data) => {
        this.pagos = data.sort((a, b) => b.idPagoInscripcionComprobante - a.idPagoInscripcionComprobante);
        this.currentPage = 1;
        this.aplicarFiltros();
        this.isCargando = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.isCargando = false;
        this.toastr.error('Error al cargar los pagos de inscripción.', 'Error');
      }
    });
  }

  aplicarFiltros(): void {
    let resultado = [...this.pagos];

    if (this.idProgramaSeleccionado !== null) {
      resultado = resultado.filter(p => p.idPrograma === this.idProgramaSeleccionado);
    }

    if (this.filtroServicio !== 'TODOS') {
      resultado = resultado.filter(p => p.tipoServicio === this.filtroServicio);
    }

    if (this.terminoBusqueda.trim()) {
      const t = this.terminoBusqueda.toLowerCase();
      resultado = resultado.filter(p =>
        p.idPagoInscripcionComprobante.toString().includes(t) ||
        (p.manzana    && p.manzana.toLowerCase().includes(t))    ||
        (p.numeroLote && p.numeroLote.toLowerCase().includes(t)) ||
        (p.numeroComprobante && p.numeroComprobante.toLowerCase().includes(t))
      );
    }

    this.pagosFiltrados = resultado;
    this.currentPage = 1;
    this.aplicarPaginacion();
  }

  aplicarPaginacion(): void {
    this.totalPages = Math.ceil(this.pagosFiltrados.length / this.pageSize);
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    this.pagosPagina = this.pagosFiltrados.slice(start, end);
  }

  goToPage(page: number | any): void {
    const pageNumber = typeof page === 'number' ? page : parseInt(page);
    if (pageNumber >= 1 && pageNumber <= this.totalPages) {
      this.currentPage = pageNumber;
      this.aplicarPaginacion();
    }
  }

  previousPage(): void {
    if (this.currentPage > 1) this.goToPage(this.currentPage - 1);
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) this.goToPage(this.currentPage + 1);
  }

  getPagesArray(): (number | string)[] {
    const total = this.totalPages;
    const current = this.currentPage;
    const pages: (number | string)[] = [];

    if (total <= 7) {
      for (let i = 1; i <= total; i++) pages.push(i);
    } else {
      pages.push(1);
      if (current > 3) pages.push('...');
      let start = Math.max(2, current - 1);
      let end = Math.min(total - 1, current + 1);
      if (current <= 3) end = 4;
      if (current >= total - 2) start = total - 3;
      for (let i = start; i <= end; i++) pages.push(i);
      if (current < total - 2) pages.push('...');
      pages.push(total);
    }
    return pages;
  }

  onProgramaChange(): void {
    this.currentPage = 1;
    this.aplicarFiltros();
  }

  limpiarFiltros(): void {
    this.terminoBusqueda = '';
    this.filtroServicio = 'TODOS';
    this.currentPage = 1;
    this.aplicarFiltros();
  }

  verComprobantePdf(pago: PagoInscripcionDTO): void {
    this.descargando = pago.idPagoInscripcionComprobante;
    this.inscripcionService.descargarComprobante(pago.idPagoInscripcionComprobante).subscribe({
      next: (blob) => {
        window.open(URL.createObjectURL(blob), '_blank');
        this.descargando = null;
      },
      error: () => {
        this.toastr.error('No se pudo generar el comprobante PDF.', 'Error');
        this.descargando = null;
      }
    });
  }

  // ── Helpers de conteo para los chips ──────────────────────────────────────

  getTotalPorPrograma(): number {
    if (this.idProgramaSeleccionado === null) return this.pagos.length;
    return this.pagos.filter(p => p.idPrograma === this.idProgramaSeleccionado).length;
  }

  getTotalLuz(): number {
    const base = this.idProgramaSeleccionado !== null
      ? this.pagos.filter(p => p.idPrograma === this.idProgramaSeleccionado)
      : this.pagos;
    return base.filter(p => p.tipoServicio === 'LUZ').length;
  }

  getTotalAgua(): number {
    const base = this.idProgramaSeleccionado !== null
      ? this.pagos.filter(p => p.idPrograma === this.idProgramaSeleccionado)
      : this.pagos;
    return base.filter(p => p.tipoServicio === 'AGUA').length;
  }

  // ── Helpers de vista ──────────────────────────────────────────────────────

  getNombrePrograma(): string {
    if (this.idProgramaSeleccionado === null) return '';
    const prog = this.programas.find(p => p.idPrograma === this.idProgramaSeleccionado);
    return prog?.nombrePrograma ?? '';
  }

  getMzLt(pago: PagoInscripcionDTO): string {
    if (pago.manzana && pago.numeroLote) {
      return `Mz ${pago.manzana} - Lt ${pago.numeroLote}`;
    }
    return `#${pago.idContrato}`;
  }

  getMedioPagoLabel(medio: string): string {
    const labels: Record<string, string> = {
      EFECTIVO:      'Efectivo',
      TRANSFERENCIA: 'Transferencia',
      DEPOSITO:      'Depósito',
      YAPE:          'Yape',
      PLIN:          'Plin',
      TARJETA:       'Tarjeta',
    };
    return labels[medio] ?? medio;
  }

  getTipoComprobanteLabel(tipo: string): string {
    const labels: Record<string, string> = {
      BOLETA:  'Boleta',
      FACTURA: 'Factura',
      RECIBO:  'Recibo',
    };
    return labels[tipo] ?? tipo;
  }

  // ── Info de paginación para el pie ───────────────────────────────────────

  getPrimerRegistro(): number {
    if (this.pagosFiltrados.length === 0) return 0;
    return (this.currentPage - 1) * this.pageSize + 1;
  }

  getUltimoRegistro(): number {
    return Math.min(this.currentPage * this.pageSize, this.pagosFiltrados.length);
  }
}