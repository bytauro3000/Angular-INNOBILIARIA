import { Component, OnInit, ViewChild, ElementRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { ContratoService } from '../../services/contrato.service';
import { ProgramaService } from '../../services/programa.service';
import { VendedorService } from '../../services/vendedor.service';
import { SeparacionService } from '../../services/separacion.service';
import { ClienteService } from '../../services/cliente.service';
import { LoteService } from '../../services/lote.service';
import { Cliente } from '../../models/cliente.model';
import { Lote } from '../../models/lote.model';
import { Programa } from '../../models/programa.model';
import { Vendedor } from '../../models/vendedor.model';
import { SeparacionDTO } from '../../dto/separacion.dto';
import { ContratoRequestDTO } from '../../dto/contratorequest.dto';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { faPlus } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { VendedorInsertar } from '../vendedor-insertar/vendedor-insertar';
import { ClienteInsertarComponent } from '../cliente-insertar/cliente-insertar.component';
import { ProgramaInsertEdit } from '../programa-insertar-editar/programa-inset-edit';
import { LotesInsertarEditar } from '../lotes-insertar-editar/lotes-insertar-editar';
import { CurrencyFormatterDirective } from '../../directives/currency-formatter';
import { Moneda } from '../../dto/moneda.enum';
import { TipoCambioService } from '../../services/tipo-cambio.service';

@Component({
  selector: 'app-contrato-insertar',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, RouterModule, FormsModule,
    FontAwesomeModule, VendedorInsertar, ClienteInsertarComponent,
    ProgramaInsertEdit, LotesInsertarEditar, CurrencyFormatterDirective
  ],
  templateUrl: './contrato-insertar.html',
  styleUrls: ['./contrato-insertar.scss'],
})
export class ContratoInsertarComponent implements OnInit {
  @ViewChild('vendedorModalContrato') vendedorModalContrato!: VendedorInsertar;
  @ViewChild('registroModal') registroModal!: ClienteInsertarComponent;
  @ViewChild('registroModalPrograma') registroModalPrograma!: ProgramaInsertEdit;
  @ViewChild('loteModalContrato') loteModalContrato!: LotesInsertarEditar;

  @ViewChild('vendedorBusquedaContainer') vendedorBusquedaContainer!: ElementRef;
  @ViewChild('programaBusquedaContainer') programaBusquedaContainer!: ElementRef;
  @ViewChild('clienteBusquedaContainer') clienteBusquedaContainer!: ElementRef;
  @ViewChild('loteBusquedaContainer') loteBusquedaContainer!: ElementRef;

  contratoForm!: FormGroup;
  programas: Programa[] = [];
  lotes: Lote[] = [];
  vendedores: Vendedor[] = [];
  clientes: Cliente[] = [];
  separaciones: SeparacionDTO[] = [];
  clientesSeleccionados: Cliente[] = [];
  lotesSeleccionados: Lote[] = [];

  modalidadContratoValues = ['DIRECTO', 'SEPARACION'];
  tipoContratoValues = ['CONTADO', 'FINANCIADO'];
  terminoBusquedaSeparacion: string = '';
  showSeparacionList: boolean = false;
  faPlus = faPlus;
  isGuardando: boolean = false;
  mostrarModalConfirmacion: boolean = false;
  saldoDisplay: string = '$ 0.00';
  monedaSeleccionada: Moneda = 'USD';
  tipoCambioEmpresa: number = 0;
  tipoCambioCompra: number = 0;

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

  get esDirecto(): boolean { return this.contratoForm?.get('modalidadContrato')?.value === 'DIRECTO'; }
  get esFinanciado(): boolean { return this.contratoForm?.get('tipoContrato')?.value !== 'CONTADO'; }
  get montoTotalNum(): number { return Number(this.contratoForm?.get('montoTotal')?.value) || 0; }
  get inicialNum(): number { return Number(this.contratoForm?.get('inicial')?.value) || 0; }
  get saldoNum(): number { return Number(this.contratoForm?.get('saldo')?.value) || 0; }
  get cantidadLetrasNum(): number { return Number(this.contratoForm?.get('cantidadLetras')?.value) || 0; }

  get cuotaMensual(): number {
    const s = this.saldoNum, l = this.cantidadLetrasNum;
    return l > 0 ? Math.floor(s / l) : 0;
  }
  get ultimaLetra(): number {
    const s = this.saldoNum, l = this.cantidadLetrasNum;
    if (l <= 0) return 0;
    return s - Math.floor(s / l) * (l - 1);
  }
  get tieneResiduo(): boolean { return this.ultimaLetra !== this.cuotaMensual; }

