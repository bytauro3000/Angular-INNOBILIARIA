import { Component, OnInit, AfterViewInit, ViewChild, ElementRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ClienteService } from '../../services/cliente.service';
import { FormsModule } from '@angular/forms';
import { Cliente } from '../../models/cliente.model';
import { Page } from '../../models/page.model';
import { RouterModule } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import Swal from 'sweetalert2'; 
import { ClienteInsertarComponent } from '../cliente-insertar/cliente-insertar.component';
import { ClienteEditarComponent } from '../cliente-editar/cliente-editar.component';
import { Title } from '@angular/platform-browser';


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
export class ClientesComponent implements OnInit, AfterViewInit {

  @ViewChild('registroModal') registroModal!: ClienteInsertarComponent;
  @ViewChild('editarModal') editarModal!: ClienteEditarComponent; // 👈 REFERENCIA AL MODAL EDITAR

  clientes: Cliente[] = [];
  paginatedClientes: Cliente[] = [];
  totalElementos: number = 0;

  terminoBusqueda: string = '';
  tipoFiltro: string = 'nombres';

  pageSize: number = 7;
  currentPage: number = 0;
  totalPages: number = 0;

  isCargando: boolean = false;

  @ViewChild('tableBody') tableBody!: ElementRef<HTMLElement>;
  private readonly ROW_HEIGHT_PX = 48;
  private readonly PAGINATION_RESERVE_PX = 80;

  constructor(
    private clienteService: ClienteService,
    private toastr: ToastrService,
    private titleService: Title
  ) { this.titleService.setTitle('Clientes | Inmobiliaria Ivan'); }


  abrirModal(cliente?: Cliente) {
    this.registroModal.abrirModalCliente(cliente); 
  }

  abrirModalEditar(id: number) {
    this.editarModal.abrirModal(id);
  }

  ngOnInit(): void {
    this.cargarClientes();
  }

  ngAfterViewInit(): void {
    setTimeout(() => this.calcularPageSize(), 0);
  }

  @HostListener('window:resize')
  onResize(): void {
    this.calcularPageSize();
  }

  calcularPageSize(): void {
    if (!this.tableBody?.nativeElement) return;
    const tbodyTop = this.tableBody.nativeElement.getBoundingClientRect().top;
    const available = window.innerHeight - tbodyTop - this.PAGINATION_RESERVE_PX;
    const nuevaPageSize = Math.max(3, Math.floor(available / this.ROW_HEIGHT_PX));
    if (nuevaPageSize !== this.pageSize) {
      this.pageSize = nuevaPageSize;
      this.currentPage = 0;
      this.cargarClientes();
    }
  }

  cargarClientes(): void {
    this.isCargando = true;
    this.clienteService.listarClientesPaginado(this.currentPage, this.pageSize).subscribe({
      next: (page: Page<Cliente>) => {
        this.isCargando = false;
        this.paginatedClientes = page.content;
        this.totalPages = page.totalPages;
        this.totalElementos = page.totalElements;
      },
      error: (error) => {
        this.isCargando = false;
        console.error('Error al cargar clientes:', error);
      }
    });
  }

  filtrarClientes(): void {
    const termino = this.terminoBusqueda.trim();
    const tipo = this.tipoFiltro;

    if (!termino) {
      this.currentPage = 0;
      this.cargarClientes();
      return;
    }

    this.clienteService.buscarClientesPorFiltro(termino, tipo).subscribe({
      next: (data) => {
        this.paginatedClientes = data;
        this.totalPages = 1;
        this.currentPage = 0;
        this.totalElementos = data.length;
      },
      error: (error) => {
        console.error('Error al filtrar clientes desde el servidor:', error);
        this.toastr.error('No se pudo realizar la búsqueda.', 'Error');
      }
    });
  }

  goToPage(page: number): void {
    if (page >= 0 && page < this.totalPages) {
      this.currentPage = page;
      this.cargarClientes();
    }
  }

  previousPage(): void {
    if (this.currentPage > 0) {
      this.goToPage(this.currentPage - 1);
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages - 1) {
      this.goToPage(this.currentPage + 1);
    }
  }

  getPagesArray(): (number | string)[] {
  const total = this.totalPages;
  const current = this.currentPage;
  const pages: (number | string)[] = [];

  if (total <= 7) {
    for (let i = 0; i < total; i++) pages.push(i);
  } else {
    pages.push(0);

    if (current > 3) {
      pages.push('...');
    }

    let start = Math.max(1, current - 1);
    let end = Math.min(total - 2, current + 1);

    if (current <= 3) end = 4;
    if (current >= total - 3) start = total - 4;

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (current < total - 3) {
      pages.push('...');
    }

    pages.push(total - 1);
  }
  return pages;
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