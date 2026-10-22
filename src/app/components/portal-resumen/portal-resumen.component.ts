import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { PortalService, PortalResumen } from '../../services/portal.service';

/** Resumen del portal: deudas, contadores y estado de cada contrato. */
@Component({
  selector: 'app-portal-resumen',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './portal-resumen.html',
  styleUrls: ['./portal-resumen.scss']
})
export class PortalResumenComponent implements OnInit {

  resumen: PortalResumen | null = null;
  cargando = true;
  error: string | null = null;

  constructor(private portalService: PortalService) {}

  ngOnInit(): void {
    this.portalService.obtenerResumen().subscribe({
      next: (r) => { this.resumen = r; this.cargando = false; },
      error: (err: any) => {
        this.error = err?.error?.message || 'No se pudo cargar su información.';
        this.cargando = false;
      }
    });
  }

  /** "S/. 1,234.00", "$ 1,234.00" o ambos si el cliente tiene contratos en las dos monedas. */
  deudaInmediataTexto(): string {
    return this.porMoneda(this.resumen?.deudaInmediataPen, this.resumen?.deudaInmediataUsd,
                          this.resumen?.moraInmediataPen, this.resumen?.moraInmediataUsd);
  }

  deudaTotalTexto(): string {
    return this.porMoneda(this.resumen?.deudaTotalPen, this.resumen?.deudaTotalUsd, 0, 0);
  }

  private porMoneda(pen: number | null | undefined, usd: number | null | undefined,
                    moraPen: number | null | undefined, moraUsd: number | null | undefined): string {
    const partes: string[] = [];
    if (pen && pen > 0) partes.push(`S/. ${this.formato(pen)}${moraPen ? ` (mora S/. ${this.formato(moraPen)})` : ''}`);
    if (usd && usd > 0) partes.push(`$ ${this.formato(usd)}${moraUsd ? ` (mora $ ${this.formato(moraUsd)})` : ''}`);
    return partes.length ? partes.join('  ·  ') : 'S/. 0.00';
  }

  formato(monto: number): string {
    return monto.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  simbolo(moneda: string | null | undefined): string {
    return moneda === 'PEN' ? 'S/.' : '$';
  }

  claseEstado(estado: string | null | undefined): string {
    switch (estado) {
      case 'ACTIVO': return 'ok';
      case 'MORA': return 'mora';
      case 'CARTA_NOTARIAL':
      case 'EN_RESOLUCION': return 'alerta';
      case 'CANCELADO': return 'cancelado';
      default: return 'neutro';
    }
  }

  get sinContratos(): boolean {
    return !this.cargando && !this.error && (this.resumen?.contratos?.length ?? 0) === 0;
  }
}
