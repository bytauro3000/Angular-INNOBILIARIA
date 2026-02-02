import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';

import { LoteResumen } from '../../dto/loteresumen.dto';
import { LoteService } from '../../services/lote.service';
import { ProgramaService } from '../../services/programa.service';
import { Programa } from '../../models/programa.model';
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
  programas: Programa[] = [];
  idProgramaSeleccionado: number | null = null;

  // 🔹 NUEVAS VARIABLES PARA BÚSQUEDA
  busquedaManzana: string = '';
  busquedaLote: string = '';

  // Paginación
  pageSize: number = 6;
  currentPage: number = 1;
  totalPages: number = 0;

  constructor(
    private loteService: LoteService,
    private programaService: ProgramaService
  ) {}

  ngOnInit(): void {
    this.idProgramaSeleccionado = 4;
    this.cargarProgramasYSeleccionar();
  }

  cargarProgramasYSeleccionar(): void {
    this.programaService.listarProgramas().subscribe({
      next: (data) => {
        this.programas = data;
        const existeProgramaDefault = this.programas.some(p => p.idPrograma === 4);
        if (existeProgramaDefault) {
          this.onProgramaChange();
        }
      },
      error: (err) => console.error('Error al cargar programas:', err)
    });
  }


  // 🔹 MÉTODO ACTUALIZADO PARA SOPORTAR BÚSQUEDA
  onProgramaChange(): void {
    if (this.idProgramaSeleccionado) {
      // Si hay texto en los buscadores, usamos el servicio de búsqueda filtrada
      if (this.busquedaManzana.trim() !== '' || this.busquedaLote.trim() !== '') {
        this.loteService.buscarLotesGestion(
          this.idProgramaSeleccionado, 
          this.busquedaManzana, 
          this.busquedaLote
        ).subscribe({
          next: (data) => {
            this.lotes = data;
            this.currentPage = 1;
            this.aplicarPaginacion();
          },
          error: (err) => console.error('Error en búsqueda:', err)
        });
      } else {
        // Si no hay texto, usamos la carga normal del programa
        this.loteService.obtenerLotesPorProgramaGestion(this.idProgramaSeleccionado).subscribe({
          next: (data) => {
            this.lotes = data;
            this.currentPage = 1;
            this.aplicarPaginacion();
          },
          error: (err) => {
            console.error('Error al cargar lotes:', err);
            this.lotes = [];
            this.paginatedLotes = [];
          }
        });
      }
    }
  }

  // 🔹 Función para limpiar búsqueda rápidamente
  limpiarBusqueda(): void {
    this.busquedaManzana = '';
    this.busquedaLote = '';
    this.onProgramaChange();
  }

  aplicarPaginacion(): void {
    this.totalPages = Math.ceil(this.lotes.length / this.pageSize);
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    this.paginatedLotes = this.lotes.slice(start, end);
  }

  goToPage(page: number | any): void {
    const pageNumber = typeof page === 'number' ? page : parseInt(page);
    if (pageNumber >= 1 && pageNumber <= this.totalPages) {
      this.currentPage = pageNumber;
      this.aplicarPaginacion();
    }
  }

  previousPage(): void {
    if (this.currentPage > 1) this.goToPage(this.currentPage - 1);
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) this.goToPage(this.currentPage + 1);
  }

  getPagesArray(): (number | string)[] {
    const total = this.totalPages;
    const current = this.currentPage;
    const pages: (number | string)[] = [];

    if (total <= 7) {
      for (let i = 1; i <= total; i++) pages.push(i);
    } else {
      pages.push(1);
      if (current > 3) pages.push('...');
      let start = Math.max(2, current - 1);
      let end = Math.min(total - 1, current + 1);
      if (current <= 3) end = 4;
      if (current >= total - 2) start = total - 3;
      for (let i = start; i <= end; i++) pages.push(i);
      if (current < total - 2) pages.push('...');
      pages.push(total);
    }
    return pages;
  }

  abrirCrearLote(): void {
    this.loteModal.abrirModal();
  }

  abrirEditarLote(loteResumen: LoteResumen): void {
    this.loteService.obtenerLotePorId(loteResumen.idLote).subscribe({
      next: (loteCompleto) => this.loteModal.abrirModal(loteCompleto),
      error: () => Swal.fire('Error', 'No se pudo cargar el lote para editar', 'error')
    });
  }

  mostrarDetalle(loteResumen: LoteResumen): void {
    this.loteService.obtenerLotePorId(loteResumen.idLote).subscribe({
      next: (lote) => this.loteModal.abrirModal(lote)
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
            this.onProgramaChange();
          },
          error: () => Swal.fire('Error', 'No se pudo eliminar el lote.', 'error')
        });
      }
    });
  }
}