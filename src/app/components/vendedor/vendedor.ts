// vendedor.component.ts
import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Vendedor } from '../../models/vendedor.model';
import { VendedorService } from '../../services/vendedor.service';
import { VendedorInsertar } from '../vendedor-insertar/vendedor-insertar';
import { ToastrService } from 'ngx-toastr';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-vendedor',
  standalone: true,
  imports: [CommonModule, FormsModule, VendedorInsertar],
  templateUrl: './vendedor.html',
  styleUrls: ['./vendedor.scss']
})
export class VendedorComponent implements OnInit {

  @ViewChild('registroModal') registroModal!: VendedorInsertar;

  vendedores: Vendedor[] = [];
  vendedoresFiltrados: Vendedor[] = [];
  paginatedVendedores: Vendedor[] = [];

  // Filtros (sin implementación backend aún)
  terminoBusqueda: string = '';
  tipoFiltro: string = 'nombres';

  // Paginación
  pageSize: number = 6;
  currentPage: number = 1;
  totalPages: number = 0;

  constructor(
    private vendedorService: VendedorService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.cargarVendedores();
  }

  abrirModal(vendedor?: Vendedor) {
    this.registroModal.abrirModal(vendedor);
  }

  cargarVendedores(): void {
    this.vendedorService.listarVendedores().subscribe({
      next: (data) => {
        this.vendedores = data;
        this.vendedoresFiltrados = [...this.vendedores];
        this.aplicarPaginacion();
      },
      error: () => {
        this.toastr.error('Error al cargar los vendedores.', 'Error');
      }
    });
  }

  // Filtro local (sin backend aún — solo preparado en la vista)
  filtrarVendedores(): void {
    const termino = this.terminoBusqueda.trim().toLowerCase();
    if (!termino) {
      this.vendedoresFiltrados = [...this.vendedores];
    } else {
      this.vendedoresFiltrados = this.vendedores.filter(v => {
        if (this.tipoFiltro === 'nombres') {
          return (v.nombre + ' ' + v.apellidos).toLowerCase().includes(termino);
        }
        if (this.tipoFiltro === 'dni') {
          return v.dni.toLowerCase().includes(termino);
        }
        return true;
      });
    }
    this.currentPage = 1;
    this.aplicarPaginacion();
  }

  aplicarPaginacion(): void {
    this.totalPages = Math.ceil(this.vendedoresFiltrados.length / this.pageSize);
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.paginatedVendedores = this.vendedoresFiltrados.slice(startIndex, endIndex);
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

  eliminarVendedor(id: number): void {
    Swal.fire({
      title: '¿Estás seguro?',
      text: '¡No podrás revertir esto!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.vendedorService.eliminarVendedor(id).subscribe({
          next: () => {
            this.toastr.success('Vendedor eliminado correctamente.', '¡Éxito!');
            this.cargarVendedores();
          },
          error: () => {
            this.toastr.error('Error al eliminar el vendedor.', 'Error');
          }
        });
      }
    });
  }

  descargarExcel(): void {
    this.vendedorService.exportarExcel().subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'vendedores.xlsx';
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: () => this.toastr.error('Error al exportar Excel.', 'Error')
    });
  }

  exportarPDF(): void {
    // implementación PDF existente
  }
}