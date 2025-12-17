import { Component, OnInit, ViewChild, ElementRef, HostListener, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faPlus } from '@fortawesome/free-solid-svg-icons';
import Swal from 'sweetalert2';

import { Separacion } from '../../models/separacion.model';
import { Cliente } from '../../models/cliente.model';
import { Lote } from '../../models/lote.model';
import { Programa } from '../../models/programa.model';
import { Vendedor } from '../../models/vendedor.model';
import { EstadoSeparacion } from '../../enums/estadoseparacion.enum';
import { TipoPropietario } from '../../enums/tipopropietario.enum';

import { ClienteService } from '../../services/cliente.service';
import { VendedorService } from '../../services/vendedor.service';
import { LoteService } from '../../services/lote.service';
import { ProgramaService } from '../../services/programa.service';
import { SeparacionService } from '../../services/separacion.service';

@Component({
  selector: 'app-separacion-insert-edit',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, FontAwesomeModule],
  templateUrl: './separacion-insert-edit.html',
  styleUrl: './separacion-insert-edit.scss'
})
export class SeparacionInsertEdit implements OnInit {
  @Output() operacionExitosa = new EventEmitter<void>();

  @ViewChild('vendedorContainer') vendedorContainer!: ElementRef;
  @ViewChild('programaContainer') programaContainer!: ElementRef;
  @ViewChild('clienteContainer') clienteContainer!: ElementRef;
  @ViewChild('loteContainer') loteContainer!: ElementRef;

  isVisible = false;
  isEditMode = false;
  faPlus = faPlus;

  clientes: Cliente[] = [];
  vendedores: Vendedor[] = [];
  programas: Programa[] = [];
  lotes: Lote[] = [];

  filtroCliente = ''; mostrarClientes = false; clientesFiltrados: Cliente[] = [];
  filtroVendedor = ''; mostrarVendedores = false; vendedoresFiltrados: Vendedor[] = [];
  filtroPrograma = ''; mostrarProgramas = false; programasFiltrados: Programa[] = [];
  filtroLote = ''; mostrarLotes = false; lotesFiltrados: Lote[] = [];

  separacion: Separacion = this.getEmptySeparacion();
  programaSeleccionado: Programa | null = null;

  constructor(
    private clienteService: ClienteService,
    private vendedorService: VendedorService,
    private loteService: LoteService,
    private programaService: ProgramaService,
    private separacionService: SeparacionService
  ) {}

  ngOnInit(): void {
    this.cargarDatosMaestros();
  }

