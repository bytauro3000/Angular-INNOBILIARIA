import { Component, OnInit, ViewChild, ElementRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faPlus } from '@fortawesome/free-solid-svg-icons';

import { ContratoService, ImpactoEdicionDTO } from '../../services/contrato.service';
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
import { ProgramaInsertEdit } from '../programa-insertar-editar/programa-inset-edit';
import { LotesInsertarEditar } from '../lotes-insertar-editar/lotes-insertar-editar';
import { CurrencyFormatterDirective } from '../../directives/currency-formatter';
import { Moneda } from '../../dto/moneda.enum';
import { TipoCambioService } from '../../services/tipo-cambio.service';

@Component({
  selector: 'app-contrato-editar',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, RouterModule, FormsModule,
    FontAwesomeModule, VendedorInsertar, ClienteInsertarComponent,
    ProgramaInsertEdit, LotesInsertarEditar, CurrencyFormatterDirective
  ],
  templateUrl: './contrato-editar.html',
  styleUrls: ['./contrato-editar.scss']
})
export class ContratoEditarComponent implements OnInit {
  @ViewChild('vendedorModalContrato') vendedorModalContrato!: VendedorInsertar;
  @ViewChild('registroModal') registroModal!: ClienteInsertarComponent;
  @ViewChild('registroModalPrograma') registroModalPrograma!: ProgramaInsertEdit;
  @ViewChild('loteModalContrato') loteModalContrato!: LotesInsertarEditar;

  @ViewChild('vendedorBusquedaContainer') vendedorBusquedaContainer!: ElementRef;
  @ViewChild('programaBusquedaContainer') programaBusquedaContainer!: ElementRef;
  @ViewChild('clienteBusquedaContainer') clienteBusquedaContainer!: ElementRef;
  @ViewChild('loteBusquedaContainer') loteBusquedaContainer!: ElementRef;

  @ViewChild('inputMontoTotal') inputMontoTotal!: ElementRef<HTMLInputElement>;
  @ViewChild('inputInicial') inputInicial!: ElementRef<HTMLInputElement>;

  // Estado UI
  saldoDisplay: string = '$ 0.00';
  tipoCambioEmpresa: number = 0;
  tipoCambioCompra: number = 0;

  // Valores base en USD
  montoTotalUSD: number = 0;
  inicialUSD: number = 0;
  monedaAnterior: Moneda = 'USD';

  isGuardando: boolean = false;
  isCargando: boolean = false;

  // Modales
  mostrarModalConfirmacion: boolean = false;     // modal normal de confirmar
  mostrarModalAdvertenciaLetras: boolean = false; // ✅ modal advertencia letras

  // ✅ Impacto de letras/pagos
  impactoEdicion: ImpactoEdicionDTO | null = null;

  get cuotaMensual(): number {
    const saldo = Number(this.contratoForm?.get('saldo')?.value) || 0;
    const letras = Number(this.contratoForm?.get('cantidadLetras')?.value) || 0;
    if (letras <= 0) return 0;
    return Math.floor(saldo / letras);
  }

  get ultimaLetra(): number {
    const saldo = Number(this.contratoForm?.get('saldo')?.value) || 0;
    const letras = Number(this.contratoForm?.get('cantidadLetras')?.value) || 0;
    if (letras <= 0) return 0;
    const cuota = Math.floor(saldo / letras);
    return saldo - cuota * (letras - 1);
  }

