import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReporteIngresosService } from '../../services/reporteingresos.service';
import { AdminAnulacionesService } from '../../services/admin-anulaciones.service';
import {
  ResumenIngresosRangoDTO,
  ResumenIngresoItemDTO
} from '../../dto/resumen-ingresos-rango.dto';
import { ToastrService } from 'ngx-toastr';
import { obtenerFechaPeru } from '../../utils/fecha-peru';

@Component({
  selector: 'app-reporte-ingresos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reporteingresos.html',
  styleUrls: ['./reporteingresos.scss']
})
export class ReporteIngresosComponent implements OnInit {

  // ── Filtros ──────────────────────────────────────────────────────────────
  fechaDesde: string = '';
  fechaHasta: string = '';

  // ── Estado ───────────────────────────────────────────────────────────────
  cargando = false;
  buscado  = false;
  resumen: ResumenIngresosRangoDTO | null = null;

  // ── Filtro de tipo en tabla ───────────────────────────────────────────────
  filtroTipo: string = 'TODOS';

  constructor(
    private reporteIngresosService: ReporteIngresosService,
    private adminAnulacionesService: AdminAnulacionesService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    // Por defecto: hoy
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
    this.filtroTipo = 'TODOS';

    this.reporteIngresosService.obtenerIngresosPorRango(this.fechaDesde, this.fechaHasta).subscribe({
      next: (data) => {
        this.resumen  = data;
        this.cargando = false;
        this.buscado  = true;
        if (data.cantidadTotal === 0) {
          this.toastr.info('No se encontraron ingresos en el rango seleccionado.', 'Sin resultados');
        }
      },
      error: () => {
        this.cargando = false;
        this.buscado  = true;
        this.toastr.error('Error al consultar los ingresos. Intenta de nuevo.', 'Error');
      }
    });
  }

  limpiar(): void {
    const hoy = obtenerFechaPeru();
    this.fechaDesde = hoy;
    this.fechaHasta = hoy;
    this.resumen    = null;
    this.buscado    = false;
    this.filtroTipo = 'TODOS';
  }

  // ── Detalle filtrado ─────────────────────────────────────────────────────
  get detalleFiltrado(): ResumenIngresoItemDTO[] {
    if (!this.resumen) return [];
    if (this.filtroTipo === 'TODOS') return this.resumen.detalle;
    return this.resumen.detalle.filter(i => i.tipoIngreso === this.filtroTipo);
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

  formatMonto(valor: number | null | undefined): string {
    if (valor == null) return '$ 0.00';
    return `$ ${Number(valor).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  etiquetaTipo(tipo: string): string {
    const mapa: Record<string, string> = {
      LETRA:                'Letra',
      MORA:                 'Mora',
      INICIAL:              'Inicial',
      INSCRIPCION_SERVICIO: 'INSCRIPCIÓN SB'
    };
    return mapa[tipo] ?? tipo;
  }

  claseTipo(tipo: string): string {
    const mapa: Record<string, string> = {
      LETRA:                'badge-letra',
      MORA:                 'badge-mora',
      INICIAL:              'badge-inicial',
      INSCRIPCION_SERVICIO: 'badge-inscripcion'
    };
    return mapa[tipo] ?? '';
  }

  formatMedioPago(mp: string | null): string {
    if (!mp) return '—';
    const mapa: Record<string, string> = {
      EFECTIVO:      'Efectivo',
      TRANSFERENCIA: 'Transferencia',
      DEPOSITO:      'Depósito',
      YAPE:          'Yape',
      PLIN:          'Plin',
      CHEQUE:        'Cheque'
    };
    return mapa[mp] ?? mp;
  }

  // ── Porcentaje para barra visual ─────────────────────────────────────────
  pct(parcial: number, total: number): number {
    if (!total || total === 0) return 0;
    return Math.round((parcial / total) * 100);
  }

  get totalFiltrado(): number {
    return this.detalleFiltrado.reduce((acc, i) => acc + Number(i.importePagado ?? 0), 0);
  }

  descargarComprobante(item: ResumenIngresoItemDTO): void {
    if (!item.numeroComprobante) return;

    const idPago = item.idPago;
    const idContrato = item.idContrato;

    let obs: import('rxjs').Observable<Blob>;

    switch (item.tipoIngreso) {
      case 'LETRA':
        obs = this.adminAnulacionesService.descargarComprobanteLetra(idPago!);
        break;
      case 'MORA':
        obs = this.adminAnulacionesService.descargarComprobanteMora(idPago!);
        break;
      case 'INSCRIPCION_SERVICIO':
        obs = this.adminAnulacionesService.descargarComprobanteInscripcion(idPago!);
        break;
      case 'INICIAL':
        obs = this.adminAnulacionesService.descargarComprobanteInicial(idContrato!);
        break;
      default:
        return;
    }

    obs.subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `comprobante-${item.numeroComprobante}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
      },
      error: () => this.toastr.error('Error al descargar comprobante.', 'Error')
    });
  }
}