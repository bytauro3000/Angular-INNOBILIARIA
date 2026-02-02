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
import { RouterModule, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { faPlus } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { VendedorInsertar } from '../vendedor-insertar/vendedor-insertar';
import { ClienteInsertarComponent } from '../cliente-insertar/cliente-insertar.component';
import { ProgramaInsetEdit } from '../programa-inset-edit/programa-inset-edit';
import { LotesInsertarEditar } from '../lotes-insertar-editar/lotes-insertar-editar'; // 🟢 Importado

@Component({
  selector: 'app-contrato-insertar',
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule, 
    RouterModule, 
    FormsModule, 
    FontAwesomeModule, 
    VendedorInsertar, 
    ClienteInsertarComponent, 
    ProgramaInsetEdit,
    LotesInsertarEditar // 🟢 Añadido a imports
  ],
  templateUrl: './contrato-insertar.html',
  styleUrls: ['./contrato-insertar.scss'],
})
export class ContratoInsertarComponent implements OnInit {
  @ViewChild('vendedorModalContrato') vendedorModalContrato!: VendedorInsertar;
  @ViewChild('registroModal') registroModal!: ClienteInsertarComponent;
  @ViewChild('registroModalPrograma') registroModalPrograma!: ProgramaInsetEdit;
  @ViewChild('loteModalContrato') loteModalContrato!: LotesInsertarEditar; // 🟢 Añadido ViewChild
  
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

  vendedoresFiltrados: Vendedor[] = [];
  filtroVendedor: string = '';
  mostrarVendedores: boolean = false;

  programasFiltrados: Programa[] = [];
  filtroPrograma: string = '';
  mostrarProgramas: boolean = false;
  programaSeleccionado: Programa | null = null;
  
  clientesFiltrados: Cliente[] = [];
  filtroCliente: string = '';
  mostrarClientes: boolean = false;

  lotesFiltrados: Lote[] = [];
  filtroLote: string = '';
  mostrarLotes: boolean = false;

  constructor(
    private fb: FormBuilder,
    private contratoService: ContratoService,
    private programaService: ProgramaService,
    private vendedorService: VendedorService,
    private clienteService: ClienteService,
    private separacionService: SeparacionService,
    private loteService: LoteService,
    public router: Router,
    private toastr: ToastrService
  ) {}