  // Flag para mostrar banner de transferencia en el formulario
  esTransferencia = false;
  idContratoOrigen: number | null = null;

  constructor(
    private fb: FormBuilder,
    private contratoService: ContratoService,
    private programaService: ProgramaService,
    private vendedorService: VendedorService,
    private clienteService: ClienteService,
    private separacionService: SeparacionService,
    private loteService: LoteService,
    public router: Router,
    private route: ActivatedRoute,
    private toastr: ToastrService,
    private tipoCambioService: TipoCambioService
  ) {}

  @HostListener('document:click', ['$event'])
  onClick(event: MouseEvent): void {
    const t = event.target as HTMLElement;
    if (this.vendedorBusquedaContainer && !this.vendedorBusquedaContainer.nativeElement.contains(t)) this.mostrarVendedores = false;
    if (this.programaBusquedaContainer && !this.programaBusquedaContainer.nativeElement.contains(t)) this.mostrarProgramas = false;
    if (this.clienteBusquedaContainer && !this.clienteBusquedaContainer.nativeElement.contains(t)) this.mostrarClientes = false;
    if (this.loteBusquedaContainer && !this.loteBusquedaContainer.nativeElement.contains(t)) this.mostrarLotes = false;
  }

  ngOnInit(): void {
    this.initForm();
    this.cargarCombos();
    this.handleFormChanges();
    this.cargarDatosTransferencia();
    this.cargarTipoCambio();
  }

  cargarTipoCambio(): void {
    this.tipoCambioService.obtenerTipoCambio().subscribe({
      next: (tc) => { this.tipoCambioEmpresa = tc.empresa; this.tipoCambioCompra = tc.compra; },
      error: () => { this.tipoCambioEmpresa = 0; this.tipoCambioCompra = 0; }
    });
  }

  onMonedaChange(): void {
    // Recalcular el monto total de los lotes según la nueva moneda
    this.calcularMontoTotalLotes();
    this.saldoDisplay = this.formatearMoneda(this.saldoNum);
  }

  /**
   * Si venimos de una transferencia, pre-llena los campos con los datos calculados.
   */
  private cargarDatosTransferencia(): void {
    this.route.queryParams.subscribe(params => {
      if (params['transferencia'] !== '1') return;

      this.esTransferencia = true;
      this.idContratoOrigen = +params['idContratoOrigen'];

      // Pre-llenar montos
      const montoTotal    = +params['montoTotal'];
      const inicial       = +params['inicial'];
      const saldo         = +params['saldo'];
      const cantidadLetras = +params['cantidadLetras'];

      this.contratoForm.patchValue({
        tipoContrato:    'FINANCIADO',
        montoTotal:      montoTotal,
        inicial:         inicial,
        cantidadLetras:  cantidadLetras
      });

      // Forzar saldo (campo disabled no lo recibe con patchValue)
      this.contratoForm.get('saldo')?.setValue(saldo, { emitEvent: false });
      this.saldoDisplay = this.formatearMoneda(saldo);

      // Pre-seleccionar vendedor
      if (params['idVendedor']) {
        const idVendedor = +params['idVendedor'];
        this.vendedorService.listarVendedores().subscribe(vendedores => {
          const v = vendedores.find((v: any) => v.idVendedor === idVendedor);
          if (v) {
            this.contratoForm.get('vendedorId')?.setValue(v.idVendedor);
            this.filtroVendedor = `${v.nombre} ${v.apellidos}`;
          }
        });
      }

      // Pre-seleccionar lotes
      if (params['idLotes']) {
        const ids: number[] = params['idLotes'].split(',').map(Number);
        ids.forEach(idLote => {
          this.loteService.obtenerLotePorId(idLote).subscribe({
            next: (lote: any) => {
              if (lote && !this.lotesSeleccionados.some(l => l.idLote === lote.idLote)) {
                this.lotesSeleccionados.push(lote);
                this.actualizarIdsLotes();
                // Pre-llenar programa desde el primer lote
                if (this.lotesSeleccionados.length === 1 && lote.programa) {
                  this.contratoForm.get('idPrograma')?.setValue(lote.programa.idPrograma);
                  this.filtroPrograma = lote.programa.nombrePrograma;
                }
              }
            }
          });
        });
      }

      this.toastr.info(
        `Formulario pre-llenado desde contrato #${this.idContratoOrigen}. Asigne el nuevo cliente.`,
        'Transferencia'
      );
    });
  }

