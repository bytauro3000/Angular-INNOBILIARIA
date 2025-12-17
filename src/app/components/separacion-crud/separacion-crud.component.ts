import { Component, OnInit } from '@angular/core'; // Removido ViewChild
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router'; // Importar Router
import Swal from 'sweetalert2';

import { SeparacionResumen } from '../../dto/separacionresumen.dto';
import { SeparacionService } from '../../services/separacion.service';

@Component({
  selector: 'app-separacion',
  standalone: true,
  imports: [CommonModule, FormsModule], // Removido SeparacionInsertEdit de imports ya que no es modal
  templateUrl: './separacion-crud.html',
  styleUrl: './separacion-crud.scss'
})
export class SeparacionComponent implements OnInit {
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

  constructor(
    private separacionService: SeparacionService,
    private router: Router // Inyectar Router
  ) {}

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
    this.separacionesFiltradas = this.separaciones.filter(s => {
      const coincideLote = s.lotes.some(l => 
        `Mz. ${l.manzana} - Lt. ${l.numeroLote}`.toLowerCase().includes(this.manzLote.toLowerCase())
      );

      const coincideDni = s.clientes.some(c => c.numDoc.includes(this.dni));

      const coincideNombre = s.clientes.some(c => 
        c.nombreCompleto.toLowerCase().includes(this.nomApe.toLowerCase())
      );

      const coincideEstado = (this.filtroEstado === '' || s.estadoSeparacion === this.filtroEstado);

      return coincideLote && coincideDni && coincideNombre && coincideEstado;
    });
    
    this.currentPage = 1;
    this.actualizarPaginacion();
  }

  actualizarPaginacion() {
    this.totalPages = Math.ceil(this.separacionesFiltradas.length / this.pageSize);
    const start = (this.currentPage - 1) * this.pageSize;
    this.paginasSeparaciones = this.separacionesFiltradas.slice(start, start + this.pageSize);
  }

  // MODIFICADO: Ahora navega a la ruta de registro
  mostrarCrear() {
    this.router.navigate(['/secretaria-menu/separaciones/registrar']);
  }

  // MODIFICADO: Ahora navega a la ruta de edición con el ID
  mostrarEditar(item: SeparacionResumen) {
    this.router.navigate(['/secretaria-menu/separaciones/editar', item.idSeparacion]);
  }

  eliminar(item: SeparacionResumen) {
    const loteInfo = item.lotes.map(l => `Mz ${l.manzana} Lt ${l.numeroLote}`).join(', ');
    Swal.fire({
      title: '¿Eliminar?',
      text: `Se borrará la separación de: ${loteInfo}`,
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

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.actualizarPaginacion();
    }
  }
}