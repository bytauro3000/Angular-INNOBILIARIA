import { Component, OnInit, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core'; 
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router'; 
import Swal from 'sweetalert2';

import { SeparacionResumen } from '../../dto/separacionresumen.dto';
import { SeparacionService } from '../../services/separacion.service';

@Component({
  selector: 'app-separacion',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    RouterModule, 
    CurrencyPipe, 
    DatePipe
  ], 
  templateUrl: './separacion-crud.html',
  styleUrl: './separacion-crud.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SeparacionComponent implements OnInit {
  separaciones: SeparacionResumen[] = [];
  paginasSeparaciones: SeparacionResumen[] = [];

  pageSize = 6;
  currentPage = 1;
  totalPages = 0;

  constructor(
    private separacionService: SeparacionService,
    private router: Router,
    private cdr: ChangeDetectorRef 
  ) {}

  ngOnInit(): void {
    this.cargarDatos();
  }

  cargarDatos(): void {
    this.separacionService.obtenerSeparacionResumen().subscribe({
      next: (data) => {
        this.separaciones = data;
        this.actualizarPaginacion();
        this.cdr.detectChanges(); 
      },
      error: (error) => {
        console.error('Error al cargar separaciones:', error);
        this.cdr.detectChanges();
      }
    });
  }

  actualizarPaginacion(): void {
    this.totalPages = Math.ceil(this.separaciones.length / this.pageSize);
    const start = (this.currentPage - 1) * this.pageSize;
    this.paginasSeparaciones = this.separaciones.slice(start, start + this.pageSize);
    this.cdr.detectChanges();
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.actualizarPaginacion();
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.actualizarPaginacion();
    }
  }

  mostrarCrear(): void {
    this.router.navigate(['/secretaria-menu/separaciones/registrar']);
  }

  mostrarEditar(item: SeparacionResumen): void {
    this.router.navigate(['/secretaria-menu/separaciones/editar', item.idSeparacion]);
  }

  eliminar(item: SeparacionResumen): void {
    const loteInfo = item.lotes.map(l => `Mz ${l.manzana} Lt ${l.numeroLote}`).join(', ');
    Swal.fire({
      title: '¿Estás seguro?',
      text: `Se eliminará la separación de: ${loteInfo}`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.separacionService.eliminarSeparacion(item.idSeparacion).subscribe({
          next: () => {
            Swal.fire('¡Eliminado!', 'Registro borrado con éxito.', 'success');
            this.cargarDatos();
          },
          error: () => {
            Swal.fire('Error', 'No se pudo eliminar el registro.', 'error');
          }
        });
      }
    });
  }
}