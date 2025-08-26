import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LoteResumen } from '../../dto/loteresumen.dto';
import { EstadoLote } from '../../enums/estadolote.enum';
import { Programa } from '../../models/programa.model';
import { Lote } from '../../models/lote.model';
import { LoteService } from '../../services/lote.service';
import { NgSelectModule } from '@ng-select/ng-select';

@Component({
  selector: 'app-lote',
  standalone: true,
  imports: [CommonModule, FormsModule, NgSelectModule],
  templateUrl: './lote.html',
  styleUrls: ['./lote.scss']
})
export class LotesComponent implements OnInit {
  lotes: LoteResumen[] = [];
  lotesFiltrados: LoteResumen[] = [];
  paginatedLotes: LoteResumen[] = [];

  filtroManzana: string = '';
  filtroEstado: EstadoLote | '' = '';
  filtroPrecioM2: number | null = null;
  filtroPrograma: string = '';

  programas: Programa[] = [];
  programasFiltrados: Programa[] = [];

  pageSize: number = 6;
  currentPage: number = 1;
  totalPages: number = 0;

  loteSeleccionado: Lote | null = null;

  modalDetalleVisible = false;
  modalEditarVisible = false;
  modalEliminarVisible = false;
  modalCrearVisible = false;

  constructor(private loteService: LoteService) {}

  ngOnInit(): void {
    this.cargarLotes();
    this.cargarProgramas();
  }

  cargarLotes(): void {
    this.loteService.obtenerLotesResumen().subscribe({
      next: (data) => {
        this.lotes = data;
        this.lotesFiltrados = [...this.lotes];
        this.aplicarPaginacion();
      },
      error: (err) => console.error('Error al cargar lotes:', err)
    });
  }

  cargarProgramas(): void {
    this.loteService.listarPrograma().subscribe({
      next: (data) => {
        this.programas = data;
        this.programasFiltrados = [...this.programas];
      },
      error: (err) => console.error('Error al cargar programas:', err)
    });
  }

  filtrarLotes(): void {
    this.lotesFiltrados = this.lotes.filter(lote => {
      const coincideManzana = this.filtroManzana === '' || lote.manzana.toLowerCase().includes(this.filtroManzana.toLowerCase());
      const coincideEstado = this.filtroEstado === '' || lote.estado === this.filtroEstado;
      const coincidePrecio = this.filtroPrecioM2 === null || lote.precioM2 === this.filtroPrecioM2;
      return coincideManzana && coincideEstado && coincidePrecio;
    });

    this.currentPage = 1;
    this.aplicarPaginacion();
  }

  aplicarPaginacion(): void {
    this.totalPages = Math.ceil(this.lotesFiltrados.length / this.pageSize);
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    this.paginatedLotes = this.lotesFiltrados.slice(start, end);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.aplicarPaginacion();
    }
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.goToPage(this.currentPage - 1);
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.goToPage(this.currentPage + 1);
    }
  }

  getPagesArray(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  mostrarDetalle(loteResumen: LoteResumen): void {
    this.loteService.obtenerLotePorId(loteResumen.idLote).subscribe({
      next: (loteCompleto: Lote) => {
        this.loteSeleccionado = loteCompleto;
        this.modalDetalleVisible = true;
      },
      error: (err) => console.error('Error al obtener lote completo:', err)
    });
  }

  mostrarEliminar(loteResumen: LoteResumen): void {
    this.loteService.obtenerLotePorId(loteResumen.idLote).subscribe({
      next: (loteCompleto: Lote) => {
        this.loteSeleccionado = loteCompleto;
        this.modalEliminarVisible = true;
      },
      error: (err) => console.error('Error al obtener lote completo:', err)
    });
  }

  mostrarCrear(): void {
    this.loteSeleccionado = {
      manzana: '',
      numeroLote: '',
      area: 0,
      largo1: 0,
      largo2: 0,
      ancho1: 0,
      ancho2: 0,
      precioM2: 0,
      colindanteNorte: '',
      colindanteSur: '',
      colindanteEste: '',
      colindanteOeste: '',
      estado: EstadoLote.Disponible,
      programa: undefined
    };
    this.modalCrearVisible = true;
  }

  cerrarModal(): void {
    this.modalDetalleVisible = false;
    this.modalEditarVisible = false;
    this.modalEliminarVisible = false;
    this.modalCrearVisible = false;
    this.loteSeleccionado = null;
  }

  confirmarEliminar(): void {
    if (this.loteSeleccionado?.idLote) {
      this.loteService.eliminarLote(this.loteSeleccionado.idLote).subscribe({
        next: () => {
          this.cargarLotes();
          this.cerrarModal();
        },
        error: (err) => console.error('Error al eliminar lote:', err)
      });
    }
  }

  seleccionarPrograma(programa: Programa): void {
    if (this.loteSeleccionado) {
      this.loteSeleccionado.programa = programa;
    }
  }

  filtrarProgramas(): void {
    const termino = this.filtroPrograma.toLowerCase();
    this.programasFiltrados = this.programas.filter(p =>
      p.nombrePrograma.toLowerCase().includes(termino)
    );
  }

  mostrarEditar(loteResumen: LoteResumen): void {
    this.loteService.obtenerLotePorId(loteResumen.idLote).subscribe({
      next: (loteCompleto: Lote) => {
        this.loteSeleccionado = loteCompleto;
        this.modalEditarVisible = true;
      },
      error: (err) => console.error('Error al obtener lote completo:', err)
    });
  }

  guardarNuevo(): void {
    if (this.loteSeleccionado) {
      this.loteService.crearLote(this.loteSeleccionado).subscribe({
        next: () => {
          this.cargarLotes();
          this.cerrarModal();
        },
        error: (err) => console.error('Error al crear lote:', err)
      });
    }
  }

  guardarEdicion(): void {
    if (this.loteSeleccionado?.idLote) {
      this.loteService.actualizarLote(this.loteSeleccionado.idLote, this.loteSeleccionado).subscribe({
        next: () => {
          this.cargarLotes();
          this.cerrarModal();
        },
        error: (err) => console.error('Error al actualizar lote:', err)
      });
    }
  }
}

