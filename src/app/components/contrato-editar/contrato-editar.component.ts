import { Component, OnInit, ViewChild, ElementRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faPlus } from '@fortawesome/free-solid-svg-icons';

import { ContratoService } from '../../services/contrato.service';
import { ProgramaService } from '../../services/programa.service';
import { VendedorService } from '../../services/vendedor.service';
import { ClienteService } from '../../services/cliente.service';
import { LoteService } from '../../services/lote.service';

import { Cliente } from '../../models/cliente.model';
import { Lote } from '../../models/lote.model';
import { Programa } from '../../models/programa.model';
import { Vendedor } from '../../models/vendedor.model';
import { ContratoRequestDTO } from '../../dto/contratorequest.dto';

import { VendedorInsertar } from '../vendedor-insertar/vendedor-insertar';
import { ClienteInsertarComponent } from '../cliente-insertar/cliente-insertar.component';
import { ProgramaInsetEdit } from '../programa-inset-edit/programa-inset-edit';
import { LotesInsertarEditar } from '../lotes-insertar-editar/lotes-insertar-editar';

@Component({
  selector: 'app-contrato-editar',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, RouterModule, FormsModule, 
    FontAwesomeModule, VendedorInsertar, ClienteInsertarComponent, 
    ProgramaInsetEdit, LotesInsertarEditar
  ],
  templateUrl: './contrato-editar.html',
  styleUrls: ['./contrato-editar.scss']
})
export class ContratoEditarComponent implements OnInit {
  @ViewChild('vendedorModalContrato') vendedorModalContrato!: VendedorInsertar;
  @ViewChild('registroModal') registroModal!: ClienteInsertarComponent;
  @ViewChild('registroModalPrograma') registroModalPrograma!: ProgramaInsetEdit;
  @ViewChild('loteModalContrato') loteModalContrato!: LotesInsertarEditar;

  @ViewChild('vendedorBusquedaContainer') vendedorBusquedaContainer!: ElementRef;
  @ViewChild('programaBusquedaContainer') programaBusquedaContainer!: ElementRef;
  @ViewChild('clienteBusquedaContainer') clienteBusquedaContainer!: ElementRef;
  @ViewChild('loteBusquedaContainer') loteBusquedaContainer!: ElementRef;

  contratoForm!: FormGroup;
  contratoId!: number;
  
  programas: Programa[] = [];
  lotes: Lote[] = [];
  vendedores: Vendedor[] = [];
  clientesSeleccionados: Cliente[] = [];
  lotesSeleccionados: Lote[] = [];

  vendedoresFiltrados: Vendedor[] = [];
  filtroVendedor: string = '';
  mostrarVendedores: boolean = false;

  programasFiltrados: Programa[] = [];
  filtroPrograma: string = '';
  mostrarProgramas: boolean = false;

  clientesFiltrados: Cliente[] = [];
  filtroCliente: string = '';
  mostrarClientes: boolean = false;

  lotesFiltrados: Lote[] = [];
  filtroLote: string = '';
  mostrarLotes: boolean = false;

  faPlus = faPlus;
  tipoContratoValues = ['CONTADO', 'FINANCIADO'];

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    public router: Router,
    private contratoService: ContratoService,
    private programaService: ProgramaService,
    private vendedorService: VendedorService,
    private clienteService: ClienteService,
    private loteService: LoteService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.cargarCombos();
    
    // Capturar ID de la URL y cargar datos
    this.contratoId = Number(this.route.snapshot.paramMap.get('id'));
    if (this.contratoId) {
      this.cargarDatosContrato();
    }
    
