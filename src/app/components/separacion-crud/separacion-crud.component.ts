import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import Swal from 'sweetalert2'; // 👈 IMPORTANTE: Importar SweetAlert

// Tus imports de modelos y servicios...
import { SeparacionResumen } from '../../dto/separacionresumen.dto';
import { EstadoSeparacion } from '../../enums/estadoseparacion.enum';
import { Separacion } from '../../models/separacion.model';
import { SeparacionService } from '../../services/separacion.service';
import { ClienteService } from '../../services/cliente.service';
import { VendedorService } from '../../services/vendedor.service';
import { LoteService } from '../../services/lote.service';
import { ProgramaService } from '../../services/programa.service';
import { Programa } from '../../models/programa.model';
import { Cliente } from '../../models/cliente.model';
import { Vendedor } from '../../models/vendedor.model';
import { Lote } from '../../models/lote.model';

@Component({
  selector: 'app-separacion',
  standalone: true,
  imports: [CommonModule, FormsModule, NgSelectModule],
  templateUrl: './separacion-crud.html',
  styleUrl: './separacion-crud.scss'
})
export class SeparacionComponent implements OnInit {
  
  // ... (Tus variables de paginación y filtros se mantienen igual) ...
  seperaciones: SeparacionResumen[] = [];
  seperacionesFiltradas: SeparacionResumen[] = [];
  paginasSeparaciones: SeparacionResumen[] = [];

  // Filtros
  manzLote: string = '';
  dni: string = '';
  nomApe: string = '';
  filtroEstado: EstadoSeparacion | '' = '';

  // Paginación
  pageSize: number = 6;
  currentPage: number = 1;
  totalPages: number = 0;

  // Modales (Nota: Ya no necesitamos modalEliminarVisible si usamos SweetAlert para confirmar)
  modalDetalleVisible = false;
  modalEditarVisible = false;
  modalCrearVisible = false;

  separacionSeleccionada: Separacion | null = null;

  // Listas para combos
  clientes: Cliente[] = [];
  clientesFiltrados: Cliente[] = [];
  vendedores: Vendedor[] = [];
  vendedoresFiltrados: Vendedor[] = [];
  programas: Programa[] = [];
  programasFiltrados: Programa[] = [];
  lotes: Lote[] = [];
  lotesFiltrados: Lote[] = [];

  programaSeleccionado: Programa | null = null;
  
  fechaMaxima: string = '';
  fechaActual: string = '';

  constructor(
    private separacionService: SeparacionService,
    private clienteService: ClienteService,
    private vendedorService: VendedorService,
    private loteService: LoteService,
    private programaService: ProgramaService
  ) {}

  ngOnInit(): void {
    this.cargarSeparaciones();
  }

  // ... (Tus métodos de carga, paginación y filtros se mantienen igual) ...

  cargarSeparaciones(): void {
    this.separacionService.obtenerSeparacionResumen().subscribe({
      next: (data) => {
        this.seperaciones = data;
        this.seperacionesFiltradas = [...this.seperaciones];
        this.aplicarPaginacion();
      },
      error: (err) => console.error("Error cargando separaciones", err)
    });
  }

  aplicarPaginacion(): void {
    this.totalPages = Math.ceil(this.seperacionesFiltradas.length / this.pageSize);
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    this.paginasSeparaciones = this.seperacionesFiltradas.slice(start, end);
  }

  // ... (Tus métodos goToPage, previousPage, nextPage, getPagesArray se mantienen igual) ...
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
  
  filtrarSeparaciones(): void {
    this.seperacionesFiltradas = this.seperaciones.filter(s => {
      const coincideManzLote = this.manzLote === '' || s.manLote.toLowerCase().includes(this.manzLote.toLowerCase());
      const coincideDni = this.dni === '' || s.dni.toLowerCase().includes(this.dni.toLowerCase());
      const coincideNombre = this.nomApe === '' || s.nomApeCli.toLowerCase().includes(this.nomApe.toLowerCase());
      const coincideEstado = this.filtroEstado === '' || s.estadoSeparacion === this.filtroEstado;
      return coincideManzLote && coincideDni && coincideNombre && coincideEstado;
    });
    this.currentPage = 1;
    this.aplicarPaginacion();
  }


