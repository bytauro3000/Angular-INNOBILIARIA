import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';

import { LoteResumen } from '../../dto/loteresumen.dto';
import { LoteService } from '../../services/lote.service';
import { ProgramaService } from '../../services/programa.service'; // 🔹 Importado
import { Programa } from '../../models/programa.model'; // 🔹 Importado
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
  programas: Programa[] = []; // 🔹 Lista para el select
  idProgramaSeleccionado: number | null = null; // 🔹 ID seleccionado

  // Paginación
  pageSize: number = 6;
  currentPage: number = 1;
  totalPages: number = 0;

  constructor(
    private loteService: LoteService,
    private programaService: ProgramaService // 🔹 Inyectado
  ) {}

 ngOnInit(): void {
  // 1. Asignamos el ID 4 por defecto al iniciar
  this.idProgramaSeleccionado = 4;
  this.cargarProgramasYSeleccionar();
}

cargarProgramasYSeleccionar(): void {
  this.programaService.listarProgramas().subscribe({
    next: (data) => {
      this.programas = data;
      
      // 2. Verificamos si el ID 4 existe en la data recibida y disparamos la carga de lotes
      const existeProgramaDefault = this.programas.some(p => p.idPrograma === 4);
      if (existeProgramaDefault) {
        this.onProgramaChange();
      }
    },
    error: (err) => console.error('Error al cargar programas:', err)
  });
}
  cargarProgramas(): void {
    this.programaService.listarProgramas().subscribe({
      next: (data) => this.programas = data,
      error: (err) => console.error('Error al cargar programas:', err)
    });
  }

  // 🔹 Este método se dispara cuando cambias el select en el HTML
  onProgramaChange(): void {
  if (this.idProgramaSeleccionado) {
    this.loteService.obtenerLotesPorProgramaGestion(this.idProgramaSeleccionado).subscribe({
      next: (data) => {
        this.lotes = data;
        this.currentPage = 1;
        this.aplicarPaginacion();
      },
      error: (err) => {
        console.error('Error al cargar lotes del programa:', err);
        this.lotes = [];
        this.paginatedLotes = [];
      }
    });
  }
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
            this.onProgramaChange(); // 🔹 Recarga solo los lotes del programa actual
          },
          error: () => Swal.fire('Error', 'No se pudo eliminar el lote.', 'error')
        });
      }
    });
  }
}