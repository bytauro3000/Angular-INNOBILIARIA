import { Component, OnInit, ViewChild, ElementRef, HostListener, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faPlus } from '@fortawesome/free-solid-svg-icons';
import { Router, RouterModule } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
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

// Importa tus componentes de inserción rápida
import { ClienteInsertarComponent } from '../cliente-insertar/cliente-insertar.component';
import { VendedorInsertar } from '../vendedor-insertar/vendedor-insertar';
import { ProgramaInsetEdit } from '../programa-inset-edit/programa-inset-edit';

// Calendario Material
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule, MAT_DATE_LOCALE, DateAdapter } from '@angular/material/core';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-separacion-insert-edit',
  standalone: true,
  providers: [
    { provide: MAT_DATE_LOCALE, useValue: 'es-ES' } // Localización inicial
  ],
  imports: [
    CommonModule, FormsModule, ReactiveFormsModule, FontAwesomeModule, RouterModule,
    ClienteInsertarComponent, VendedorInsertar, ProgramaInsetEdit, 
    MatDatepickerModule, MatNativeDateModule, MatInputModule,
  ],
  templateUrl: './separacion-insert-edit.html',
  styleUrl: './separacion-insert-edit.scss'
})
export class SeparacionInsertEdit implements OnInit {
  @Output() operacionExitosa = new EventEmitter<void>();

  @ViewChild('clienteModal') clienteModal!: ClienteInsertarComponent;
  @ViewChild('vendedorModal') vendedorModal!: VendedorInsertar;
  @ViewChild('programaModal') programaModal!: ProgramaInsetEdit;

  @ViewChild('vendedorContainer') vendedorContainer!: ElementRef;
  @ViewChild('programaContainer') programaContainer!: ElementRef;
  @ViewChild('clienteContainer') clienteContainer!: ElementRef;
  @ViewChild('loteContainer') loteContainer!: ElementRef;

  isVisible = true;
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
    private separacionService: SeparacionService,
    private toastr: ToastrService,
    public router: Router,
    private _adapter: DateAdapter<any> // Inyectar adaptador para forzar idioma
  ) {
    this._adapter.setLocale('es-ES'); // Configurar español al construir
  }

  ngOnInit(): void {
    this._adapter.setLocale('es-ES'); // Reforzar español
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

  abrirModalCliente() { this.clienteModal.abrirModalCliente(); }
  abrirModalVendedor() { this.vendedorModal.abrirModal(); }
  abrirModalPrograma() { this.programaModal.abrirModal(); }

  filtrarClientes() {
    const f = this.filtroCliente.toLowerCase();
    this.clientesFiltrados = this.clientes.filter(c => 
      (`${c.nombre} ${c.apellidos}`.toLowerCase().includes(f) || c.numDoc.includes(f)) &&
      !this.separacion.clientes.some(sc => sc.cliente.idCliente === c.idCliente)
    );
    this.mostrarClientes = true;
  }

  seleccionarCliente(c: Cliente) {
    this.separacion.clientes.push({ cliente: c, tipoPropietario: TipoPropietario.TITULAR, id: {} as any, separacion: {} as any });
    this.filtroCliente = '';
    this.mostrarClientes = false;
  }

  filtrarVendedores() {
    const f = this.filtroVendedor.toLowerCase();
    this.vendedoresFiltrados = this.vendedores.filter(v => `${v.nombre} ${v.apellidos}`.toLowerCase().includes(f) || v.dni.includes(f));
    this.mostrarVendedores = true;
  }

  seleccionarVendedor(v: Vendedor) {
    this.separacion.vendedor = v;
    this.filtroVendedor = `${v.nombre} ${v.apellidos}`;
    this.mostrarVendedores = false;
  }

  filtrarProgramas() {
    const f = this.filtroPrograma.toLowerCase();
    this.programasFiltrados = this.programas.filter(p => p.nombrePrograma.toLowerCase().includes(f));
    this.mostrarProgramas = true;
  }

  seleccionarPrograma(p: Programa) {
    this.programaSeleccionado = p;
    this.filtroPrograma = p.nombrePrograma;
    this.mostrarProgramas = false;
    this.lotes = [];
    this.loteService.listarLotes().subscribe(data => {
      this.lotes = data.filter(l => l.programa?.idPrograma === p.idPrograma && l.estado?.toString().toUpperCase() === 'DISPONIBLE');
      this.lotesFiltrados = [...this.lotes];
    });
  }

  filtrarLotes() {
    const f = this.filtroLote.toLowerCase();
    this.lotesFiltrados = this.lotes.filter(l => 
      `manzana ${l.manzana} lote ${l.numeroLote}`.toLowerCase().includes(f) &&
      !this.separacion.lotes.some(sl => sl.lote.idLote === l.idLote)
    );
    this.mostrarLotes = true;
  }

  seleccionarLote(l: Lote) {
    this.separacion.lotes.push({ lote: l, id: {} as any, separacion: {} as any });
    this.filtroLote = '';
    this.mostrarLotes = false;
  }

  quitarCliente(id: number) { this.separacion.clientes = this.separacion.clientes.filter(sc => sc.cliente.idCliente !== id); }
  quitarLote(id: number) { this.separacion.lotes = this.separacion.lotes.filter(sl => sl.lote.idLote !== id); }

  guardar() {
    if (this.separacion.clientes.length === 0 || this.separacion.lotes.length === 0 || !this.separacion.vendedor) {
      this.toastr.warning('Complete todos los campos requeridos', 'Atención');
      return;
    }
    const op = this.isEditMode ? this.separacionService.actualizarSeparacion(this.separacion.idSeparacion!, this.separacion) : this.separacionService.crearSeparacion(this.separacion);
    op.subscribe({
      next: () => {
        this.toastr.success('Separación guardada correctamente');
        this.router.navigate(['/secretaria-menu/separaciones']);
      }
    });
  }
}