  // Cargas de datos auxiliares
  cargarClientes(): void {
    this.clienteService.listarClientes().subscribe(data => this.clientes = data);
  }
  cargarVendedores(): void {
    this.vendedorService.listarVendedores().subscribe(data => this.vendedores = data);
  }
  cargarProgramas(): void {
    this.programaService.listarProgramas().subscribe(data => this.programas = data);
  }
  cargarLotes(): void {
    this.loteService.listarLotes().subscribe(data => {
      this.lotes = data;
      this.lotesFiltrados = [...this.lotes]; // Inicialmente todos
    });
  }

  // --------------------------------------------------------------------------------
  // GESTIÓN DE MODALES Y ACCIONES (CON SWEETALERT)
  // --------------------------------------------------------------------------------

  mostrarDetalle(separacionResumen: SeparacionResumen): void {
    this.separacionService.obtenerSeparacionPorId(separacionResumen.idSeparacion).subscribe({
      next: (separacion) => {
        this.separacionSeleccionada = separacion;
        this.modalDetalleVisible = true;
      },
      error: () => Swal.fire('Error', 'No se pudo cargar el detalle', 'error')
    });
  }

  mostrarCrear(): void {
    this.separacionSeleccionada = {
      cliente: undefined,
      vendedor: undefined,
      lote: undefined,
      monto: 0,
      fechaSeparacion: this.obtenerFechaActual(),
      fechaLimite: this.obtenerFechaMaxima(),
      estado: EstadoSeparacion.EN_PROCESO,
      observaciones: ''
    };
    
    // Cargar listas frescas
    this.cargarClientes();
    this.cargarVendedores();
    this.cargarProgramas();
    this.cargarLotes();
    
    this.fechaMaxima = this.obtenerFechaMaxima();
    this.fechaActual = this.obtenerFechaActual();
    
    this.modalCrearVisible = true;
  }

  mostrarEditar(separacionResumen: SeparacionResumen): void {
    this.cargarClientes();
    this.cargarVendedores();
    
    this.separacionService.obtenerSeparacionPorId(separacionResumen.idSeparacion).subscribe({
      next: (separacion) => {
        this.separacionSeleccionada = separacion;
        this.modalEditarVisible = true;
      },
      error: () => Swal.fire('Error', 'No se pudo cargar para editar', 'error')
    });
  }

