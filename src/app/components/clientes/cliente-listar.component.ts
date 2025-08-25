import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ClienteService } from '../../services/cliente.service';
import { FormsModule } from '@angular/forms';
import { Cliente } from '../../models/cliente.model';
import { RouterModule } from '@angular/router'; // ✅ Importa RouterModule

@Component({
  selector: 'app-clientes',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule // ✅ Añade RouterModule aquí para que routerLink funcione
],
  templateUrl: './cliente-listar.html',
  styleUrls: ['./cliente-listar.scss']
})
export class ClientesComponent implements OnInit {

  clientes: Cliente[] = [];
  clientesFiltrados: Cliente[] = [];
  paginatedClientes: Cliente[] = [];

  terminoBusqueda: string = '';
  tipoFiltro: string = 'nombres';

  pageSize: number = 6;
  currentPage: number = 1;
  totalPages: number = 0;

  constructor(private clienteService: ClienteService) { }

  ngOnInit(): void {
    this.cargarClientes();
  }

  cargarClientes(): void {
    this.clienteService.listarClientes().subscribe({
      next: (data) => {
        this.clientes = data;
        this.clientesFiltrados = [...this.clientes];
        this.aplicarPaginacion();
      },
      error: (error) => {
        console.error('Error al cargar clientes:', error);
      }
    });
  }

  filtrarClientes(): void {
    if (!this.terminoBusqueda) {
      this.clientesFiltrados = [...this.clientes];
    } else {
      const terminoMinusculas = this.terminoBusqueda.toLowerCase();

      this.clientesFiltrados = this.clientes.filter(cliente => {
        if (this.tipoFiltro === 'nombres') {
          const nombreCompleto = `${cliente.nombre} ${cliente.apellidos || ''}`.toLowerCase();
          return nombreCompleto.includes(terminoMinusculas);
        } else if (this.tipoFiltro === 'documento') {
          return (cliente.dni && cliente.dni.toLowerCase().includes(terminoMinusculas)) ||
                   (cliente.ruc && cliente.ruc.toLowerCase().includes(terminoMinusculas));
        }
        return false;
      });
    }
    this.currentPage = 1;
    this.aplicarPaginacion();
  }

  aplicarPaginacion(): void {
    this.totalPages = Math.ceil(this.clientesFiltrados.length / this.pageSize);
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.paginatedClientes = this.clientesFiltrados.slice(startIndex, endIndex);
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

  eliminarCliente(id: number): void {
    const confirmacion = confirm('¿Estás seguro de que quieres eliminar este cliente?');
    if (confirmacion) {
      this.clienteService.eliminarCliente(id).subscribe({
        next: () => {
          console.log(`Cliente con ID ${id} eliminado correctamente.`);
          this.cargarClientes();
        },
        error: (error) => {
          console.error('Error al eliminar el cliente:', error);
        }
      });
    }
  }
}
