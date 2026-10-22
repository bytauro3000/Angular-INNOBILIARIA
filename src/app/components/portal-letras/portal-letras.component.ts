import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PortalService, PortalContrato, PortalLetra } from '../../services/portal.service';

type Filtro = 'TODAS' | 'VENCIDAS' | 'PROXIMAS' | 'PAGADAS';

/** Letras del portal: agrupadas por contrato, con filtro y mora en vivo. */
@Component({
  selector: 'app-portal-letras',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './portal-letras.html',
  styleUrls: ['./portal-letras.scss']
})
export class PortalLetrasComponent implements OnInit {

  contratos: PortalContrato[] = [];
  filtro: Filtro = 'TODAS';
  cargando = true;
  error: string | null = null;

  constructor(private portalService: PortalService) {}

  ngOnInit(): void {
    this.portalService.obtenerLetras().subscribe({
      next: (c) => { this.contratos = c; this.cargando = false; },
      error: (err: any) => {
        this.error = err?.error?.message || 'No se pudo cargar sus letras.';
        this.cargando = false;
      }
    });
  }

  cambiarFiltro(f: Filtro): void {
    this.filtro = f;
  }

  letrasDe(c: PortalContrato): PortalLetra[] {
    if (!c.letras) return [];
    return c.letras.filter(l => {
      switch (this.filtro) {
        case 'VENCIDAS':  return l.estado === 'VENCIDA';
        case 'PROXIMAS':  return l.estado === 'PENDIENTE' || l.estado === 'PARCIAL';
        case 'PAGADAS':   return l.estado === 'PAGADA';
        default:          return l.estado !== 'ANULADO';
      }
    });
  }

  get sinLetras(): boolean {
    return !this.cargando && !this.error &&
      this.contratos.every(c => this.letrasDe(c).length === 0);
  }

  simbolo(moneda: string | null | undefined): string {
    return moneda === 'PEN' ? 'S/.' : '$';
  }

  formato(monto: number | null | undefined): string {
    return (monto ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  formatoFecha(iso: string): string {
    if (!iso) return '—';
    const fecha = new Date(iso);
    const dia = String(fecha.getUTCDate()).padStart(2, '0');
    const mes = String(fecha.getUTCMonth() + 1).padStart(2, '0');
    return `${dia}/${mes}/${fecha.getUTCFullYear()}`;
  }

  claseEstado(estado: string): string {
    switch (estado) {
      case 'PAGADA': return 'pagada';
      case 'VENCIDA': return 'vencida';
      case 'PARCIAL': return 'parcial';
      case 'ANULADO': return 'anulado';
      default: return 'pendiente';
    }
  }

  textoEstado(estado: string): string {
    switch (estado) {
      case 'PAGADA': return 'Pagada';
      case 'VENCIDA': return 'Vencida';
      case 'PARCIAL': return 'Parcial';
      case 'ANULADO': return 'Anulada';
      default: return 'Pendiente';
    }
  }

  trackById(_: number, item: PortalLetra): number {
    return item.idLetra;
  }
}
