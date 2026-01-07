import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import Swal from 'sweetalert2';

import { LoteResumen } from '../../dto/loteresumen.dto';
import { EstadoLote } from '../../enums/estadolote.enum';
import { LoteService } from '../../services/lote.service';
import { LotesInsertarEditar } from '../lotes-insertar-editar/lotes-insertar-editar';

@Component({
  selector: 'app-lote',
  standalone: true,
  imports: [CommonModule, FormsModule, NgSelectModule, LotesInsertarEditar],
  templateUrl: './lote.html',
  styleUrls: ['./lote.scss']
})
export class LoteComponent implements OnInit {
  // Referencia al componente hijo del modal
  @ViewChild('loteModal') loteModal!: LotesInsertarEditar;

  lotes: LoteResumen[] = [];
  lotesFiltrados: LoteResumen[] = [];
  paginatedLotes: LoteResumen[] = [];

  // Filtros
  filtroManzana: string = '';
  filtroEstado: EstadoLote | '' = '';
  filtroPrecioM2: number | null = null;
  
  // Paginación
  pageSize: number = 6;
  currentPage: number = 1;
  totalPages: number = 0;

  constructor(private loteService: LoteService) {}

  ngOnInit(): void {
    this.cargarLotes();
  }

  // ==========================================
  // CARGA DE DATOS
  // ==========================================
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

  // ==========================================
  // FILTROS Y PAGINACIÓN
  // ==========================================
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
    if (this.currentPage > 1) this.goToPage(this.currentPage - 1);
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) this.goToPage(this.currentPage + 1);
  }

  getPagesArray(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  // ==========================================
  // LLAMADAS AL MODAL (HIJO)
  // ==========================================

  abrirCrearLote(): void {
    this.loteModal.abrirModal();
  }

  abrirEditarLote(loteResumen: LoteResumen): void {
    this.loteService.obtenerLotePorId(loteResumen.idLote).subscribe({
      next: (loteCompleto) => {
        this.loteModal.abrirModal(loteCompleto);
      },
      error: () => Swal.fire('Error', 'No se pudo cargar el lote para editar', 'error')
    });
  }

  mostrarDetalle(loteResumen: LoteResumen): void {
    // Aquí podrías usar otro modal de detalle o el mismo hijo con un modo "solo lectura"
    this.loteService.obtenerLotePorId(loteResumen.idLote).subscribe({
      next: (lote) => {
        // Por ahora lo enviamos al modal de edición/ver
        this.loteModal.abrirModal(lote);
      }
    });
  }

  // 🔥 ELIMINAR CON SWEETALERT
  mostrarEliminar(loteResumen: LoteResumen): void {
    Swal.fire({
      title: '¿Eliminar lote?',
      text: `Vas a eliminar el lote ${loteResumen.manzana} - ${loteResumen.numeroLote}.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.loteService.eliminarLote(loteResumen.idLote).subscribe({
          next: () => {
            Swal.fire('¡Eliminado!', 'El lote ha sido eliminado.', 'success');
            this.cargarLotes();
          },
          error: () => Swal.fire('Error', 'No se pudo eliminar el lote.', 'error')
        });
      }
    });
  }
}