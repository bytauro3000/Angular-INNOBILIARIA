import { ChangeDetectionStrategy, Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { ContratoService } from '../../services/contrato.service';
import { ContratoResponseDTO } from '../../dto/contratoreponse.dto';
import { TipoContrato } from '../../enums/tipocontrato.enum';
import { ToastrService } from 'ngx-toastr';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-contrato-listar',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    CurrencyPipe,
    DatePipe
  ],
  templateUrl: './contrato-listar.html',
  styleUrls: ['./contrato-listar.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContratoListarComponent implements OnInit {

  contratos: ContratoResponseDTO[] = [];
  contratosFiltrados: ContratoResponseDTO[] = [];
  paginatedContratos: ContratoResponseDTO[] = [];

  terminoBusqueda: string = '';

  pageSize: number = 5;
  currentPage: number = 1;
  totalPages: number = 0;

  TipoContrato = TipoContrato;

  constructor(
    private contratoService: ContratoService,
    private toastr: ToastrService,
    private cdr: ChangeDetectorRef // 👈 Inyecta el servicio aquí
  ) { }

  ngOnInit(): void {
    this.cargarContratos();
  }

  cargarContratos(): void {
    this.contratoService.listarContrato().subscribe({
      next: (data) => {
        this.contratos = data;
        this.filtrarContratos();
        this.cdr.detectChanges(); // 👈 Llama a este método después de actualizar los datos
      },
      error: (error) => {
        console.error('Error al cargar contratos:', error);
        this.toastr.error('Error al cargar los contratos.', 'Error');
        this.cdr.detectChanges(); // También es buena práctica en caso de error
      }
    });
  }

  filtrarContratos(): void {
    if (!this.terminoBusqueda) {
      this.contratosFiltrados = [...this.contratos];
    } else {
      const termino = this.terminoBusqueda.toLowerCase();
      this.contratosFiltrados = this.contratos.filter(contrato =>
        contrato.idContrato?.toString().includes(termino)
      );
    }
    this.currentPage = 1;
    this.aplicarPaginacion();
  }

  aplicarPaginacion(): void {
    this.totalPages = Math.ceil(this.contratosFiltrados.length / this.pageSize);
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.paginatedContratos = this.contratosFiltrados.slice(startIndex, endIndex);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.aplicarPaginacion();
      this.cdr.detectChanges(); // Llama a este método para actualizar la vista
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

  eliminarContrato(id: number): void {
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
        this.contratoService.eliminarContrato(id).subscribe({
          next: () => {
            this.toastr.success('Contrato eliminado exitosamente', 'Éxito');
            this.cargarContratos();
          },
          error: () => {
            this.toastr.error('Error al eliminar el contrato', 'Error');
          }
        });
      }
    });
  }

  trackById(index: number, contrato: ContratoResponseDTO): number {
    return contrato.idContrato!;
  }
}