  @HostListener('document:click', ['$event'])
  onClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (this.vendedorContainer && !this.vendedorContainer.nativeElement.contains(target)) this.mostrarVendedores = false;
    if (this.programaContainer && !this.programaContainer.nativeElement.contains(target)) this.mostrarProgramas = false;
    if (this.clienteContainer && !this.clienteContainer.nativeElement.contains(target)) this.mostrarClientes = false;
    if (this.loteContainer && !this.loteContainer.nativeElement.contains(target)) this.mostrarLotes = false;
  }

  cargarDatosMaestros() {
    this.clienteService.listarClientes().subscribe(v => { this.clientes = v; this.clientesFiltrados = [...v]; });
    this.vendedorService.listarVendedores().subscribe(v => { this.vendedores = v; this.vendedoresFiltrados = [...v]; });
    this.programaService.listarProgramas().subscribe(v => { this.programas = v; this.programasFiltrados = [...v]; });
  }

  private getEmptySeparacion(): Separacion {
    return {
      monto: 0,
      fechaSeparacion: new Date().toISOString().split('T')[0],
      fechaLimite: '',
      estado: EstadoSeparacion.EN_PROCESO,
      clientes: [],
      lotes: []
    };
  }

  abrirModal(item?: Separacion) {
    if (item) {
      this.isEditMode = true;
      this.separacion = { ...item };
      this.filtroVendedor = item.vendedor ? `${item.vendedor.nombre} ${item.vendedor.apellidos}` : '';
    } else {
      this.isEditMode = false;
      this.separacion = this.getEmptySeparacion();
      this.filtroVendedor = '';
      this.filtroPrograma = '';
    }
    this.isVisible = true;
  }

  cerrarModal() { this.isVisible = false; }

  filtrarClientes() {
    const f = this.filtroCliente.toLowerCase();
    this.clientesFiltrados = this.clientes.filter(c => 
      `${c.nombre} ${c.apellidos}`.toLowerCase().includes(f) || (c.numDoc && c.numDoc.includes(f))
    );
    this.mostrarClientes = true;
  }

  quitarCliente(id?: number) {
    this.separacion.clientes = this.separacion.clientes.filter(sc => sc.cliente.idCliente !== id);
  }

  filtrarVendedores() {
    const f = this.filtroVendedor.toLowerCase();
    this.vendedoresFiltrados = this.vendedores.filter(v => `${v.nombre} ${v.apellidos}`.toLowerCase().includes(f));
    this.mostrarVendedores = true;
  }

  seleccionarVendedor(v: Vendedor) {
    this.separacion.vendedor = v;
    this.filtroVendedor = `${v.nombre} ${v.apellidos}`;
    this.mostrarVendedores = false;
  }

  filtrarProgramas() {
    this.programasFiltrados = this.programas.filter(p => p.nombrePrograma.toLowerCase().includes(this.filtroPrograma.toLowerCase()));
    this.mostrarProgramas = true;
  }

  seleccionarPrograma(p: Programa) {
    this.programaSeleccionado = p;
    this.filtroPrograma = p.nombrePrograma;
    this.mostrarProgramas = false;
    this.lotes = [];
    this.lotesFiltrados = [];
    // Cambio Clave: Usar listarLotes() y filtrar por programa y estado
    this.loteService.listarLotes().subscribe(data => {
      this.lotes = data.filter(l => 
        l.programa?.idPrograma === p.idPrograma && 
        l.estado?.toString().toUpperCase() === 'DISPONIBLE'
      );
      this.lotesFiltrados = [...this.lotes];
    });
  }

  filtrarLotes() {
    const f = this.filtroLote.toLowerCase();
    this.lotesFiltrados = this.lotes.filter(l => 
      `manzana ${l.manzana} lote ${l.numeroLote}`.toLowerCase().includes(f)
    );
    this.mostrarLotes = true;
  }

  seleccionarCliente(c: Cliente) {
  if (!this.separacion.clientes.some(sc => sc.cliente.idCliente === c.idCliente)) {
    // Mantenemos el objeto completo 'c' para que el HTML pueda mostrar el nombre
    this.separacion.clientes.push({ 
      cliente: c, 
      tipoPropietario: TipoPropietario.TITULAR,
      id: {} as any, 
      separacion: {} as any
    });
  }
  this.filtroCliente = '';
  this.mostrarClientes = false;
}

seleccionarLote(l: Lote) {
  if (!this.separacion.lotes.some(sl => sl.lote.idLote === l.idLote)) {
    // Mantenemos el objeto completo 'l' para que el HTML muestre Mz y Lote
    this.separacion.lotes.push({ 
      lote: l, 
      id: {} as any, 
      separacion: {} as any 
    });
  }
  this.filtroLote = '';
  this.mostrarLotes = false;
}

  quitarLote(id?: number) {
    this.separacion.lotes = this.separacion.lotes.filter(sl => sl.lote.idLote !== id);
  }

  guardar() {
    if (this.separacion.clientes.length === 0 || this.separacion.lotes.length === 0 || !this.separacion.vendedor) {
      Swal.fire('Atención', 'Seleccione Vendedor, Clientes y Lotes', 'warning');
      return;
    }
    const op = this.isEditMode ? this.separacionService.actualizarSeparacion(this.separacion.idSeparacion!, this.separacion) : this.separacionService.crearSeparacion(this.separacion);
    op.subscribe({
      next: () => {
        Swal.fire('Éxito', 'Operación completada', 'success');
        this.operacionExitosa.emit();
        this.cerrarModal();
      }
    });
  }
}