  @HostListener('document:click', ['$event'])
  onClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (this.vendedorBusquedaContainer && !this.vendedorBusquedaContainer.nativeElement.contains(target)) this.mostrarVendedores = false;
    if (this.programaBusquedaContainer && !this.programaBusquedaContainer.nativeElement.contains(target)) this.mostrarProgramas = false;
    if (this.clienteBusquedaContainer && !this.clienteBusquedaContainer.nativeElement.contains(target)) this.mostrarClientes = false;
    if (this.loteBusquedaContainer && !this.loteBusquedaContainer.nativeElement.contains(target)) this.mostrarLotes = false;
  }

  abrirModalVendedor() { this.vendedorModalContrato.abrirModal(); }
  abrirModalCliente(cliente?: Cliente) { this.registroModal.abrirModalCliente(cliente); }
  abrirModalPrograma(Programa?: Programa) { this.registroModalPrograma.abrirModal(Programa); }
  abrirModalLote() { this.loteModalContrato.abrirModal(); } // 🟢 Función para abrir modal lote

  getAbreviatura(lote: Lote): string {
    const nombre = lote.programa?.nombrePrograma || this.filtroPrograma;
    if (!nombre) return 'S/P';
    const excluidas = ['de', 'la', 'lo', 'los', 'las', 'el', 'en', 'y', 'viv.'];
    return nombre
      .split(' ')
      .filter(palabra => palabra.length > 1 && !excluidas.includes(palabra.toLowerCase()))
      .map(palabra => palabra[0].toUpperCase())
      .join('') + '.';
  }

  recargarVendedores() {
    this.vendedorService.listarVendedores().subscribe(v => {
      this.vendedores = v;
      this.vendedoresFiltrados = [...v];
    });
  }

  RecargarClientes(): void {
    this.clienteService.listarClientes().subscribe(c => {
      this.clientes = c;
      this.clientesFiltrados = [...c];
    });
  }

  RecargarProgramas(): void {
    this.programaService.listarProgramas().subscribe(p => {
      this.programas = p;
      this.programasFiltrados = [...p];
    });
  }

  // 🟢 Recarga los lotes del programa actual para que aparezca el nuevo creado
  RecargarLotes(): void {
    const idProg = this.contratoForm.get('idPrograma')?.value;
    if (idProg) {
      this.loteService.listarLotesPorPrograma(idProg).subscribe(l => {
        this.lotes = l || [];
        this.lotesFiltrados = [...this.lotes];
      });
    }
  }

  ngOnInit(): void {
    this.initForm();
    this.cargarCombos();
    this.handleFormChanges();
  }

  onCurrencyInput(event: Event, controlName: string) {
    const input = event.target as HTMLInputElement;
    const numericValue = this.extractNumericValue(input.value);
    const formattedValue = this.formatCurrency(numericValue);
    this.contratoForm.get(controlName)?.setValue(formattedValue, { emitEvent: false });
    this.actualizarSaldo();
  }

  onFocusInput(event: Event, controlName: string) {
    const control = this.contratoForm.get(controlName);
    const numericValue = this.extractNumericValue(control?.value);
    if (numericValue === 0) control?.setValue('', { emitEvent: false });
    else control?.setValue(numericValue.toString(), { emitEvent: false });
  }

  private initForm() {
    this.contratoForm = this.fb.group({
      modalidadContrato: ['DIRECTO', Validators.required],
      tipoContrato: ['FINANCIADO', Validators.required],
      fechaContrato: ['', Validators.required],
      vendedorId: [null, Validators.required],
      idPrograma: [null, Validators.required],
      idSeparacion: [null],
      montoTotal: [this.formatCurrency(0), [Validators.required, Validators.min(0)]],
      inicial: [this.formatCurrency(0), [Validators.min(0)]],
      saldo: [{ value: this.formatCurrency(0), disabled: true }],
      cantidadLetras: [0, [Validators.min(0)]],
      observaciones: [''],
      idClientes: [[], Validators.required],
      idLotes: [[], Validators.required]
    });
  }

 public getLoteCosto(lote: Lote): number {
  const area = Number(lote.area) || 0;
  const precio = Number(lote.precioM2) || 0;
  const total = area * precio;

  // 🟢 CAMBIO: Redondeamos al entero más cercano para coincidir con el Backend
  return Math.round(total); 
}

  private calcularMontoTotalLotes() {
    if (this.contratoForm.get('modalidadContrato')?.value !== 'DIRECTO') return;
    const total = this.lotesSeleccionados.reduce((acc, lote) => acc + this.getLoteCosto(lote), 0);
    this.contratoForm.get('montoTotal')?.setValue(this.formatCurrency(total));
    this.actualizarSaldo();
  }

  private cargarCombos() {
    this.RecargarProgramas();
    this.recargarVendedores();
    this.RecargarClientes();
  }
  
  toggleVendedores() {
    this.mostrarVendedores = !this.mostrarVendedores;
    if (this.mostrarVendedores && this.filtroVendedor.trim() === '') this.vendedoresFiltrados = [...this.vendedores];
  }

  filtrarVendedores() {
    const filtro = this.filtroVendedor.toLowerCase().trim();
    if (filtro === '') {
      this.vendedoresFiltrados = [...this.vendedores];
    } else {
      this.vendedoresFiltrados = this.vendedores.filter(v => {
        const nombreCompleto = `${v.nombre} ${v.apellidos}`.toLowerCase();
        return nombreCompleto.includes(filtro) || (v.dni && v.dni.toLowerCase().includes(filtro));
      });
    }
    this.mostrarVendedores = true;
  }

  seleccionarVendedor(vendedor: Vendedor) {
    this.contratoForm.get('vendedorId')?.setValue(vendedor.idVendedor);
    this.filtroVendedor = `${vendedor.nombre} ${vendedor.apellidos}`;
    this.mostrarVendedores = false; 
  }

  toggleProgramas() {
    this.mostrarProgramas = !this.mostrarProgramas;
    if (this.mostrarProgramas && this.filtroPrograma.trim() === '') this.programasFiltrados = [...this.programas];
  }

  filtrarProgramas() {
    const filtro = this.filtroPrograma.toLowerCase().trim();
    this.programasFiltrados = this.programas.filter(p => p.nombrePrograma.toLowerCase().includes(filtro));
    this.mostrarProgramas = true;
  }

  seleccionarPrograma(programa: Programa) {
    this.programaSeleccionado = programa;
    this.contratoForm.get('idPrograma')?.setValue(programa.idPrograma);
    this.filtroPrograma = programa.nombrePrograma;
    setTimeout(() => { this.mostrarProgramas = false; }, 0);
  }

  toggleClientes() {
  this.mostrarClientes = !this.mostrarClientes;

  // Si se abre el selector y no hay nada escrito, cargamos la lista general
  if (this.mostrarClientes && this.filtroCliente.trim() === '') {
    this.clienteService.listarClientes().subscribe({
      next: (data) => {
        // Mostramos todos los clientes excepto los que ya están seleccionados
        this.clientesFiltrados = data.filter(c => 
          !this.clientesSeleccionados.some(sc => sc.idCliente === c.idCliente)
        );
      },
      error: (err) => console.error('Error al cargar lista inicial:', err)
    });
  }
}
  filtrarClientes() {
  const filtro = this.filtroCliente.trim();
  
  if (filtro.length < 2) {
    this.clientesFiltrados = [];
    return;
  }

  // Detectar automáticamente si es búsqueda por Documento (si es número) o Nombres
  const esNumero = /^\d+$/.test(filtro);
  const tipoBusqueda = esNumero ? 'documento' : 'nombres';

  // Llamamos al servicio del backend que configuramos previamente
  this.clienteService.buscarClientesPorFiltro(filtro, tipoBusqueda).subscribe({
    next: (data) => {
      // Excluimos a los clientes que YA están seleccionados en la lista de abajo
      this.clientesFiltrados = data.filter(c => 
        !this.clientesSeleccionados.some(sc => sc.idCliente === c.idCliente)
      );
      this.mostrarClientes = true;
    },
    error: (err) => {
      console.error('Error en búsqueda de clientes:', err);
    }
  });
}

  seleccionarCliente(cliente: Cliente) {
    if (!this.clientesSeleccionados.some(c => c.idCliente === cliente.idCliente)) {
      this.clientesSeleccionados.push(cliente);
      this.actualizarIdsClientes();
    }
    this.filtroCliente = '';
    this.filtrarClientes();
    setTimeout(() => { this.mostrarClientes = false; }, 0);
  }

  eliminarCliente(idCliente: number) {
    this.clientesSeleccionados = this.clientesSeleccionados.filter(c => c.idCliente !== idCliente);
    this.actualizarIdsClientes();
  }
  
  private actualizarIdsClientes() {
    const ids = this.clientesSeleccionados.map(c => c.idCliente);
    this.contratoForm.get('idClientes')?.setValue(ids);
  }

  toggleLotes() {
    if(!this.contratoForm.get('idPrograma')?.value) return; 
    this.mostrarLotes = !this.mostrarLotes;
    if (this.mostrarLotes && this.filtroLote.trim() === '') this.lotesFiltrados = this.lotes.filter(l => !this.isLoteSeleccionado(l.idLote));
    else this.filtrarLotes();
  }

  filtrarLotes() {
    const filtro = this.filtroLote.toLowerCase().trim();
    let disponibles = this.lotes.filter(l => !this.isLoteSeleccionado(l.idLote));
    this.lotesFiltrados = filtro === '' ? disponibles : disponibles.filter(l => `manzana ${l.manzana} lote ${l.numeroLote}`.toLowerCase().includes(filtro));
    this.mostrarLotes = true;
  }

  seleccionarLote(lote: Lote) {
    if (!this.isLoteSeleccionado(lote.idLote)) {
      if (!lote.programa) {
        lote.programa = { nombrePrograma: this.filtroPrograma } as Programa;
      }
      this.lotesSeleccionados.push(lote);
      this.actualizarIdsLotes();
      this.calcularMontoTotalLotes(); 
    }
    this.filtroLote = '';
    this.filtrarLotes();
    setTimeout(() => { this.mostrarLotes = false; }, 0);
  }

  eliminarLote(idLote: number | undefined) {
    if (idLote === undefined) return;
    this.lotesSeleccionados = this.lotesSeleccionados.filter(l => l.idLote !== idLote);
    this.actualizarIdsLotes();
    this.calcularMontoTotalLotes(); 
  }

  isLoteSeleccionado(idLote: number | undefined): boolean {
    return idLote !== undefined && this.lotesSeleccionados.some(lo => lo.idLote === idLote);
  }

  private actualizarIdsLotes() {
    const ids = this.lotesSeleccionados.map(l => l.idLote!);
    this.contratoForm.get('idLotes')?.setValue(ids);
  }

  private handleFormChanges() {
    this.contratoForm.get('montoTotal')?.valueChanges.subscribe(() => this.actualizarSaldo());
    this.contratoForm.get('inicial')?.valueChanges.subscribe(() => this.actualizarSaldo());

    this.contratoForm.get('tipoContrato')?.valueChanges.subscribe(tipo => {
      if (tipo === 'CONTADO') {
        this.contratoForm.get('inicial')?.disable({emitEvent: false});
        this.contratoForm.get('cantidadLetras')?.disable({emitEvent: false});
        this.contratoForm.patchValue({
          inicial: this.formatCurrency(this.extractNumericValue(this.contratoForm.getRawValue().montoTotal)),
          saldo: this.formatCurrency(0),
          cantidadLetras: 0
        }, {emitEvent: false});
      } else {
        this.contratoForm.get('inicial')?.enable({emitEvent: false});
        this.contratoForm.get('cantidadLetras')?.enable({emitEvent: false});
      }
    });

    this.contratoForm.get('modalidadContrato')?.valueChanges.subscribe(modo => {
      if (modo === 'DIRECTO') {
        this.contratoForm.get('idSeparacion')?.reset(null, {emitEvent: false});
        this.separaciones = [];
        this.contratoForm.get('vendedorId')?.setValidators(Validators.required);
        this.contratoForm.get('idPrograma')?.setValidators(Validators.required);
        this.contratoForm.get('idClientes')?.setValidators(Validators.required);
        this.contratoForm.get('idLotes')?.setValidators(Validators.required);
        this.calcularMontoTotalLotes(); 
      } else { 
        this.clientesSeleccionados = [];
        this.lotesSeleccionados = [];
        this.actualizarIdsClientes();
        this.actualizarIdsLotes();
        this.contratoForm.get('vendedorId')?.clearValidators();
        this.contratoForm.get('idPrograma')?.clearValidators();
        this.contratoForm.get('idClientes')?.clearValidators();
        this.contratoForm.get('idLotes')?.clearValidators(); 
      }
      this.contratoForm.updateValueAndValidity({emitEvent: false});
    });

    this.contratoForm.get('idPrograma')?.valueChanges.subscribe(id => {
      if (!id) {
          this.lotes = [];
          this.lotesFiltrados = [];
          return;
      }
      this.loteService.listarLotesPorPrograma(id).subscribe(l => {
        this.lotes = l || [];
        this.lotesFiltrados = [...this.lotes];
      });
    });
  }

  actualizarSaldo() {
    const total = this.extractNumericValue(this.contratoForm.get('montoTotal')?.value);
    const inicial = this.extractNumericValue(this.contratoForm.get('inicial')?.value);
    const saldo = total - inicial;
    this.contratoForm.get('saldo')?.setValue(this.formatCurrency(saldo >= 0 ? saldo : 0), { emitEvent: false });
  }

  private formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
  }

  private extractNumericValue(value: any): number {
    if (value === null || value === undefined) return 0;
    const str = value.toString().replace(/[^\d.-]/g, "");
    return parseFloat(str) || 0;
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
            this.contratoForm.get('montoTotal')?.setValue(this.formatCurrency(res.monto || 0));
            this.actualizarSaldo(); 
            
            if (res.clientes && Array.isArray(res.clientes)) {
                this.clientesSeleccionados = res.clientes.map((i: any) => i.cliente).filter((c: any) => c !== null);
                this.actualizarIdsClientes();
            }

            if (res.lotes && Array.isArray(res.lotes)) {
                this.lotesSeleccionados = res.lotes.map((i: any) => i.lote).filter((l: any) => l !== null);
                this.actualizarIdsLotes();
                
                if (this.lotesSeleccionados.length > 0) {
                    const prog = this.lotesSeleccionados[0].programa;
                    if (prog) {
                        this.contratoForm.get('idPrograma')?.setValue(prog.idPrograma);
                        this.filtroPrograma = prog.nombrePrograma;
                    }
                }
            }
            
            if (res.vendedor) {
                this.contratoForm.get('vendedorId')?.setValue(res.vendedor.idVendedor);
                this.filtroVendedor = `${res.vendedor.nombre} ${res.vendedor.apellidos}`;
            }
            this.toastr.info('Separación cargada correctamente.', 'Información');
        },
        error: (err: any) => {
            this.toastr.error('No se pudieron cargar los detalles.', 'Error');
        }
    });
  }

  guardarContrato() {
    if (this.contratoForm.invalid) {
      this.contratoForm.markAllAsTouched();
      this.toastr.error('Por favor, completa todos los campos requeridos.', 'Formulario Inválido');
      return;
    }

    const values = this.contratoForm.getRawValue();

    const request: ContratoRequestDTO = {
      fechaContrato: values.fechaContrato,
      tipoContrato: values.tipoContrato,
      montoTotal: this.extractNumericValue(values.montoTotal),
      inicial: this.extractNumericValue(values.inicial),
      saldo: this.extractNumericValue(values.saldo),
      cantidadLetras: values.cantidadLetras,
      observaciones: values.observaciones,
      idVendedor: values.vendedorId,
      idSeparacion: values.idSeparacion, 
      idClientes: values.idClientes,
      idLotes: values.idLotes
    };

    this.contratoService.guardarContrato(request).subscribe({
      next: () => {
        this.toastr.success('Contrato guardado con éxito', '¡Éxito!');
        this.resetFormulario();
      },
      error: (err) => {
        this.toastr.error('❌ Error al guardar el contrato', 'Error');
      }
    });
  }

  private resetFormulario() {
    this.contratoForm.reset({
      modalidadContrato: 'DIRECTO',
      tipoContrato: 'FINANCIADO',
      montoTotal: this.formatCurrency(0),
      inicial: this.formatCurrency(0),
      saldo: this.formatCurrency(0),
      cantidadLetras: 0
    }, { emitEvent: false });

    this.clientesSeleccionados = [];
    this.lotesSeleccionados = [];
    this.separaciones = [];
    this.filtroVendedor = '';
    this.filtroPrograma = '';
    this.filtroCliente = '';
    this.filtroLote = '';
    this.lotes = [];
    this.lotesFiltrados = [];
    this.showSeparacionList = false;
    this.terminoBusquedaSeparacion = '';
    this.contratoForm.updateValueAndValidity({ emitEvent: false });
  }

  get esContado(): boolean {
    return this.contratoForm.get('tipoContrato')?.value === 'CONTADO';
  }
}