  // 🔥 NUEVO: Eliminar usando SweetAlert directamente
  // Ya no necesitas el modalEliminarSeparacion en el HTML
  mostrarEliminar(separacionResumen: SeparacionResumen): void {
    Swal.fire({
      title: '¿Estás seguro?',
      text: `Se eliminará la separación del lote ${separacionResumen.manLote}. ¡No podrás revertir esto!`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.eliminarSeparacionReal(separacionResumen.idSeparacion);
      }
    });
  }

  private eliminarSeparacionReal(id: number): void {
    this.separacionService.eliminarSeparacion(id).subscribe({
      next: () => {
        Swal.fire('¡Eliminado!', 'La separación ha sido eliminada.', 'success');
        this.cargarSeparaciones();
      },
      error: (err) => {
        console.error(err);
        Swal.fire('Error', 'No se pudo eliminar la separación.', 'error');
      }
    });
  }

  // --------------------------------------------------------------------------------
  // GUARDAR (CREAR) CON SWEETALERT
  // --------------------------------------------------------------------------------
  guardarNuevo(): void {
    if (
      !this.separacionSeleccionada?.cliente ||
      !this.separacionSeleccionada?.vendedor ||
      !this.separacionSeleccionada?.lote
    ) {
      // ⚠️ Validación visual con Swal
      Swal.fire({
        icon: 'warning',
        title: 'Faltan datos',
        text: 'Por favor selecciona Cliente, Vendedor y Lote para continuar.'
      });
      return;
    }

    Swal.fire({
      title: 'Guardando...',
      text: 'Por favor espere',
      allowOutsideClick: false,
      didOpen: () => { Swal.showLoading(); }
    });

    this.separacionService.crearSeparacion(this.separacionSeleccionada).subscribe({
      next: (response: any) => {
        Swal.close(); // Cierra el loading
        
        // ✅ Éxito
        Swal.fire({
          icon: 'success',
          title: '¡Separación Creada!',
          text: response.message || 'La separación se registró correctamente.',
          timer: 2000,
          showConfirmButton: false
        });

        this.cargarSeparaciones();
        this.cargarLotes(); // Actualizar disponibilidad de lotes
        this.cerrarModal();
      },
      error: (err) => {
        console.error("Error:", err);
        Swal.close();
        
        // ❌ Error
        let mensaje = "Ocurrió un error inesperado";
        if (err.error && err.error.error) mensaje = err.error.error;
        
        Swal.fire({
          icon: 'error',
          title: 'Error al crear',
          text: mensaje
        });
      }
    });
  }

  // --------------------------------------------------------------------------------
  // GUARDAR (EDITAR) CON SWEETALERT
  // --------------------------------------------------------------------------------
  guardarEdicion(): void {
    if (!this.separacionSeleccionada) return;

    if (!this.separacionSeleccionada.cliente || !this.separacionSeleccionada.vendedor) {
       Swal.fire('Atención', 'El cliente y el vendedor son obligatorios.', 'warning');
       return;
    }

    Swal.fire({
      title: 'Actualizando...',
      didOpen: () => { Swal.showLoading(); }
    });

    const id = this.separacionSeleccionada.idSeparacion;

    if (id) {
      this.separacionService.actualizarSeparacion(id, this.separacionSeleccionada).subscribe({
        next: () => {
          Swal.close();
          Swal.fire({
             icon: 'success',
             title: 'Actualizado',
             text: 'La separación se actualizó correctamente',
             timer: 1500
          });
          this.cargarSeparaciones();
          this.cerrarModal();
        },
        error: (err) => {
          Swal.close();
          console.error('Error al actualizar:', err);
          Swal.fire('Error', 'No se pudo actualizar la separación', 'error');
        }
      });
    }
  }

  cerrarModal(): void {
    this.modalDetalleVisible = false;
    this.modalEditarVisible = false;
    this.modalCrearVisible = false;
    this.separacionSeleccionada = null;
  }

  // Helpers de búsqueda y fechas
  obtenerFechaActual(): string {
    return new Date().toISOString().split('T')[0];
  }

  obtenerFechaMaxima(): string {
    const fechaLimite = new Date();
    fechaLimite.setMonth(fechaLimite.getMonth() + 1);
    return fechaLimite.toISOString().split('T')[0];
  }

  customSearchCliente(term: string, item: Cliente): boolean {
    term = term.toLowerCase();
    return (
      (item.apellidos ?? '').toLowerCase().includes(term) ||
      (item.numDoc ?? '').toLowerCase().includes(term) ||
      (item.nombre ?? '').toLowerCase().includes(term)
    );
  }

  customSearchVendedor(term: string, item: Vendedor) {
    term = term.toLowerCase();
    return (
      item.apellidos.toLowerCase().includes(term) ||
      item.dni.toLowerCase().includes(term) ||
      item.nombre.toLowerCase().includes(term)
    );
  }

  compareCliente(c1: any, c2: any): boolean {
    return c1 && c2 ? c1.idCliente === c2.idCliente : c1 === c2;
  }

  compareVendedor(v1: any, v2: any): boolean {
    return v1 && v2 ? v1.idVendedor === v2.idVendedor : v1 === v2;
  }

  onProgramaChange(programa: Programa): void {
    this.programaSeleccionado = programa;
    this.lotesFiltrados = this.lotes.filter(l => {
      // Nota: Ajusta esta lógica según si quieres mostrar solo DISPONIBLES o todos al crear
      const estadoOk = l.estado?.toLowerCase() === 'disponible';
      const programaOk = l.programa?.idPrograma === programa.idPrograma;
      return estadoOk && programaOk;
    });
  }
}