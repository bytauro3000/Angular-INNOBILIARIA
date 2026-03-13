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
import { CurrencyFormatterDirective } from '../../directives/currency-formatter';

@Component({
  selector: 'app-contrato-editar',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, RouterModule, FormsModule,
    FontAwesomeModule, VendedorInsertar, ClienteInsertarComponent,
    ProgramaInsetEdit, LotesInsertarEditar, CurrencyFormatterDirective
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

  @ViewChild('inputMontoTotal') inputMontoTotal!: ElementRef<HTMLInputElement>;
  @ViewChild('inputInicial') inputInicial!: ElementRef<HTMLInputElement>;

  // Estado UI
  saldoDisplay: string = '$ 0.00';
  isGuardando: boolean = false;
  isCargando: boolean = false;
  mostrarModalConfirmacion: boolean = false;

  // Datos calculados en tiempo real
  // Cuota = floor(saldo / letras) → montos enteros, la última letra absorbe el residuo
  get cuotaMensual(): number {
    const saldo = Number(this.contratoForm?.get('saldo')?.value) || 0;
    const letras = Number(this.contratoForm?.get('cantidadLetras')?.value) || 0;
    if (letras <= 0) return 0;
    return Math.floor(saldo / letras); // entero, sin decimales
  }

  get ultimaLetra(): number {
    const saldo = Number(this.contratoForm?.get('saldo')?.value) || 0;
    const letras = Number(this.contratoForm?.get('cantidadLetras')?.value) || 0;
    if (letras <= 0) return 0;
    const cuota = Math.floor(saldo / letras);
    return saldo - cuota * (letras - 1); // absorbe el residuo
  }

  get tieneResiduo(): boolean {
    return this.ultimaLetra !== this.cuotaMensual;
  }

  get montoTotalNum(): number { return Number(this.contratoForm?.get('montoTotal')?.value) || 0; }
  get inicialNum(): number { return Number(this.contratoForm?.get('inicial')?.value) || 0; }
  get saldoNum(): number { return Number(this.contratoForm?.get('saldo')?.value) || 0; }
  get cantidadLetrasNum(): number { return Number(this.contratoForm?.get('cantidadLetras')?.value) || 0; }
  get esFinanciado(): boolean { return this.contratoForm?.get('tipoContrato')?.value !== 'CONTADO'; }

  // Form data
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
    this.isCargando = true; // mostrar skeleton desde el primer instante
    this.initForm();
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
      montoTotal: [0, [Validators.required, Validators.min(1)]],
      inicial: [0],
      saldo: [{ value: 0, disabled: true }],
      cantidadLetras: [0, [Validators.min(0)]],
      observaciones: [''],
      idClientes: [[], Validators.required],
      idLotes: [[], Validators.required]
    });
  }

  public cargarCombos() {
    this.vendedorService.listarVendedores().subscribe(v => {
      this.vendedores = v;
      this.vendedoresFiltrados = [...v];

      this.programaService.listarProgramas().subscribe(p => {
        this.programas = p;
        this.programasFiltrados = [...p];

        if (this.contratoId) {
          this.cargarDatosContrato();
        }
      });
    });
  }

  private cargarDatosContrato() {
    this.isCargando = true;
    this.contratoService.obtenerContratoPorId(this.contratoId).subscribe({
      next: (res: any) => {
        this.contratoForm.patchValue({
          modalidadContrato: res.separacion ? 'SEPARACION' : 'DIRECTO',
          tipoContrato: res.tipoContrato,
          fechaContrato: res.fechaContrato ? new Date(res.fechaContrato).toISOString().split('T')[0] : '',
          montoTotal: res.montoTotal || 0,
          inicial: res.inicial || 0,
          cantidadLetras: res.cantidadLetras,
          observaciones: res.observaciones
        });

        // isCargando se pone en false más abajo, luego se formatea

        const idVend = res.vendedor?.idVendedor || res.idVendedor;
        const vendedorEncontrado = this.vendedores.find(v => v.idVendedor === idVend);
        if (vendedorEncontrado) this.seleccionarVendedor(vendedorEncontrado);

        if (res.lotes && res.lotes.length > 0) {
          const nombreProgContrato = res.lotes[0].nombrePrograma;
          const programaEncontrado = this.programas.find(p => p.nombrePrograma === nombreProgContrato);
          if (programaEncontrado) this.seleccionarPrograma(programaEncontrado);
        }

        this.clientesSeleccionados = (res.clientes || []).map((c: any) => ({ ...c } as Cliente));
        this.actualizarIdsClientes();

        this.lotesSeleccionados = (res.lotes || []).map((l: any) => ({
          ...l,
          programa: { nombrePrograma: l.nombrePrograma }
        } as Lote));
        this.actualizarIdsLotes();

        this.actualizarSaldo();
        this.isCargando = false;
      },
      error: () => {
        this.isCargando = false;
        this.toastr.error('Error al cargar datos del contrato');
      }
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
    this.filtroVendedor = `${v.nombre} ${v.apellidos}`;
    this.mostrarVendedores = false;
  }

  seleccionarPrograma(p: Programa) {
    if (p.idPrograma) {
      this.contratoForm.get('idPrograma')?.setValue(p.idPrograma);
      this.filtroPrograma = p.nombrePrograma;
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
    if (f.length < 2) {
      this.clientesFiltrados = [];
      this.mostrarClientes = true;
      return;
    }
    this.clienteService.buscarClientesPorFiltro(f, /^\d+$/.test(f) ? 'documento' : 'nombres').subscribe(data => {
      this.clientesFiltrados = data.filter(c => !this.clientesSeleccionados.some(sc => sc.idCliente === c.idCliente));
      this.mostrarClientes = true;
    });
  }

  seleccionarCliente(c: Cliente) {
    this.clientesSeleccionados.push(c);
    this.actualizarIdsClientes();
    this.filtroCliente = '';
    this.clientesFiltrados = this.clientesFiltrados.filter(x => x.idCliente !== c.idCliente);
    setTimeout(() => { this.mostrarClientes = false; }, 0);
  }

  eliminarCliente(id: number) {
    this.clientesSeleccionados = this.clientesSeleccionados.filter(c => c.idCliente !== id);
    this.actualizarIdsClientes();
  }

  private actualizarIdsClientes() {
    this.contratoForm.get('idClientes')?.setValue(this.clientesSeleccionados.map(c => c.idCliente));
  }

  filtrarLotes() {
    if (!this.contratoForm.get('idPrograma')?.value) {
      this.toastr.warning('Primero selecciona un programa', 'Atención');
      return;
    }
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
    this.calcularMontoTotalLotes();
    this.filtroLote = '';
    this.filtrarLotes();
    setTimeout(() => { this.mostrarLotes = false; }, 0);
  }

  eliminarLote(id?: number) {
    if (id === undefined) return;
    this.lotesSeleccionados = this.lotesSeleccionados.filter(l => l.idLote !== id);
    this.actualizarIdsLotes();
    this.calcularMontoTotalLotes();
    this.filtrarLotes();
  }

  private actualizarIdsLotes() {
    this.contratoForm.get('idLotes')?.setValue(this.lotesSeleccionados.map(l => l.idLote));
  }

  getLoteCosto(lote: Lote): number {
    const area = Number(lote.area) || 0;
    const precio = Number(lote.precioM2) || 0;
    return Math.round(area * precio);
  }

  private calcularMontoTotalLotes() {
    if (this.contratoForm.get('modalidadContrato')?.value !== 'DIRECTO') return;
    const total = this.lotesSeleccionados.reduce((acc, lote) => acc + this.getLoteCosto(lote), 0);
    this.contratoForm.get('montoTotal')?.setValue(total);
    this.actualizarSaldo();
  }

  actualizarSaldo() {
    // La directiva appCurrencyFormatter guarda el valor numérico en el formControl
    // pero usa emitEvent:false — así que leemos directo del control (ya tiene el número)
    const t = Number(this.contratoForm.get('montoTotal')?.value) || 0;
    const i = Number(this.contratoForm.get('inicial')?.value) || 0;
    const saldo = Math.max(0, t - i);
    this.contratoForm.get('saldo')?.setValue(saldo, { emitEvent: false });
    this.saldoDisplay = this.formatearMoneda(saldo);
  }

  formatearMoneda(valor: number): string {
    return '$ ' + new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(valor);
  }

  private handleFormChanges() {
    // Escuchar cambios en montoTotal e inicial para recalcular saldo
    // Nota: appCurrencyFormatter usa setValue({emitEvent:false}) al formatear visualmente
    // pero al terminar (blur) llama setValue con el número real SIN emitEvent:false
    // Por eso valueChanges captura el momento correcto
    this.contratoForm.get('montoTotal')?.valueChanges.subscribe(() => this.actualizarSaldo());
    this.contratoForm.get('inicial')?.valueChanges.subscribe(() => this.actualizarSaldo());
  }

  // Validación visual por campo
  campoInvalido(campo: string): boolean {
    const control = this.contratoForm.get(campo);
    return !!(control && control.invalid && control.touched);
  }

  // Confirmación antes de guardar
  solicitarConfirmacion() {
    if (this.contratoForm.invalid) {
      this.contratoForm.markAllAsTouched();
      this.toastr.warning('Por favor completa todos los campos requeridos', 'Formulario incompleto');
      return;
    }
    this.mostrarModalConfirmacion = true;
  }

  confirmarGuardado() {
    this.mostrarModalConfirmacion = false;
    this.isGuardando = true;
    const val = this.contratoForm.getRawValue();
    const request: ContratoRequestDTO = {
      fechaContrato: val.fechaContrato,
      tipoContrato: val.tipoContrato,
      montoTotal: Number(val.montoTotal) || 0,
      inicial: Number(val.inicial) || 0,
      saldo: Number(val.saldo) || 0,
      cantidadLetras: val.cantidadLetras,
      observaciones: val.observaciones,
      idVendedor: val.vendedorId,
      idClientes: val.idClientes,
      idLotes: val.idLotes
    };

    this.contratoService.actualizarContrato(this.contratoId, request).subscribe({
      next: () => {
        this.isGuardando = false;
        this.toastr.success('Contrato actualizado con éxito');
        this.router.navigate(['/secretaria-menu/contratos']);
      },
      error: (err) => {
        this.isGuardando = false;
        this.toastr.error(err.error?.message || 'Error al actualizar');
      }
    });
  }

  cancelarConfirmacion() {
    this.mostrarModalConfirmacion = false;
  }

  abrirModalVendedor() { this.vendedorModalContrato.abrirModal(); }
  abrirModalCliente() { this.registroModal.abrirModalCliente(); }
  abrirModalPrograma() { this.registroModalPrograma.abrirModal(); }
  abrirModalLote() { this.loteModalContrato.abrirModal(); }
}