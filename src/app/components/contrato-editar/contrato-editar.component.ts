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
  modalidadContratoValues = ['DIRECTO', 'SEPARACION'];
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
    this.contratoId = Number(this.route.snapshot.paramMap.get('id'));
    this.cargarCombos();
    this.handleFormChanges();
  }

  private initForm() {
    this.contratoForm = this.fb.group({
      modalidadContrato: ['DIRECTO', Validators.required],
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

  public cargarCombos() {
    // Usamos forkJoin o suscripciones anidadas para asegurar que la data esté lista
    this.vendedorService.listarVendedores().subscribe(v => {
      this.vendedores = v;
      this.vendedoresFiltrados = [...v];
      
      this.programaService.listarProgramas().subscribe(p => {
        this.programas = p;
        this.programasFiltrados = [...p];
        
        // 🔹 Solo cuando ambas listas están cargadas, buscamos los datos del contrato
        if (this.contratoId) {
          this.cargarDatosContrato();
        }
      });
    });
  }

  private cargarDatosContrato() {
    this.contratoService.obtenerContratoPorId(this.contratoId).subscribe({
      next: (res: any) => {
        // 1. Llenar campos básicos
        this.contratoForm.patchValue({
          modalidadContrato: res.separacion ? 'SEPARACION' : 'DIRECTO',
          tipoContrato: res.tipoContrato,
          fechaContrato: res.fechaContrato ? new Date(res.fechaContrato).toISOString().split('T')[0] : '',
          montoTotal: this.formatCurrency(res.montoTotal || 0),
          inicial: this.formatCurrency(res.inicial || 0),
          cantidadLetras: res.cantidadLetras,
          observaciones: res.observaciones
        });

        // 2. 🟢 MAPEO DE VENDEDOR (Solución al video)
        // Buscamos en la lista de vendedores el que coincida con el ID que viene del contrato
        const idVend = res.vendedor?.idVendedor || res.idVendedor;
        const vendedorEncontrado = this.vendedores.find(v => v.idVendedor === idVend);
        if (vendedorEncontrado) {
          this.seleccionarVendedor(vendedorEncontrado);
        }

        // 3. 🟢 MAPEO DE PROGRAMA (Solución al video)
        // El DTO de contrato suele traer los lotes, y de ahí sacamos el programa
        if (res.lotes && res.lotes.length > 0) {
          const nombreProgContrato = res.lotes[0].programaNombre;
          const programaEncontrado = this.programas.find(p => p.nombrePrograma === nombreProgContrato);
          if (programaEncontrado) {
            this.seleccionarPrograma(programaEncontrado);
          }
        }

        // 4. Mapear Listas de Clientes y Lotes
        this.clientesSeleccionados = (res.clientes || []).map((c: any) => ({ ...c } as Cliente));
        this.actualizarIdsClientes();

        this.lotesSeleccionados = (res.lotes || []).map((l: any) => ({
          ...l,
          programa: { nombrePrograma: l.programaNombre }
        } as Lote));
        this.actualizarIdsLotes();

        this.actualizarSaldo();
      },
      error: () => this.toastr.error('Error al cargar datos del contrato')
    });
  }

  @HostListener('document:click', ['$event'])
  onClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (this.vendedorBusquedaContainer && !this.vendedorBusquedaContainer.nativeElement.contains(target)) this.mostrarVendedores = false;
    if (this.programaBusquedaContainer && !this.programaBusquedaContainer.nativeElement.contains(target)) this.mostrarProgramas = false;
    if (this.clienteBusquedaContainer && !this.clienteBusquedaContainer.nativeElement.contains(target)) this.mostrarClientes = false;
    if (this.loteBusquedaContainer && !this.loteBusquedaContainer.nativeElement.contains(target)) this.mostrarLotes = false;
  }

  seleccionarVendedor(v: Vendedor) {
    this.contratoForm.get('vendedorId')?.setValue(v.idVendedor);
    this.filtroVendedor = `${v.nombre} ${v.apellidos}`; // 🔹 Esto llena el input vacío del video
    this.mostrarVendedores = false;
  }
  seleccionarPrograma(p: Programa) {
    if (p.idPrograma) {
      this.contratoForm.get('idPrograma')?.setValue(p.idPrograma);
      this.filtroPrograma = p.nombrePrograma; // 🔹 Esto llena el input vacío del video
      this.mostrarProgramas = false;
      this.loteService.listarLotesPorPrograma(p.idPrograma).subscribe(l => this.lotes = l || []);
    }
  }

  filtrarVendedores() {
    const f = this.filtroVendedor.toLowerCase();
    this.vendedoresFiltrados = this.vendedores.filter(v => 
      `${v.nombre} ${v.apellidos}`.toLowerCase().includes(f) || v.dni?.includes(f)
    );
    this.mostrarVendedores = true;
  }

  filtrarProgramas() {
    const f = this.filtroPrograma.toLowerCase();
    this.programasFiltrados = this.programas.filter(p => p.nombrePrograma.toLowerCase().includes(f));
    this.mostrarProgramas = true;
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
    if (id === undefined) return;
    this.lotesSeleccionados = this.lotesSeleccionados.filter(l => l.idLote !== id);
    this.actualizarIdsLotes();
  }

  private actualizarIdsLotes() {
    this.contratoForm.get('idLotes')?.setValue(this.lotesSeleccionados.map(l => l.idLote));
  }

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

  abrirModalVendedor() { this.vendedorModalContrato.abrirModal(); }
  abrirModalCliente() { this.registroModal.abrirModalCliente(); }
  abrirModalPrograma() { this.registroModalPrograma.abrirModal(); }
  abrirModalLote() { this.loteModalContrato.abrirModal(); }
}