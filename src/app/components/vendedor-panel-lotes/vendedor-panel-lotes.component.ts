import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProgramaService } from '../../services/programa.service';
import { LoteService } from '../../services/lote.service';
import { Programa } from '../../models/programa.model';
import { EstadoLote } from '../../enums/estadolote.enum';
import { Title } from '@angular/platform-browser';

interface LoteVisual {
  idLote: number;
  manzana: string;
  numeroLote: string;
  area: number;
  precioM2?: number;
  estado: EstadoLote;
}

interface ManzanaGrupo {
  manzana: string;
  lotes: LoteVisual[];
}

@Component({
  selector: 'app-vendedor-panel-lotes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './vendedor-panel-lotes.html',
  styleUrls: ['./vendedor-panel-lotes.scss']
})
export class VendedorPanelLotesComponent implements OnInit {

  programas: Programa[] = [];
  programaSeleccionado: number | null = null;
  manzanas: ManzanaGrupo[] = [];
  loteSeleccionado: LoteVisual | null = null;

  cargando = false;
  mostrarPlano = false;
  planoError = false;

  EstadoLote = EstadoLote;

  constructor(
    private programaService: ProgramaService,
    private loteService: LoteService,
    private cdr: ChangeDetectorRef,
    private titleService: Title
  ) {
    this.titleService.setTitle('Panel de Lotes | Inmobiliaria Ivan');
  }

  ngOnInit(): void {
    this.cargarProgramas();
  }

  cargarProgramas(): void {
    this.programaService.listarProgramas().subscribe({
      next: (data) => {
        this.programas = data;
        if (data.length > 0) {
          this.programaSeleccionado = data[0].idPrograma!;
          this.cargarLotes();
        }
      },
      error: (err) => console.error('Error al cargar programas:', err)
    });
  }

  onProgramaChange(): void {
    this.loteSeleccionado = null;
    this.cargarLotes();
  }

  cargarLotes(): void {
    if (!this.programaSeleccionado) return;
    this.cargando = true;
    this.loteService.listarLotesEntidadPorPrograma(this.programaSeleccionado).subscribe({
      next: (data) => {
        this.cargando = false;
        const lotes: LoteVisual[] = data
          .map(l => ({
            idLote: l.idLote!,
            manzana: l.manzana,
            numeroLote: l.numeroLote,
            area: l.area,
            precioM2: l.precioM2,
            estado: l.estado || EstadoLote.Disponible
          }))
          .sort((a, b) => {
            const mz = a.manzana.localeCompare(b.manzana, undefined, { numeric: true });
            return mz !== 0 ? mz : a.numeroLote.localeCompare(b.numeroLote, undefined, { numeric: true });
          });

        const gruposMap = new Map<string, LoteVisual[]>();
        for (const lote of lotes) {
          if (!gruposMap.has(lote.manzana)) {
            gruposMap.set(lote.manzana, []);
          }
          gruposMap.get(lote.manzana)!.push(lote);
        }

        this.manzanas = Array.from(gruposMap.entries())
          .map(([manzana, lotes]) => ({ manzana, lotes }))
          .sort((a, b) => a.manzana.localeCompare(b.manzana, undefined, { numeric: true }));

        this.cdr.markForCheck();
      },
      error: (err) => {
        this.cargando = false;
        console.error('Error al cargar lotes:', err);
      }
    });
  }

  seleccionarLote(lote: LoteVisual): void {
    this.loteSeleccionado = lote;
  }

  getEstadoColor(estado: EstadoLote): string {
    switch (estado) {
      case EstadoLote.Disponible: return 'disponible';
      case EstadoLote.Separado: return 'separado';
      case EstadoLote.Vendido: return 'vendido';
      default: return 'disponible';
    }
  }

  getEstadoLabel(estado: EstadoLote): string {
    switch (estado) {
      case EstadoLote.Disponible: return 'Disponible';
      case EstadoLote.Separado: return 'Separado';
      case EstadoLote.Vendido: return 'Vendido';
      default: return 'Disponible';
    }
  }

  getEstadoIcon(estado: EstadoLote): string {
    switch (estado) {
      case EstadoLote.Disponible: return 'bi-check-circle-fill';
      case EstadoLote.Separado: return 'bi-clock-fill';
      case EstadoLote.Vendido: return 'bi-x-circle-fill';
      default: return 'bi-check-circle-fill';
    }
  }

  getPrecioTotal(lote: LoteVisual): string {
    if (lote.area && lote.precioM2) {
      const total = lote.area * lote.precioM2;
      return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(total);
    }
    return '—';
  }

  getResumen() {
    let disponibles = 0, separados = 0, vendidos = 0;
    for (const mz of this.manzanas) {
      for (const l of mz.lotes) {
        if (l.estado === EstadoLote.Disponible) disponibles++;
        else if (l.estado === EstadoLote.Separado) separados++;
        else if (l.estado === EstadoLote.Vendido) vendidos++;
      }
    }
    return { disponibles, separados, vendidos, total: disponibles + separados + vendidos };
  }

  togglePlano(): void {
    this.mostrarPlano = !this.mostrarPlano;
  }
}