  private initForm() {
    this.contratoForm = this.fb.group({
      modalidadContrato: ['DIRECTO', Validators.required],
      tipoContrato: ['FINANCIADO', Validators.required],
      fechaContrato: [new Date().toISOString().split('T')[0], Validators.required],
      vendedorId: [null, Validators.required],
      idPrograma: [null, Validators.required],
      idSeparacion: [null],
      montoTotal: [0, [Validators.required, Validators.min(1)]],
      inicial: [0],
      saldo: [{ value: 0, disabled: true }],
      cantidadLetras: [null, [Validators.min(0)]],
      observaciones: [''],
      idClientes: [[], Validators.required],
      idLotes: [[], Validators.required],
      moneda: ['USD', Validators.required]
    });
  }

  private cargarCombos() {
    this.programaService.listarProgramas().subscribe(p => { this.programas = p; this.programasFiltrados = [...p]; });
    this.vendedorService.listarVendedores().subscribe(v => { this.vendedores = v; this.vendedoresFiltrados = [...v]; });
  }

  private handleFormChanges() {
    this.contratoForm.get('montoTotal')?.valueChanges.subscribe(() => this.actualizarSaldo());
    this.contratoForm.get('inicial')?.valueChanges.subscribe(() => this.actualizarSaldo());

    this.contratoForm.get('tipoContrato')?.valueChanges.subscribe(tipo => {
      if (tipo === 'CONTADO') {
        this.contratoForm.get('inicial')?.setValue(this.montoTotalNum, { emitEvent: false });
        this.contratoForm.get('cantidadLetras')?.setValue(0, { emitEvent: false });
        this.actualizarSaldo();
      }
      this.actualizarObservacion();
    });

    this.contratoForm.get('modalidadContrato')?.valueChanges.subscribe(modo => {
      const esSep = modo === 'SEPARACION';
      ['vendedorId', 'idPrograma', 'idClientes', 'idLotes'].forEach(f => {
        esSep ? this.contratoForm.get(f)?.clearValidators() : this.contratoForm.get(f)?.setValidators(Validators.required);
        this.contratoForm.get(f)?.updateValueAndValidity({ emitEvent: false });
      });
      if (esSep) {
        this.clientesSeleccionados = []; this.lotesSeleccionados = [];
        this.actualizarIdsClientes(); this.actualizarIdsLotes();
      } else {
        this.calcularMontoTotalLotes();
      }
    });

    this.contratoForm.get('idPrograma')?.valueChanges.subscribe(id => {
      if (!id) { this.lotes = []; this.lotesFiltrados = []; return; }
      this.loteService.listarLotesPorPrograma(id).subscribe(l => { this.lotes = l || []; this.lotesFiltrados = [...this.lotes]; });
    });
  }

  actualizarSaldo() {
    const saldo = Math.max(0, this.montoTotalNum - this.inicialNum);
    this.contratoForm.get('saldo')?.setValue(saldo, { emitEvent: false });
    this.saldoDisplay = this.formatearMoneda(saldo);
  }

