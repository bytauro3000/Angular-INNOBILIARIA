import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReporteEgresosService } from '../../services/reporte-egresos.service';
import { ComisionVendedorService } from '../../services/comision-vendedor.service';
import {
  ResumenEgresosRangoDTO,
  ResumenEgresoItemDTO
} from '../../dto/resumen-egresos-rango.dto';
import { ToastrService } from 'ngx-toastr';
import { obtenerFechaPeru } from '../../utils/fecha-peru';

@Component({
  selector: 'app-reporte-egresos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reporteegresos.html',
  styleUrls: ['./reporteegresos.scss']
})
export class ReporteEgresosComponent implements OnInit {

  // ── Filtros ──────────────────────────────────────────────────────────────
  fechaDesde: string = '';
  fechaHasta: string = '';

  // ── Estado ───────────────────────────────────────────────────────────────
  cargando = false;
  buscado  = false;
  resumen: ResumenEgresosRangoDTO | null = null;

  constructor(
    private reporteEgresosService: ReporteEgresosService,
    private comisionService: ComisionVendedorService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    const hoy = obtenerFechaPeru();
    this.fechaDesde = hoy;
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
    this.buscado  = false;
    this.resumen  = null;

    this.reporteEgresosService.obtenerEgresosPorRango(this.fechaDesde, this.fechaHasta).subscribe({
      next: (data) => {
        this.resumen  = data;
        this.cargando = false;
        this.buscado  = true;
        if (data.cantidadTotal === 0) {
          this.toastr.info('No se encontraron egresos en el rango seleccionado.', 'Sin resultados');
        }
      },
      error: () => {
        this.cargando = false;
        this.buscado  = true;
        this.toastr.error('Error al consultar los egresos. Intenta de nuevo.', 'Error');
      }
    });
  }

  limpiar(): void {
    const hoy = obtenerFechaPeru();
    this.fechaDesde = hoy;
    this.fechaHasta = hoy;
    this.resumen    = null;
    this.buscado    = false;
  }

  // ── Helpers de formato ───────────────────────────────────────────────────
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

  simbolo(moneda: string | null): string {
    return moneda === 'PEN' ? 'S/' : '$';
  }

  formatMonto(item: ResumenEgresoItemDTO): string {
    const s = this.simbolo(item.moneda);
    return `${s} ${Number(item.monto ?? 0).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  formatMedioPago(mp: string | null): string {
    if (!mp) return '—';
    const mapa: Record<string, string> = {
      EFECTIVO: 'Efectivo',
      TRANSFERENCIA: 'Transferencia',
      DEPOSITO: 'Depósito',
      YAPE: 'Yape',
      PLIN: 'Plin',
      TARJETA: 'Tarjeta',
      OTROS: 'Otros'
    };
    return mapa[mp] ?? mp;
  }

  // ── Porcentaje para barra visual ─────────────────────────────────────────
  pct(parcial: number, total: number): number {
    if (!total || total === 0) return 0;
    return Math.round((parcial / total) * 100);
  }

  // ── Descargar PDF del recibo de egreso ───────────────────────────────────
  descargarEgreso(item: ResumenEgresoItemDTO): void {
    if (!item.numeroEgreso) return;
    this.comisionService.descargarEgresoPdf(item.numeroEgreso).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `egreso-${item.numeroEgreso}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
      },
      error: () => this.toastr.error('Error al descargar el recibo de egreso.', 'Error')
    });
  }
}