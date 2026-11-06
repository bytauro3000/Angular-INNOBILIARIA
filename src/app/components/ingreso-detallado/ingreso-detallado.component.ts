import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReporteIngresosService } from '../../services/reporteingresos.service';
import {
  ReporteIngresosDetalladoDTO,
  IngresoDetalladoItemDTO
} from '../../dto/ingreso-detallado.dto';
import { ToastrService } from 'ngx-toastr';
import { obtenerFechaPeru } from '../../utils/fecha-peru';

@Component({
  selector: 'app-ingreso-detallado',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ingreso-detallado.component.html',
  styleUrls: ['./ingreso-detallado.component.scss']
})
export class IngresoDetalladoComponent implements OnInit {

  // ── Filtros ──────────────────────────────────────────────────────────────
  fechaDesde: string = '';
  fechaHasta: string = '';
  tipo: string = 'TODOS';

  // ── Estado ───────────────────────────────────────────────────────────────
  cargando = false;
  exportando = false;
  buscado = false;
  reporte: ReporteIngresosDetalladoDTO | null = null;

  // ── Paginación client-side ───────────────────────────────────────────────
  paginaActual = 1;
  readonly pageSize = 50;

  constructor(
    private reporteIngresosService: ReporteIngresosService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    // Por defecto: desde el primer día del mes en curso hasta hoy
    const hoy = obtenerFechaPeru();
    const [y, m] = hoy.split('-');
    this.fechaDesde = `${y}-${m}-01`;
    this.fechaHasta = hoy;
  }

  buscar(): void {
    if (!this.fechaDesde || !this.fechaHasta) {
      this.toastr.warning('Selecciona ambas fechas para consultar.', 'Atención');
      return;
    }
    if (this.fechaDesde > this.fechaHasta) {
      this.toastr.warning('La fecha "Desde" no puede ser mayor que "Hasta".', 'Atención');
      return;
    }

    this.cargando = true;
    this.buscado = false;
    this.reporte = null;
    this.paginaActual = 1;

    this.reporteIngresosService
      .obtenerIngresosDetallados(this.fechaDesde, this.fechaHasta, this.tipo)
      .subscribe({
        next: (data) => {
          this.reporte = data;
          this.cargando = false;
          this.buscado = true;
          if (data.cantidadTotal === 0) {
            this.toastr.info('No se encontraron comprobantes en el rango seleccionado.', 'Sin resultados');
          }
        },
        error: () => {
          this.cargando = false;
          this.buscado = true;
          this.toastr.error('Error al consultar el reporte. Intenta de nuevo.', 'Error');
        }
      });
  }

  limpiar(): void {
    const hoy = obtenerFechaPeru();
    const [y, m] = hoy.split('-');
    this.fechaDesde = `${y}-${m}-01`;
    this.fechaHasta = hoy;
    this.tipo = 'TODOS';
    this.reporte = null;
    this.buscado = false;
    this.paginaActual = 1;
  }

  // ── Paginación ────────────────────────────────────────────────────────────
  get totalPaginas(): number {
    if (!this.reporte) return 0;
    return Math.ceil(this.reporte.detalle.length / this.pageSize);
  }

  get filasPagina(): IngresoDetalladoItemDTO[] {
    if (!this.reporte) return [];
    const inicio = (this.paginaActual - 1) * this.pageSize;
    return this.reporte.detalle.slice(inicio, inicio + this.pageSize);
  }

  getPagesArray(): (number | string)[] {
    const total = this.totalPaginas;
    const current = this.paginaActual;
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

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPaginas) {
      this.paginaActual = page;
    }
  }

  previousPage(): void {
    this.goToPage(this.paginaActual - 1);
  }

  nextPage(): void {
    this.goToPage(this.paginaActual + 1);
  }

  // ── Helpers de formato ────────────────────────────────────────────────────
  formatFecha(fecha: any): string {
    if (!fecha) return '—';
    if (Array.isArray(fecha)) {
      const [y, m, d] = fecha as number[];
      return `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y}`;
    }
    const parts = String(fecha).split('-');
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    return String(fecha);
  }

  formatMonto(valor: number | null | undefined, moneda?: string | null): string {
    if (valor == null) valor = 0;
    const numero = Number(valor).toLocaleString('es-PE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
    if (moneda === 'USD') return `$ ${numero}`;
    if (moneda === 'PEN') return `S/ ${numero}`;
    if (moneda === 'N/D') return numero;
    return `$ ${numero}`;
  }

  etiquetaTipo(tipo: string): string {
    return tipo === 'BOLETA' ? 'Boleta' : 'Recibo';
  }

  claseTipo(tipo: string): string {
    return tipo === 'BOLETA' ? 'badge-boleta' : 'badge-recibo';
  }

  etiquetaEstado(estado: string): string {
    return estado === 'ANULADO_NC' ? 'ANULADO' : 'ANULADO';
  }

  get tieneAnulados(): boolean {
    return (this.reporte?.cantidadAnuladas ?? 0) > 0;
  }

  // ── Descargas ─────────────────────────────────────────────────────────────
  descargar(formato: 'pdf' | 'excel'): void {
    if (!this.reporte || this.reporte.detalle.length === 0 || this.exportando) return;

    this.exportando = true;
    const obs = formato === 'pdf'
      ? this.reporteIngresosService.descargarDetalladoPdf(this.fechaDesde, this.fechaHasta, this.tipo)
      : this.reporteIngresosService.descargarDetalladoExcel(this.fechaDesde, this.fechaHasta, this.tipo);

    obs.subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ingreso-detallado-${this.fechaDesde}_${this.fechaHasta}.${formato === 'pdf' ? 'pdf' : 'xlsx'}`;
        a.click();
        URL.revokeObjectURL(url);
        this.exportando = false;
      },
      error: () => {
        this.exportando = false;
        this.toastr.error(`Error al descargar el ${formato.toUpperCase()}.`, 'Error');
      }
    });
  }
}
