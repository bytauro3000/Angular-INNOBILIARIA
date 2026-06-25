import { Component, OnInit } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LoteService } from '../../services/lote.service';
import { Lote } from '../../models/lote.model';

export interface GrupoPrograma {
  nombrePrograma: string;
  ubicacion: string;
  lotes: Lote[];
}

@Component({
  selector: 'app-reporte-lotes',
  standalone: true,
  imports: [CommonModule, DecimalPipe, FormsModule],
  templateUrl: './reporte-lote.html',
  styleUrls: ['./reporte-lote.scss']
})
export class ReporteLotesComponent implements OnInit {

  grupos: GrupoPrograma[] = [];
  gruposFiltrados: GrupoPrograma[] = [];
  cargando = true;
  fechaReporte = new Date();
  totalLotes = 0;
  filtroEstado: string = '';
  totalesFiltrados = { cantidad: 0, area: 0 };

  constructor(private loteService: LoteService) {}

  ngOnInit(): void {
    this.loteService.listarLotesParaReporte().subscribe({
      next: (lotes) => {
        this.grupos = this.agruparPorPrograma(lotes);
        this.aplicarFiltro();
        this.cargando = false;
      },
      error: () => { this.cargando = false; }
    });
  }

  aplicarFiltro(): void {
    if (!this.filtroEstado) {
      this.gruposFiltrados = this.grupos;
    } else {
      this.gruposFiltrados = this.grupos
        .map(g => ({
          ...g,
          lotes: g.lotes.filter(l => l.estado === this.filtroEstado)
        }))
        .filter(g => g.lotes.length > 0);
    }
    this.totalLotes = this.gruposFiltrados.reduce((acc, g) => acc + g.lotes.length, 0);
    this.totalesFiltrados.area = this.gruposFiltrados.reduce((acc, g) => acc + g.lotes.reduce((sa, l) => sa + (Number(l.area) || 0), 0), 0);
    this.totalesFiltrados.cantidad = this.totalLotes;
  }

  private agruparPorPrograma(lotes: Lote[]): GrupoPrograma[] {
    const mapa = new Map<string, GrupoPrograma>();
    for (const lote of lotes) {
      const nombre = (lote as any).nombrePrograma ?? 'Sin Programa';
      const ubicacion = (lote as any).ubicacion ?? '';
      if (!mapa.has(nombre)) {
        mapa.set(nombre, { nombrePrograma: nombre, ubicacion, lotes: [] });
      }
      mapa.get(nombre)!.lotes.push(lote);
    }
    mapa.forEach(grupo => {
      grupo.lotes.sort((a, b) => {
        const mz = a.manzana.localeCompare(b.manzana);
        return mz !== 0 ? mz : a.numeroLote.localeCompare(b.numeroLote);
      });
    });
    return Array.from(mapa.values()).sort((a, b) =>
      a.nombrePrograma.localeCompare(b.nombrePrograma)
    );
  }

  calcularPrecioTotal(lote: Lote): number {
    if (lote.area && lote.precioM2) {
      return Number(lote.area) * Number(lote.precioM2);
    }
    return 0;
  }

  sumarAreas(lotes: Lote[]): number {
    return lotes.reduce((acc, l) => acc + (Number(l.area) || 0), 0);
  }

  imprimir(): void {
    window.print();
  }
}