    this.handleFormChanges();
  }

  private initForm() {
    this.contratoForm = this.fb.group({
      tipoContrato: ['FINANCIADO', Validators.required],
      fechaContrato: ['', Validators.required],
      vendedorId: [null, Validators.required],
      idPrograma: [null, Validators.required],
      montoTotal: [this.formatCurrency(0), [Validators.required]],
      inicial: [this.formatCurrency(0)],
      saldo: [{ value: this.formatCurrency(0), disabled: true }],
      cantidadLetras: [0, [Validators.min(0)]],
      observaciones: [''],
      idClientes: [[], Validators.required],
      idLotes: [[], Validators.required]
    });
  }

  private cargarDatosContrato() {
  this.contratoService.obtenerContratoPorId(this.contratoId).subscribe({
    next: (res: any) => {
      // 1. Mapear valores básicos al formulario
      this.contratoForm.patchValue({
        tipoContrato: res.tipoContrato,
        fechaContrato: res.fechaContrato ? new Date(res.fechaContrato).toISOString().split('T')[0] : '',
        montoTotal: this.formatCurrency(res.montoTotal || 0),
        inicial: this.formatCurrency(res.inicial || 0),
        cantidadLetras: res.cantidadLetras,
        observaciones: res.observaciones
      });

      // 2. Mapear Clientes (Solución al error de propiedades faltantes)
      // Forzamos el mapeo para asegurar que cumplan con la interfaz Cliente
      this.clientesSeleccionados = (res.clientes || []).map((c: any) => ({
        ...c,
        estadoCivil: c.estadoCivil || null,
        tipoCliente: c.tipoCliente || 'NATURAL',
        estado: c.estado || 'ACTIVO'
      } as Cliente));
      this.actualizarIdsClientes();

      // 3. Mapear Lotes (Solución al error 'programaNombre')
      this.lotesSeleccionados = (res.lotes || []).map((l: any) => ({
        ...l,
        // Convertimos la propiedad plana del DTO al objeto que espera el modelo
        programa: l.programa || { nombrePrograma: l.programaNombre }
      } as Lote));
      this.actualizarIdsLotes();
      
      // 4. Cargar Programa en el selector visual
      if (this.lotesSeleccionados.length > 0) {
        const nombreProg = (res.lotes[0] as any).programaNombre;
        this.programaService.listarProgramas().subscribe(progs => {
           const progEncontrado = progs.find(p => p.nombrePrograma === nombreProg);
           if (progEncontrado) {
             this.seleccionarPrograma(progEncontrado);
           }
        });
      }

      this.actualizarSaldo();
    },
    error: () => this.toastr.error('Error al cargar datos del contrato')
  });
}
  // --- LÓGICA DE BÚSQUEDA Y SELECCIÓN (Igual a Insertar) ---
  @HostListener('document:click', ['$event'])
  onClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (this.vendedorBusquedaContainer && !this.vendedorBusquedaContainer.nativeElement.contains(target)) this.mostrarVendedores = false;
    if (this.programaBusquedaContainer && !this.programaBusquedaContainer.nativeElement.contains(target)) this.mostrarProgramas = false;
    if (this.clienteBusquedaContainer && !this.clienteBusquedaContainer.nativeElement.contains(target)) this.mostrarClientes = false;
    if (this.loteBusquedaContainer && !this.loteBusquedaContainer.nativeElement.contains(target)) this.mostrarLotes = false;
  }

  cargarCombos() {
    this.vendedorService.listarVendedores().subscribe(v => this.vendedores = v);
    this.programaService.listarProgramas().subscribe(p => this.programas = p);
  }

  filtrarVendedores() {
    const f = this.filtroVendedor.toLowerCase();
    this.vendedoresFiltrados = this.vendedores.filter(v => 
      `${v.nombre} ${v.apellidos}`.toLowerCase().includes(f) || v.dni?.includes(f)
    );
    this.mostrarVendedores = true;
  }

  seleccionarVendedor(v: Vendedor) {
    this.contratoForm.get('vendedorId')?.setValue(v.idVendedor);
    this.filtroVendedor = `${v.nombre} ${v.apellidos}`;
    this.mostrarVendedores = false;
  }

 seleccionarPrograma(p: Programa) {
  // 🔹 Verificamos que idPrograma exista para evitar el error de 'undefined'
  if (p.idPrograma !== undefined && p.idPrograma !== null) {
    this.contratoForm.get('idPrograma')?.setValue(p.idPrograma);
    this.filtroPrograma = p.nombrePrograma;
    this.mostrarProgramas = false;
    
    // Ahora TypeScript sabe que p.idPrograma es un number seguro
    this.loteService.listarLotesPorPrograma(p.idPrograma).subscribe({
      next: (l) => this.lotes = l || [],
      error: (err) => console.error('Error al cargar lotes del programa', err)
    });
  } else {
    this.toastr.warning('El programa seleccionado no tiene un ID válido.');
  }
}

  filtrarClientes() {
    const f = this.filtroCliente.trim();
    if (f.length < 2) return;
    this.clienteService.buscarClientesPorFiltro(f, /^\d+$/.test(f) ? 'documento' : 'nombres').subscribe(data => {
      this.clientesFiltrados = data.filter(c => !this.clientesSeleccionados.some(sc => sc.idCliente === c.idCliente));
      this.mostrarClientes = true;
    });
  }

  seleccionarCliente(c: Cliente) {
    this.clientesSeleccionados.push(c);
    this.actualizarIdsClientes();
    this.filtroCliente = '';
    this.mostrarClientes = false;
  }

  eliminarCliente(id: number) {
    this.clientesSeleccionados = this.clientesSeleccionados.filter(c => c.idCliente !== id);
    this.actualizarIdsClientes();
  }

  private actualizarIdsClientes() {
    this.contratoForm.get('idClientes')?.setValue(this.clientesSeleccionados.map(c => c.idCliente));
  }

  filtrarLotes() {
    const f = this.filtroLote.toLowerCase();
    this.lotesFiltrados = this.lotes.filter(l => 
      !this.lotesSeleccionados.some(sl => sl.idLote === l.idLote) && 
      `mz ${l.manzana} lt ${l.numeroLote}`.toLowerCase().includes(f)
    );
    this.mostrarLotes = true;
  }

  seleccionarLote(l: Lote) {
    this.lotesSeleccionados.push(l);
    this.actualizarIdsLotes();
    this.filtroLote = '';
    this.mostrarLotes = false;
  }

  eliminarLote(id?: number) {
    this.lotesSeleccionados = this.lotesSeleccionados.filter(l => l.idLote !== id);
    this.actualizarIdsLotes();
  }

  private actualizarIdsLotes() {
    this.contratoForm.get('idLotes')?.setValue(this.lotesSeleccionados.map(l => l.idLote));
  }

  // --- UTILIDADES ---
  actualizarSaldo() {
    const t = this.extractNumericValue(this.contratoForm.get('montoTotal')?.value);
    const i = this.extractNumericValue(this.contratoForm.get('inicial')?.value);
    this.contratoForm.get('saldo')?.setValue(this.formatCurrency(Math.max(0, t - i)));
  }

  private handleFormChanges() {
    this.contratoForm.get('montoTotal')?.valueChanges.subscribe(() => this.actualizarSaldo());
    this.contratoForm.get('inicial')?.valueChanges.subscribe(() => this.actualizarSaldo());
  }

  formatCurrency(v: number) { return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(v); }
  extractNumericValue(v: any) { return v ? parseFloat(v.toString().replace(/[^\d.-]/g, "")) || 0 : 0; }

  onCurrencyInput(event: Event, control: string) {
    const val = this.extractNumericValue((event.target as HTMLInputElement).value);
    this.contratoForm.get(control)?.setValue(this.formatCurrency(val), { emitEvent: false });
    this.actualizarSaldo();
  }

  // --- ACCIÓN FINAL ---
  guardarCambios() {
    if (this.contratoForm.invalid) return;

    const val = this.contratoForm.getRawValue();
    const request: ContratoRequestDTO = {
      fechaContrato: val.fechaContrato,
      tipoContrato: val.tipoContrato,
      montoTotal: this.extractNumericValue(val.montoTotal),
      inicial: this.extractNumericValue(val.inicial),
      saldo: this.extractNumericValue(val.saldo),
      cantidadLetras: val.cantidadLetras,
      observaciones: val.observaciones,
      idVendedor: val.vendedorId,
      idClientes: val.idClientes,
      idLotes: val.idLotes
    };

    this.contratoService.actualizarContrato(this.contratoId, request).subscribe({
      next: () => {
        this.toastr.success('Contrato actualizado con éxito');
        this.router.navigate(['/secretaria-menu/contratos']);
      },
      error: (err) => this.toastr.error(err.error || 'Error al actualizar')
    });
  }

  // Modales
  abrirModalVendedor() { this.vendedorModalContrato.abrirModal(); }
  abrirModalCliente() { this.registroModal.abrirModalCliente(); }
  abrirModalPrograma() { this.registroModalPrograma.abrirModal(); }
  abrirModalLote() { this.loteModalContrato.abrirModal(); }
}