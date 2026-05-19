import { Component, OnInit, ChangeDetectorRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InscripcionService, InscripcionResumenDTO } from '../../services/inscripcion.service';
import { InscripcionServiciosInsertarComponent } from '../inscripcion-servicios-insertar/inscripcion-servicios-insertar.component';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-inscripcion-listar',
  standalone: true,
  imports: [CommonModule, FormsModule, InscripcionServiciosInsertarComponent],
  templateUrl: './inscripcion-listar.html',
  styleUrls: ['./inscripcion-listar.scss']
})
export class InscripcionListarComponent implements OnInit {

  @ViewChild('modalInscripcion') modalInscripcion!: InscripcionServiciosInsertarComponent;

  contratos: InscripcionResumenDTO[] = [];
  contratosFiltrados: InscripcionResumenDTO[] = [];
  terminoBusqueda: string = '';
  filtroServicio: 'TODOS' | 'SIN_SERVICIO' | 'PARCIAL' | 'COMPLETO' = 'TODOS';
  isCargando: boolean = false;

  constructor(
    private inscripcionService: InscripcionService,
    private toastr: ToastrService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.cargarContratos();
  }

  cargarContratos(): void {
    this.isCargando = true;
    // Llama a GET /api/gateway/inscripciones/resumen (endpoint optimizado)
    this.inscripcionService.listarResumen().subscribe({
      next: (data: InscripcionResumenDTO[]) => {
        this.contratos = data;
        this.aplicarFiltros();
        this.isCargando = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.isCargando = false;
        this.toastr.error('Error al cargar los contratos.', 'Error');
      }
    });
  }

  aplicarFiltros(): void {
    let resultado = [...this.contratos];

    if (this.terminoBusqueda.trim()) {
      const t = this.terminoBusqueda.toLowerCase();
      resultado = resultado.filter(c =>
        c.idContrato.toString().includes(t) ||
        c.nombreCliente.toLowerCase().includes(t)
      );
    }

    switch (this.filtroServicio) {
      case 'SIN_SERVICIO': resultado = resultado.filter(c => !c.tieneLuz && !c.tieneAgua); break;
      case 'PARCIAL':      resultado = resultado.filter(c => (c.tieneLuz || c.tieneAgua) && !(c.tieneLuz && c.tieneAgua)); break;
      case 'COMPLETO':     resultado = resultado.filter(c => c.tieneLuz && c.tieneAgua); break;
    }

    this.contratosFiltrados = resultado;
  }

  limpiarFiltros(): void {
    this.terminoBusqueda = '';
    this.filtroServicio = 'TODOS';
    this.aplicarFiltros();
  }

  abrirModalInscripcion(id: number): void {
    this.modalInscripcion.abrirModal(id);
  }

  onInscripcionExitosa(): void {
    this.cargarContratos();
  }

  getEstadoServicio(c: InscripcionResumenDTO): 'completo' | 'parcial' | 'ninguno' {
    if (c.tieneLuz && c.tieneAgua) return 'completo';
    if (c.tieneLuz || c.tieneAgua) return 'parcial';
    return 'ninguno';
  }

  // El DTO del resumen ya trae nombreCliente y manzana/numeroLote como strings directos
  getLotesTexto(c: InscripcionResumenDTO): string {
    if (!c.manzana && !c.numeroLote) return '—';
    return `Mz. ${c.manzana} - Lt. ${c.numeroLote}`;
  }

  getClientesTexto(c: InscripcionResumenDTO): string {
    return c.nombreCliente || '—';
  }
}