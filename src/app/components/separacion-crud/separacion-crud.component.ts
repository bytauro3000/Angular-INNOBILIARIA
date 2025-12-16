import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';

import { SeparacionResumen } from '../../dto/separacionresumen.dto';
import { SeparacionService } from '../../services/separacion.service';
import { SeparacionInsertEdit } from '../separacion-insert-edit/separacion-insert-edit';

@Component({
  selector: 'app-separacion',
  standalone: true,
  imports: [CommonModule, FormsModule, SeparacionInsertEdit], // Importamos el modal
  templateUrl: './separacion-crud.html',
  styleUrl: './separacion-crud.scss'
})
export class SeparacionComponent implements OnInit {
  @ViewChild('modalInsertEdit') modalInsertEdit!: SeparacionInsertEdit;

  separaciones: SeparacionResumen[] = [];
  separacionesFiltradas: SeparacionResumen[] = [];
  paginasSeparaciones: SeparacionResumen[] = [];

  // Filtros
  manzLote: string = '';
  dni: string = '';
  nomApe: string = '';
  filtroEstado: string = '';

  pageSize = 6;
  currentPage = 1;
  totalPages = 0;

  constructor(private separacionService: SeparacionService) {}

  ngOnInit(): void {
    this.cargarDatos();
  }

  cargarDatos() {
    this.separacionService.obtenerSeparacionResumen().subscribe(data => {
      this.separaciones = data;
      this.filtrarSeparaciones();
    });
  }

  filtrarSeparaciones() {
    this.separacionesFiltradas = this.separaciones.filter(s => 
      s.manLote.toLowerCase().includes(this.manzLote.toLowerCase()) &&
      s.dni.includes(this.dni) &&
      s.nomApeCli.toLowerCase().includes(this.nomApe.toLowerCase()) &&
      (this.filtroEstado === '' || s.estadoSeparacion === this.filtroEstado)
    );
    this.actualizarPaginacion();
  }

  actualizarPaginacion() {
    this.totalPages = Math.ceil(this.separacionesFiltradas.length / this.pageSize);
    const start = (this.currentPage - 1) * this.pageSize;
    this.paginasSeparaciones = this.separacionesFiltradas.slice(start, start + this.pageSize);
  }

  mostrarCrear() {
    this.modalInsertEdit.abrirModal();
  }

  mostrarEditar(item: SeparacionResumen) {
    this.separacionService.obtenerSeparacionPorId(item.idSeparacion).subscribe(data => {
      this.modalInsertEdit.abrirModal(data);
    });
  }

  eliminar(item: SeparacionResumen) {
    Swal.fire({
      title: '¿Eliminar?',
      text: `Se borrará la separación del lote ${item.manLote}`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar'
    }).then(res => {
      if (res.isConfirmed) {
        this.separacionService.eliminarSeparacion(item.idSeparacion).subscribe(() => {
          Swal.fire('Eliminado', '', 'success');
          this.cargarDatos();
        });
      }
    });
  }

  // Métodos de paginación (goToPage, etc) omitidos por brevedad pero deben mantenerse igual
}