  formatearMoneda(v: number): string {
    const moneda = this.contratoForm?.get('moneda')?.value || this.monedaSeleccionada;
    const simbolo = moneda === 'PEN' ? 'S/ ' : '$ ';
    return simbolo + new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v);
  }

  getLoteCostoUSD(lote: Lote): number {
    // Precio base siempre en USD (area * precioM2)
    return Math.round((Number(lote.area) || 0) * (Number(lote.precioM2) || 0));
  }

  getLoteCosto(lote: Lote): number {
    const costoUSD = this.getLoteCostoUSD(lote);
    const moneda = this.contratoForm?.get('moneda')?.value || 'USD';
    if (moneda === 'PEN' && this.tipoCambioEmpresa > 0) {
      // Convertir a soles y redondear al entero más cercano
      return Math.round(costoUSD * this.tipoCambioEmpresa);
    }
    return costoUSD;
  }

  private calcularMontoTotalLotes() {
    if (!this.esDirecto) return;
    const total = this.lotesSeleccionados.reduce((a, l) => a + this.getLoteCosto(l), 0);
    this.contratoForm.get('montoTotal')?.setValue(total);
    this.actualizarSaldo();
  }

  campoInvalido(campo: string): boolean {
    const c = this.contratoForm.get(campo);
    return !!(c && c.invalid && c.touched);
  }

  filtrarVendedores() {
    const f = this.filtroVendedor.toLowerCase();
    this.vendedoresFiltrados = this.vendedores.filter(v => `${v.nombre} ${v.apellidos}`.toLowerCase().includes(f) || v.dni?.includes(f));
    this.mostrarVendedores = true;
  }
  seleccionarVendedor(v: Vendedor) {
    this.contratoForm.get('vendedorId')?.setValue(v.idVendedor);
    this.filtroVendedor = `${v.nombre} ${v.apellidos}`;
    this.mostrarVendedores = false;
  }

  filtrarProgramas() {
    const f = this.filtroPrograma.toLowerCase();
    this.programasFiltrados = this.programas.filter(p => p.nombrePrograma.toLowerCase().includes(f));
    this.mostrarProgramas = true;
  }
  seleccionarPrograma(p: Programa) {
    this.contratoForm.get('idPrograma')?.setValue(p.idPrograma);
    this.filtroPrograma = p.nombrePrograma;
    this.mostrarProgramas = false;
    this.actualizarObservacion();
  }

  abrirListaClientes() {
    // Al hacer focus sin texto: cargar lista completa menos los ya seleccionados
    if (this.filtroCliente.trim().length < 2) {
      this.clienteService.listarClientes().subscribe(data => {
        this.clientesFiltrados = data.filter(c => !this.clientesSeleccionados.some(s => s.idCliente === c.idCliente));
        this.mostrarClientes = true;
      });
    } else {
      this.filtrarClientes();
    }
  }

  // Genera la observación automática en tiempo real
  private generarObservacion(): string {
    const tipo = this.contratoForm.get('tipoContrato')?.value || '';
    const manzanas = this.lotesSeleccionados.map(l => `Mz. ${l.manzana} Lt. ${l.numeroLote}`);
    const loteStr = manzanas.length > 0 ? manzanas.join(', ') : 'Mz. ___ Lt. ___';
    const programa = this.filtroPrograma || '___';
    return `Se realizó un contrato ${tipo} de la ${loteStr} del Programa: ${programa}`;
  }

  private actualizarObservacion() {
    this.contratoForm.get('observaciones')?.setValue(this.generarObservacion(), { emitEvent: false });
  }

  filtrarClientes() {
    const f = this.filtroCliente.trim();
    if (f.length < 2) { this.clientesFiltrados = []; this.mostrarClientes = true; return; }
    this.clienteService.buscarClientesPorFiltro(f, /^\d+$/.test(f) ? 'documento' : 'nombres').subscribe(data => {
      this.clientesFiltrados = data.filter(c => !this.clientesSeleccionados.some(s => s.idCliente === c.idCliente));
      this.mostrarClientes = true;
    });
  }
  seleccionarCliente(c: Cliente) {
    if (!this.clientesSeleccionados.some(s => s.idCliente === c.idCliente)) {
      this.clientesSeleccionados.push(c); this.actualizarIdsClientes();
    }
    this.filtroCliente = ''; this.clientesFiltrados = [];
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
    if (!this.contratoForm.get('idPrograma')?.value) { this.toastr.warning('Primero selecciona un programa', 'Atención'); return; }
    const f = this.filtroLote.toLowerCase();
    this.lotesFiltrados = this.lotes.filter(l =>
      !this.lotesSeleccionados.some(s => s.idLote === l.idLote) &&
      `mz ${l.manzana} lt ${l.numeroLote}`.toLowerCase().includes(f));
    this.mostrarLotes = true;
  }
  seleccionarLote(l: Lote) {
    if (!l.programa) l.programa = { nombrePrograma: this.filtroPrograma } as Programa;
    this.lotesSeleccionados.push(l); this.actualizarIdsLotes(); this.calcularMontoTotalLotes();
    this.filtroLote = ''; this.filtrarLotes();
    this.actualizarObservacion();
    setTimeout(() => { this.mostrarLotes = false; }, 0);
  }
  eliminarLote(id?: number) {
    if (id === undefined) return;
    this.lotesSeleccionados = this.lotesSeleccionados.filter(l => l.idLote !== id);
    this.actualizarIdsLotes(); this.calcularMontoTotalLotes(); this.filtrarLotes();
    this.actualizarObservacion();
  }
  private actualizarIdsLotes() {
    this.contratoForm.get('idLotes')?.setValue(this.lotesSeleccionados.map(l => l.idLote!));
  }

  buscarSeparaciones(event: Event) {
    const termino = (event.target as HTMLInputElement).value;
    if (termino.trim().length > 0) {
      this.separacionService.buscarSeparaciones(termino).subscribe(seps => {
        this.separaciones = (seps || []).filter((v, i, a) => a.findIndex(t => t.id === v.id) === i);
        this.showSeparacionList = true;
      });
    } else this.showSeparacionList = false;
  }

  seleccionarSeparacion(sep: SeparacionDTO) {
    this.contratoForm.get('idSeparacion')?.setValue(sep.id);
    this.terminoBusquedaSeparacion = sep.text;
    this.showSeparacionList = false;
    this.separacionService.obtenerSeparacionPorId(sep.id!).subscribe({
      next: (res: any) => {
        if (!res) return;
        this.contratoForm.get('montoTotal')?.setValue(res.monto || 0);
        this.actualizarSaldo();
        if (res.clientes?.length) { this.clientesSeleccionados = res.clientes.map((i: any) => i.cliente).filter(Boolean); this.actualizarIdsClientes(); }
        if (res.lotes?.length) {
          this.lotesSeleccionados = res.lotes.map((i: any) => i.lote).filter(Boolean); this.actualizarIdsLotes();
          const prog = this.lotesSeleccionados[0]?.programa;
          if (prog) { this.contratoForm.get('idPrograma')?.setValue(prog.idPrograma); this.filtroPrograma = prog.nombrePrograma; }
        }
        if (res.vendedor) { this.contratoForm.get('vendedorId')?.setValue(res.vendedor.idVendedor); this.filtroVendedor = `${res.vendedor.nombre} ${res.vendedor.apellidos}`; }
        this.toastr.info('Separación cargada correctamente.');
      },
      error: () => this.toastr.error('No se pudieron cargar los detalles.')
    });
  }

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
    const v = this.contratoForm.getRawValue();
    const request: ContratoRequestDTO = {
      fechaContrato: v.fechaContrato,
      tipoContrato: v.tipoContrato,
      montoTotal: Number(v.montoTotal) || 0,
      inicial: Number(v.inicial) || 0,
      saldo: Number(v.saldo) || 0,
      cantidadLetras: v.cantidadLetras,
      observaciones: v.observaciones,
      idVendedor: v.vendedorId,
      idSeparacion: v.idSeparacion,
      idClientes: v.idClientes,
      idLotes: v.idLotes,
      moneda: v.moneda
    };
    this.contratoService.guardarContrato(request).subscribe({
      next: () => { this.isGuardando = false; this.toastr.success('Contrato guardado con éxito'); this.router.navigate(['/secretaria-menu/contratos']); },
      error: (err) => { this.isGuardando = false; this.toastr.error(err.error?.message || 'Error al guardar el contrato'); }
    });
  }

  cancelarConfirmacion() { this.mostrarModalConfirmacion = false; }

  private resetFormulario() {
    this.monedaSeleccionada = 'USD';
    this.contratoForm.reset({ modalidadContrato: 'DIRECTO', tipoContrato: 'FINANCIADO', montoTotal: 0, inicial: 0, saldo: 0, cantidadLetras: null, moneda: 'USD' }, { emitEvent: false });
    this.clientesSeleccionados = []; this.lotesSeleccionados = []; this.separaciones = [];
    this.filtroVendedor = ''; this.filtroPrograma = ''; this.filtroCliente = ''; this.filtroLote = '';
    this.lotes = []; this.lotesFiltrados = []; this.showSeparacionList = false;
    this.terminoBusquedaSeparacion = ''; this.saldoDisplay = '$ 0.00';
    this.tipoCambioEmpresa = 0; this.tipoCambioCompra = 0;
  }

  abrirModalVendedor() { this.vendedorModalContrato.abrirModal(); }
  abrirModalCliente() { this.registroModal.abrirModalCliente(); }
  abrirModalPrograma() { this.registroModalPrograma.abrirModal(); }
  abrirModalLote() { this.loteModalContrato.abrirModal(); }

  recargarVendedores() { this.vendedorService.listarVendedores().subscribe(v => { this.vendedores = v; this.vendedoresFiltrados = [...v]; }); }
  RecargarClientes() { this.clienteService.listarClientes().subscribe(c => { this.clientes = c; }); }
  RecargarProgramas() { this.programaService.listarProgramas().subscribe(p => { this.programas = p; this.programasFiltrados = [...p]; }); }
  RecargarLotes() {
    const id = this.contratoForm.get('idPrograma')?.value;
    if (id) this.loteService.listarLotesPorPrograma(id).subscribe(l => { this.lotes = l || []; this.filtrarLotes(); });
  }
}