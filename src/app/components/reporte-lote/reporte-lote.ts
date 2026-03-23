import { Component, OnInit } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
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
  imports: [CommonModule, DecimalPipe],
  templateUrl: './reporte-lote.html',
  styleUrls: ['./reporte-lote.scss']
})
export class ReporteLotesComponent implements OnInit {

  grupos: GrupoPrograma[] = [];
  cargando = true;
  fechaReporte = new Date();
  totalLotes = 0;

  constructor(private loteService: LoteService) {}

  ngOnInit(): void {
    this.loteService.listarLotesParaReporte().subscribe({
      next: (lotes) => {
        this.grupos = this.agruparPorPrograma(lotes);
        this.totalLotes = lotes.length;
        this.cargando = false;
      },
      error: () => { this.cargando = false; }
    });
  }

  private agruparPorPrograma(lotes: Lote[]): GrupoPrograma[] {
    const mapa = new Map<string, GrupoPrograma>();
    for (const lote of lotes) {
      const nombre = lote.programa?.nombrePrograma ?? 'Sin Programa';
      const ubicacion = (lote.programa as any)?.distrito?.nombre ?? '';
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