  get tieneResiduo(): boolean { return this.ultimaLetra !== this.cuotaMensual; }
  get montoTotalNum(): number { return Number(this.contratoForm?.get('montoTotal')?.value) || 0; }
  get inicialNum(): number { return Number(this.contratoForm?.get('inicial')?.value) || 0; }
  get saldoNum(): number { return Number(this.contratoForm?.get('saldo')?.value) || 0; }
  get cantidadLetrasNum(): number { return Number(this.contratoForm?.get('cantidadLetras')?.value) || 0; }
  get esFinanciado(): boolean { return this.contratoForm?.get('tipoContrato')?.value !== 'CONTADO'; }

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
    private toastr: ToastrService,
    private tipoCambioService: TipoCambioService
  ) {}

  ngOnInit(): void {
    this.isCargando = true;
    this.initForm();
    this.contratoId = Number(this.route.snapshot.paramMap.get('id'));
    this.cargarCombos();
    this.handleFormChanges();
    this.cargarTipoCambio();
    this.cargarImpactoEdicion();
  }

  cargarTipoCambio(): void {
    this.tipoCambioService.obtenerTipoCambio().subscribe({
      next: (tc) => { this.tipoCambioEmpresa = tc.empresa; this.tipoCambioCompra = tc.compra; },
      error: () => { this.tipoCambioEmpresa = 0; this.tipoCambioCompra = 0; }
    });
  }

  cargarImpactoEdicion(): void {
    if (!this.contratoId) return;
    this.contratoService.consultarImpactoEdicion(this.contratoId).subscribe({
      next: (impacto) => { this.impactoEdicion = impacto; },
      error: () => { this.impactoEdicion = null; }
    });
  }

  // ✅ Detecta si los campos financieros cambiaron respecto a los valores originales
  private afectaLetras(): boolean {
    if (!this.impactoEdicion?.tieneLetras) return false;
    // El backend hace la comparación real — desde el frontend solo nos interesa
    // saber si el usuario tocó algún campo financiero. Lo verificamos comparando
    // con los valores que se cargaron originalmente (guardados en montoTotalUSD e inicialUSD).
    return true; // si hay letras y el usuario está guardando, el backend decide si borrarlas
  }

  onMonedaChange(): void {
    const monedaNueva = this.contratoForm?.get('moneda')?.value as Moneda || 'USD';
    if (this.tipoCambioEmpresa === 0) {
      this.tipoCambioService.obtenerTipoCambio().subscribe({
        next: (tc) => { this.tipoCambioEmpresa = tc.empresa; this.tipoCambioCompra = tc.compra; this.aplicarConversion(monedaNueva); },
        error: () => this.aplicarConversion(monedaNueva)
      });
    } else {
      this.aplicarConversion(monedaNueva);
    }
  }

  private aplicarConversion(monedaNueva: Moneda): void {
    const tc = this.tipoCambioEmpresa;
    if (monedaNueva === 'PEN' && this.monedaAnterior === 'USD') {
      this.montoTotalUSD = this.montoTotalNum;
      this.inicialUSD    = this.inicialNum;
      this.contratoForm.get('montoTotal')?.setValue(tc > 0 ? Math.round(this.montoTotalUSD * tc) : this.montoTotalUSD, { emitEvent: false });
      this.contratoForm.get('inicial')?.setValue(tc > 0 ? Math.round(this.inicialUSD * tc) : this.inicialUSD, { emitEvent: false });
    } else if (monedaNueva === 'USD' && this.monedaAnterior === 'PEN') {
      const nuevoMonto   = tc > 0 ? Math.round(this.montoTotalNum / tc) : Math.round(this.montoTotalNum / 3.7);
      const nuevoInicial = tc > 0 ? Math.round(this.inicialNum / tc)    : Math.round(this.inicialNum / 3.7);
      this.montoTotalUSD = nuevoMonto;
      this.inicialUSD    = nuevoInicial;
      this.contratoForm.get('montoTotal')?.setValue(nuevoMonto,   { emitEvent: false });
      this.contratoForm.get('inicial')?.setValue(nuevoInicial,     { emitEvent: false });
    }
    this.monedaAnterior = monedaNueva;
    this.actualizarSaldo();
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
      idLotes: [[], Validators.required],
      moneda: ['USD', Validators.required]
    });
  }

  public cargarCombos() {
    this.vendedorService.listarVendedores().subscribe(v => {
      this.vendedores = v; this.vendedoresFiltrados = [...v];
      this.programaService.listarProgramas().subscribe(p => {
        this.programas = p; this.programasFiltrados = [...p];
        if (this.contratoId) this.cargarDatosContrato();
      });
    });
  }

  private cargarDatosContrato() {
    this.isCargando = true;
    this.contratoService.obtenerContratoPorId(this.contratoId).subscribe({
      next: (res: any) => {
        const monedaContrato: Moneda = res.moneda || 'USD';
        this.contratoForm.patchValue({
          modalidadContrato: res.separacion ? 'SEPARACION' : 'DIRECTO',
          tipoContrato: res.tipoContrato,
          fechaContrato: res.fechaContrato ? new Date(res.fechaContrato).toISOString().split('T')[0] : '',
          montoTotal: res.montoTotal || 0,
          inicial: res.inicial || 0,
          cantidadLetras: res.cantidadLetras,
          observaciones: res.observaciones,
          moneda: monedaContrato
        });
        if (monedaContrato === 'USD') {
          this.montoTotalUSD = res.montoTotal || 0;
          this.inicialUSD    = res.inicial || 0;
        } else {
          const tc = this.tipoCambioEmpresa || 3.7;
          this.montoTotalUSD = Math.round((res.montoTotal || 0) / tc);
          this.inicialUSD    = Math.round((res.inicial || 0) / tc);
        }
        this.monedaAnterior = monedaContrato;
        const idVend = res.vendedor?.idVendedor || res.idVendedor;
        const vendedorEncontrado = this.vendedores.find(v => v.idVendedor === idVend);
        if (vendedorEncontrado) this.seleccionarVendedor(vendedorEncontrado);
        if (res.lotes && res.lotes.length > 0) {
          const prog = this.programas.find(p => p.nombrePrograma === res.lotes[0].nombrePrograma);
          if (prog) this.seleccionarPrograma(prog);
        }
        this.clientesSeleccionados = (res.clientes || []).map((c: any) => ({ ...c } as Cliente));
        this.actualizarIdsClientes();
        this.lotesSeleccionados = (res.lotes || []).map((l: any) => ({ ...l, programa: { nombrePrograma: l.nombrePrograma } } as Lote));
        this.actualizarIdsLotes();
        this.actualizarSaldo();
        this.isCargando = false;
      },
      error: () => { this.isCargando = false; this.toastr.error('Error al cargar datos del contrato'); }
    });
  }

  @HostListener('document:click', ['$event'])
  onClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (this.vendedorBusquedaContainer && !this.vendedorBusquedaContainer.nativeElement.contains(target)) this.mostrarVendedores = false;
    if (this.programaBusquedaContainer && !this.programaBusquedaContainer.nativeElement.contains(target)) this.mostrarProgramas = false;
    if (this.clienteBusquedaContainer  && !this.clienteBusquedaContainer.nativeElement.contains(target))  this.mostrarClientes = false;
    if (this.loteBusquedaContainer     && !this.loteBusquedaContainer.nativeElement.contains(target))     this.mostrarLotes = false;
  }

  seleccionarVendedor(v: Vendedor) { this.contratoForm.get('vendedorId')?.setValue(v.idVendedor); this.filtroVendedor = `${v.nombre} ${v.apellidos}`; this.mostrarVendedores = false; }
  seleccionarPrograma(p: Programa) {
    if (p.idPrograma) { this.contratoForm.get('idPrograma')?.setValue(p.idPrograma); this.filtroPrograma = p.nombrePrograma; this.mostrarProgramas = false; this.loteService.listarLotesPorPrograma(p.idPrograma).subscribe(l => this.lotes = l || []); }
  }
  filtrarVendedores() { const f = this.filtroVendedor.toLowerCase(); this.vendedoresFiltrados = this.vendedores.filter(v => `${v.nombre} ${v.apellidos}`.toLowerCase().includes(f) || v.dni?.includes(f)); this.mostrarVendedores = true; }
  filtrarProgramas() { const f = this.filtroPrograma.toLowerCase(); this.programasFiltrados = this.programas.filter(p => p.nombrePrograma.toLowerCase().includes(f)); this.mostrarProgramas = true; }
  filtrarClientes() {
    const f = this.filtroCliente.trim();
    if (f.length < 2) { this.clientesFiltrados = []; this.mostrarClientes = true; return; }
    this.clienteService.buscarClientesPorFiltro(f, /^\d+$/.test(f) ? 'documento' : 'nombres').subscribe(data => { this.clientesFiltrados = data.filter(c => !this.clientesSeleccionados.some(sc => sc.idCliente === c.idCliente)); this.mostrarClientes = true; });
  }
  seleccionarCliente(c: Cliente) { this.clientesSeleccionados.push(c); this.actualizarIdsClientes(); this.filtroCliente = ''; this.clientesFiltrados = this.clientesFiltrados.filter(x => x.idCliente !== c.idCliente); setTimeout(() => { this.mostrarClientes = false; }, 0); }
  eliminarCliente(id: number) { this.clientesSeleccionados = this.clientesSeleccionados.filter(c => c.idCliente !== id); this.actualizarIdsClientes(); }
  private actualizarIdsClientes() { this.contratoForm.get('idClientes')?.setValue(this.clientesSeleccionados.map(c => c.idCliente)); }
  filtrarLotes() {
    if (!this.contratoForm.get('idPrograma')?.value) { this.toastr.warning('Primero selecciona un programa', 'Atención'); return; }
    const f = this.filtroLote.toLowerCase();
    this.lotesFiltrados = this.lotes.filter(l => !this.lotesSeleccionados.some(sl => sl.idLote === l.idLote) && `mz ${l.manzana} lt ${l.numeroLote}`.toLowerCase().includes(f));
    this.mostrarLotes = true;
  }
  seleccionarLote(l: Lote) { this.lotesSeleccionados.push(l); this.actualizarIdsLotes(); this.calcularMontoTotalLotes(); this.filtroLote = ''; this.filtrarLotes(); setTimeout(() => { this.mostrarLotes = false; }, 0); }
  eliminarLote(id?: number) { if (id === undefined) return; this.lotesSeleccionados = this.lotesSeleccionados.filter(l => l.idLote !== id); this.actualizarIdsLotes(); this.calcularMontoTotalLotes(); this.filtrarLotes(); }
  private actualizarIdsLotes() { this.contratoForm.get('idLotes')?.setValue(this.lotesSeleccionados.map(l => l.idLote)); }
  getLoteCostoUSD(lote: Lote): number { return Math.round((Number(lote.area) || 0) * (Number(lote.precioM2) || 0)); }
  getLoteCosto(lote: Lote): number { const costoUSD = this.getLoteCostoUSD(lote); const moneda = this.contratoForm?.get('moneda')?.value || 'USD'; return (moneda === 'PEN' && this.tipoCambioEmpresa > 0) ? Math.round(costoUSD * this.tipoCambioEmpresa) : costoUSD; }
  private calcularMontoTotalLotes() { if (this.contratoForm.get('modalidadContrato')?.value !== 'DIRECTO') return; this.contratoForm.get('montoTotal')?.setValue(this.lotesSeleccionados.reduce((acc, lote) => acc + this.getLoteCosto(lote), 0)); this.actualizarSaldo(); }
  actualizarSaldo() { const saldo = Math.max(0, (Number(this.contratoForm.get('montoTotal')?.value) || 0) - (Number(this.contratoForm.get('inicial')?.value) || 0)); this.contratoForm.get('saldo')?.setValue(saldo, { emitEvent: false }); this.saldoDisplay = this.formatearMoneda(saldo); }
  formatearMoneda(valor: number): string { const moneda = this.contratoForm?.get('moneda')?.value || 'USD'; return (moneda === 'PEN' ? 'S/ ' : '$ ') + new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(valor); }
  private handleFormChanges() { this.contratoForm.get('montoTotal')?.valueChanges.subscribe(() => this.actualizarSaldo()); this.contratoForm.get('inicial')?.valueChanges.subscribe(() => this.actualizarSaldo()); }
  campoInvalido(campo: string): boolean { const control = this.contratoForm.get(campo); return !!(control && control.invalid && control.touched); }

  // ✅ FLUJO DE GUARDADO:
  // 1. Valida el formulario
  // 2. Si hay letras → muestra modal de advertencia primero
  // 3. Si no hay letras → muestra modal de confirmación normal
  solicitarConfirmacion() {
    if (this.contratoForm.invalid) {
      this.contratoForm.markAllAsTouched();
      this.toastr.warning('Por favor completa todos los campos requeridos', 'Formulario incompleto');
      return;
    }
    if (this.impactoEdicion?.tieneLetras) {
      // Mostrar advertencia primero — el usuario decide si continúa
      this.mostrarModalAdvertenciaLetras = true;
    } else {
      // Sin letras — ir directo al modal de confirmación normal
      this.mostrarModalConfirmacion = true;
    }
  }

  // ✅ El usuario aceptó en el modal de advertencia → pasar al modal de confirmación normal
  aceptarAdvertenciaLetras() {
    this.mostrarModalAdvertenciaLetras = false;
    this.mostrarModalConfirmacion = true;
  }

  cancelarAdvertenciaLetras() {
    this.mostrarModalAdvertenciaLetras = false;
  }

  confirmarGuardado() {
    this.mostrarModalConfirmacion = false;
    this.isGuardando = true;
    const val = this.contratoForm.getRawValue();
    const request: ContratoRequestDTO = {
      fechaContrato:  val.fechaContrato,
      tipoContrato:   val.tipoContrato,
      montoTotal:     Number(val.montoTotal) || 0,
      inicial:        Number(val.inicial)    || 0,
      saldo:          Number(val.saldo)      || 0,
      cantidadLetras: val.cantidadLetras,
      observaciones:  val.observaciones,
      idVendedor:     val.vendedorId,
      idClientes:     val.idClientes,
      idLotes:        val.idLotes,
      moneda:         val.moneda || 'USD'
    };
    this.contratoService.actualizarContrato(this.contratoId, request).subscribe({
      next: () => { this.isGuardando = false; this.toastr.success('Contrato actualizado con éxito'); this.router.navigate(['/secretaria-menu/contratos']); },
      error: (err) => { this.isGuardando = false; this.toastr.error(err.error?.message || 'Error al actualizar'); }
    });
  }

  cancelarConfirmacion() { this.mostrarModalConfirmacion = false; }

  abrirModalVendedor() { this.vendedorModalContrato.abrirModal(); }
  abrirModalCliente()  { this.registroModal.abrirModalCliente(); }
  abrirModalPrograma() { this.registroModalPrograma.abrirModal(); }
  abrirModalLote()     { this.loteModalContrato.abrirModal(); }
}