import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ClienteService } from '../../services/cliente.service';
import { FormsModule } from '@angular/forms';
import { Cliente } from '../../models/cliente.model';
import { RouterModule } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import Swal from 'sweetalert2'; 
import { ClienteInsertarComponent } from '../cliente-insertar/cliente-insertar.component';
import { ClienteEditarComponent } from '../cliente-editar/cliente-editar.component'; // 👈 IMPORTACIÓN AÑADIDA

@Component({
  selector: 'app-clientes',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    ClienteInsertarComponent,
    ClienteEditarComponent // 👈 REGISTRO AÑADIDO
  ],
  templateUrl: './cliente-listar.html',
  styleUrls: ['./cliente-listar.scss']
})
export class ClientesComponent implements OnInit {

  @ViewChild('registroModal') registroModal!: ClienteInsertarComponent;
  @ViewChild('editarModal') editarModal!: ClienteEditarComponent; // 👈 REFERENCIA AL MODAL EDITAR

  clientes: Cliente[] = [];
  clientesFiltrados: Cliente[] = [];
  paginatedClientes: Cliente[] = [];

  terminoBusqueda: string = '';
  tipoFiltro: string = 'nombres';

  pageSize: number = 6;
  currentPage: number = 1;
  totalPages: number = 0;

  constructor(
    private clienteService: ClienteService,
    private toastr: ToastrService
  ) { }

  // Abre el modal de inserción
  abrirModal(cliente?: Cliente) {
    this.registroModal.abrirModalCliente(cliente); 
  }

  // Abre el modal de edición por ID (nueva funcionalidad)
  abrirModalEditar(id: number) {
    this.editarModal.abrirModal(id);
  }

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
  const termino = this.terminoBusqueda.trim();
  const tipo = this.tipoFiltro; // Este valor viene del [(ngModel)] de tu <select>

  // Si el buscador está vacío, cargamos la lista completa original
  if (!termino) {
    this.cargarClientes();
    return;
  }

  // Llamada al servicio con el término y el tipo de filtro (nombres o documento)
  this.clienteService.buscarClientesPorFiltro(termino, tipo).subscribe({
    next: (data) => {
      this.clientesFiltrados = data;
      this.currentPage = 1; // Reiniciamos a la primera página tras la búsqueda
      this.aplicarPaginacion();
    },
    error: (error) => {
      console.error('Error al filtrar clientes desde el servidor:', error);
      this.toastr.error('No se pudo realizar la búsqueda.', 'Error');
    }
  });
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
        this.clienteService.eliminarCliente(id).subscribe({
          next: () => {
            this.toastr.success(`Cliente eliminado correctamente.`, '¡Éxito!');
            this.cargarClientes();
          },
          error: (error) => {
            this.toastr.error('Error al eliminar el cliente.', 'Error');
            console.error('Error al eliminar el cliente:', error);
          }
        });
      }
    });
  }
}