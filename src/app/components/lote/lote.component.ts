import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';

import { LoteResumen } from '../../dto/loteresumen.dto';
import { LoteService } from '../../services/lote.service';
import { LotesInsertarEditar } from '../lotes-insertar-editar/lotes-insertar-editar';

@Component({
  selector: 'app-lote',
  standalone: true,
  imports: [CommonModule, FormsModule, LotesInsertarEditar],
  templateUrl: './lote.html',
  styleUrls: ['./lote.scss']
})
export class LoteComponent implements OnInit {
  @ViewChild('loteModal') loteModal!: LotesInsertarEditar;

  lotes: LoteResumen[] = [];
  paginatedLotes: LoteResumen[] = [];

  // Paginación
  pageSize: number = 6;
  currentPage: number = 1;
  totalPages: number = 0;

  constructor(private loteService: LoteService) {}

  ngOnInit(): void {
    this.cargarLotes();
  }

  cargarLotes(): void {
    this.loteService.obtenerLotesResumen().subscribe({
      next: (data) => {
        // 🔹 MODIFICADO: Ahora se asigna la data directamente sin .sort() 
        // para respetar el orden ascendente que viene del Backend.
        this.lotes = data;
        this.aplicarPaginacion();
      },
      error: (err) => console.error('Error al cargar lotes:', err)
    });
  }

  aplicarPaginacion(): void {
    this.totalPages = Math.ceil(this.lotes.length / this.pageSize);
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    this.paginatedLotes = this.lotes.slice(start, end);
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
    this.loteService.obtenerLotePorId(loteResumen.idLote).subscribe({
      next: (lote) => {
        this.loteModal.abrirModal(lote);
      }
    });
  }

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