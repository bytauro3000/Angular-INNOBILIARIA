import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ContratoService } from '../../services/contrato.service';
import { InscripcionServiciosInsertarComponent } from '../inscripcion-servicios-insertar/inscripcion-servicios-insertar.component';
import { ViewChild } from '@angular/core';
import { ToastrService } from 'ngx-toastr';

interface ContratoConServicios {
  idContrato: number;
  clientes: { nombre: string; apellidos: string; numDoc: string }[];
  lotes: { manzana: string; numeroLote: string }[];
  tieneLuz: boolean;
  tieneAgua: boolean;
}

@Component({
  selector: 'app-inscripcion-listar',
  standalone: true,
  imports: [CommonModule, FormsModule, InscripcionServiciosInsertarComponent],
  templateUrl: './inscripcion-listar.html',
  styleUrls: ['./inscripcion-listar.scss']
})
export class InscripcionListarComponent implements OnInit {

  @ViewChild('modalInscripcion') modalInscripcion!: InscripcionServiciosInsertarComponent;

  contratos: ContratoConServicios[] = [];
  contratosFiltrados: ContratoConServicios[] = [];
  terminoBusqueda: string = '';
  filtroServicio: 'TODOS' | 'SIN_SERVICIO' | 'PARCIAL' | 'COMPLETO' = 'TODOS';
  isCargando: boolean = false;

  constructor(
    private contratoService: ContratoService,
    private toastr: ToastrService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.cargarContratos();
  }

  cargarContratos(): void {
    this.isCargando = true;
    this.contratoService.listarContrato().subscribe({
      next: (data: any[]) => {
        this.contratos = data.map(c => ({
          idContrato: c.idContrato,
          clientes: c.clientes ?? [],
          lotes: c.lotes ?? [],
          tieneLuz: !!c.tieneLuz,
          tieneAgua: !!c.tieneAgua
        }));
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
        c.clientes.some(cl => `${cl.nombre} ${cl.apellidos}`.toLowerCase().includes(t))
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

  getEstadoServicio(c: ContratoConServicios): 'completo' | 'parcial' | 'ninguno' {
    if (c.tieneLuz && c.tieneAgua) return 'completo';
    if (c.tieneLuz || c.tieneAgua) return 'parcial';
    return 'ninguno';
  }

  getLotesTexto(c: ContratoConServicios): string {
    return c.lotes.map(l => `Mz. ${l.manzana} - Lt. ${l.numeroLote}`).join(', ') || '—';
  }

  getClientesTexto(c: ContratoConServicios): string {
    return c.clientes.map(cl => `${cl.nombre} ${cl.apellidos}`).join(' / ') || '—';
  }
}