import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import Swal from 'sweetalert2'; // 👈 Importar SweetAlert

// Tus modelos y servicios
import { LoteResumen } from '../../dto/loteresumen.dto';
import { EstadoLote } from '../../enums/estadolote.enum';
import { Programa } from '../../models/programa.model';
import { Lote } from '../../models/lote.model';
import { LoteService } from '../../services/lote.service';
import { ProgramaService } from '../../services/programa.service';

@Component({
  selector: 'app-lote',
  standalone: true,
  imports: [CommonModule, FormsModule, NgSelectModule],
  templateUrl: './lote.html',
  styleUrls: ['./lote.scss']
})
export class LoteComponent implements OnInit {
  
  lotes: LoteResumen[] = [];
  lotesFiltrados: LoteResumen[] = [];
  paginatedLotes: LoteResumen[] = [];

  // Filtros
  filtroManzana: string = '';
  filtroEstado: EstadoLote | '' = '';
  filtroPrecioM2: number | null = null;
  
  // Listas auxiliares
  programas: Programa[] = [];
  programasFiltrados: Programa[] = [];

  // Paginación
  pageSize: number = 6;
  currentPage: number = 1;
  totalPages: number = 0;

  loteSeleccionado: Lote | null = null;

  // Modales (Ya no necesitamos modalEliminarVisible)
  modalDetalleVisible = false;
  modalEditarVisible = false;
  modalCrearVisible = false;

  constructor(
    private loteService: LoteService, 
    private programaService: ProgramaService
  ) {}

  ngOnInit(): void {
    this.cargarLotes();
    this.cargarProgramas();
  }

  // ==========================================
  // CARGA DE DATOS
  // ==========================================
  cargarLotes(): void {
    this.loteService.obtenerLotesResumen().subscribe({
      next: (data) => {
        this.lotes = data;
        this.lotesFiltrados = [...this.lotes];
        this.aplicarPaginacion();
      },
      error: (err) => console.error('Error al cargar lotes:', err)
    });
  }

  cargarProgramas(): void {
    this.programaService.listarProgramas().subscribe({
      next: (data) => {
        this.programas = data;
        this.programasFiltrados = [...this.programas];
      },
      error: (err) => console.error('Error al cargar programas:', err)
    });
  }

  // ==========================================
  // FILTROS Y PAGINACIÓN
  // ==========================================
  filtrarLotes(): void {
    this.lotesFiltrados = this.lotes.filter(lote => {
      const coincideManzana = this.filtroManzana === '' || lote.manzana.toLowerCase().includes(this.filtroManzana.toLowerCase());
      const coincideEstado = this.filtroEstado === '' || lote.estado === this.filtroEstado;
      const coincidePrecio = this.filtroPrecioM2 === null || lote.precioM2 === this.filtroPrecioM2;
      return coincideManzana && coincideEstado && coincidePrecio;
    });
    this.currentPage = 1;
    this.aplicarPaginacion();
  }

  aplicarPaginacion(): void {
    this.totalPages = Math.ceil(this.lotesFiltrados.length / this.pageSize);
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    this.paginatedLotes = this.lotesFiltrados.slice(start, end);
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

  // ==========================================
  // ACCIONES Y MODALES
  // ==========================================

  mostrarDetalle(loteResumen: LoteResumen): void {
    this.loteService.obtenerLotePorId(loteResumen.idLote).subscribe({
      next: (loteCompleto: Lote) => {
        this.loteSeleccionado = loteCompleto;
        this.modalDetalleVisible = true;
      },
      error: () => Swal.fire('Error', 'No se pudo cargar el detalle', 'error')
    });
  }

  mostrarCrear(): void {
    this.loteSeleccionado = {
      manzana: '',
      numeroLote: '',
      area: 0,
      largo1: 0, largo2: 0, ancho1: 0, ancho2: 0,
      precioM2: 0,
      colindanteNorte: '', colindanteSur: '', colindanteEste: '', colindanteOeste: '',
      estado: EstadoLote.Disponible,
      programa: undefined
    };
    this.modalCrearVisible = true;
  }

  mostrarEditar(loteResumen: LoteResumen): void {
    this.loteService.obtenerLotePorId(loteResumen.idLote).subscribe({
      next: (loteCompleto: Lote) => {
        this.loteSeleccionado = loteCompleto;
        this.modalEditarVisible = true;
      },
      error: () => Swal.fire('Error', 'No se pudo cargar para editar', 'error')
    });
  }

  // 🔥 ELIMINAR CON SWEETALERT
  mostrarEliminar(loteResumen: LoteResumen): void {
    Swal.fire({
      title: '¿Eliminar lote?',
      text: `Vas a eliminar el lote ${loteResumen.manzana} - ${loteResumen.numeroLote}. Esto no se puede deshacer.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.eliminarLoteReal(loteResumen.idLote);
      }
    });
  }

  private eliminarLoteReal(id: number): void {
    this.loteService.eliminarLote(id).subscribe({
      next: () => {
        Swal.fire('¡Eliminado!', 'El lote ha sido eliminado.', 'success');
        this.cargarLotes();
      },
      error: (err) => {
        console.error(err);
        Swal.fire('Error', 'No se pudo eliminar el lote.', 'error');
      }
    });
  }

  // ==========================================
  // GUARDAR (CREAR Y EDITAR)
  // ==========================================

  guardarNuevo(): void {
    if (!this.loteSeleccionado) return;

    if (!this.loteSeleccionado.manzana || !this.loteSeleccionado.numeroLote || !this.loteSeleccionado.programa) {
      Swal.fire('Faltan datos', 'Manzana, Número de Lote y Programa son obligatorios', 'warning');
      return;
    }

    Swal.fire({ title: 'Guardando...', didOpen: () => Swal.showLoading() });

    this.loteService.crearLote(this.loteSeleccionado).subscribe({
      next: () => {
        Swal.close();
        Swal.fire('Creado', 'Lote creado exitosamente', 'success');
        this.cargarLotes();
        this.cerrarModal();
      },
      error: (err) => {
        Swal.close();
        console.error(err);
        Swal.fire('Error', 'No se pudo crear el lote', 'error');
      }
    });
  }

  guardarEdicion(): void {
    if (!this.loteSeleccionado?.idLote) return;

    Swal.fire({ title: 'Actualizando...', didOpen: () => Swal.showLoading() });

    this.loteService.actualizarLote(this.loteSeleccionado.idLote, this.loteSeleccionado).subscribe({
      next: () => {
        Swal.close();
        Swal.fire('Actualizado', 'Lote actualizado correctamente', 'success');
        this.cargarLotes();
        this.cerrarModal();
      },
      error: (err) => {
        Swal.close();
        console.error(err);
        Swal.fire('Error', 'No se pudo actualizar el lote', 'error');
      }
    });
  }

  cerrarModal(): void {
    this.modalDetalleVisible = false;
    this.modalEditarVisible = false;
    this.modalCrearVisible = false; // No necesitamos cerrar modalEliminarVisible
    this.loteSeleccionado = null;
  }

  // ==========================================
  // UTILITARIOS NG-SELECT
  // ==========================================
  
  // IMPORTANTE: Para que ng-select reconozca el objeto Programa al editar
  comparePrograma(p1: any, p2: any): boolean {
    return p1 && p2 ? p1.idPrograma === p2.idPrograma : p1 === p2;
  }
}


