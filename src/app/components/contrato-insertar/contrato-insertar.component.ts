import { Component, OnInit,ViewChild,ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import {FormBuilder,FormGroup,Validators,ReactiveFormsModule,FormsModule} from '@angular/forms';
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
import { RouterModule } from '@angular/router';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { faPlus } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { VendedorInsertar } from '../vendedor-insertar/vendedor-insertar';
import { ClienteInsertarComponent } from '../cliente-insertar/cliente-insertar.component';
import { ClientesComponent } from '../cliente-listar/cliente-listar.component';

@Component({
  selector: 'app-contrato-insertar',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, FormsModule,FontAwesomeModule,VendedorInsertar, ClienteInsertarComponent],
  templateUrl: './contrato-insertar.html',
  styleUrls: ['./contrato-insertar.scss'],
  
})

export class ContratoInsertarComponent implements OnInit {
    // USANDO @ViewChild CON EL TIPO DE CLASE CONFIRMADO: VendedorInsertar
    @ViewChild('vendedorModalContrato') vendedorModalContrato!: VendedorInsertar;

     // ✅ 1. REFERENCIA AL COMPONENTE MODAL HIJO
  @ViewChild('registroModal') registroModal!: ClienteInsertarComponent;


  
  contratoForm!: FormGroup;
  programas: Programa[] = [];
  lotes: Lote[] = [];
  vendedores: Vendedor[] = [];
  // 🚀 NUEVAS PROPIEDADES PARA EL FILTRO DE VENDEDOR
  vendedoresFiltrados: Vendedor[] = [];
  filtroVendedor: string = '';
  mostrarVendedores: boolean = false;

  clientes: Cliente[] = [];
  separaciones: SeparacionDTO[] = [];

  clientesSeleccionados: Cliente[] = [];
  lotesSeleccionados: Lote[] = [];

  modalidadContratoValues = ['DIRECTO', 'SEPARACION'];
  tipoContratoValues = ['CONTADO', 'FINANCIADO'];
  
  terminoBusquedaSeparacion: string = '';
  showSeparacionList: boolean = false;

  faPlus = faPlus;

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

  abrirModalVendedor() {
    this.vendedorModalContrato.abrirModal();
  }

  // ✅ 2. MÉTODO PARA ABRIR EL MODAL
  abrirModalCliente(cliente?: Cliente) {
    // LLama al método abrirModal del componente hijo (que debe ser implementado)
    this.registroModal.abrirModalCliente(cliente); 
  }

  recargarVendedores() {
    this.vendedorService.listarVendedores().subscribe(v => (this.vendedores = v));
  }

  RecargarClientes(): void {
    this.clienteService.listarClientes().subscribe(v => (this.clientes = v));
  }

  ngOnInit(): void {
    this.initForm();
    this.cargarCombos();
    this.handleFormChanges();
  }

  // Se encarga de aplicar el formato de moneda a los campos numéricos al salir del foco
  onCurrencyInput(event: Event, controlName: string) {
    const input = event.target as HTMLInputElement;
    const numericValue = this.extractNumericValue(input.value);
    const formattedValue = this.formatCurrency(numericValue);
    this.contratoForm.get(controlName)?.setValue(formattedValue, { emitEvent: false });
  }

  // Se encarga de limpiar el valor numérico manteniendo el símbolo de moneda cuando se hace clic en el campo
  onFocusInput(event: Event, controlName: string) {
    const control = this.contratoForm.get(controlName);
    const numericValue = this.extractNumericValue(control?.value);
    if (numericValue === 0) {
      control?.setValue('', { emitEvent: false });
    } else {
      control?.setValue(numericValue.toString(), { emitEvent: false });
    }
  }
  
  private initForm() {
    this.contratoForm = this.fb.group({
      modalidadContrato: ['DIRECTO', Validators.required],
      tipoContrato: ['FINANCIADO', Validators.required],
      fechaContrato: ['', Validators.required],
      vendedorId: [null, Validators.required],
      idPrograma: [null, Validators.required],
      idSeparacion: [null],
      // Inicializar con valores formateados
      montoTotal: [this.formatCurrency(0), [Validators.required, Validators.min(0)]],
      inicial: [this.formatCurrency(0), [Validators.min(0)]],
      saldo: [{ value: this.formatCurrency(0), disabled: true }],
      cantidadLetras: [0, [Validators.min(0)]],
      observaciones: [''],
      idClientes: [[], Validators.required],
      idLotes: [[], Validators.required]
    });
  }

  private cargarCombos() {
  this.programaService.listarProgramas().subscribe(p => (this.programas = p));
  this.vendedorService.listarVendedores().subscribe(v => { this.vendedores = v;
  this.vendedoresFiltrados = [...v];
  });
  this.clienteService.listarClientes().subscribe(c => (this.clientes = c));
}

toggleVendedores() {
  this.mostrarVendedores = !this.mostrarVendedores;
  if (this.mostrarVendedores && this.filtroVendedor.trim() === '') {
    this.vendedoresFiltrados = [...this.vendedores];
  }
}


filtrarVendedores() {
  const filtro = this.filtroVendedor.toLowerCase().trim();
  // Incluye la lógica de búsqueda de la cadena completa
  this.vendedoresFiltrados = this.vendedores.filter(v => {
    // Crea la cadena combinada (Nombre + Apellidos) en minúsculas
    const nombreCompleto = `${v.nombre} ${v.apellidos}`.toLowerCase();
    // Comprueba si el filtro está incluido en cualquiera de estas tres opciones:
    return (
      // 1. En la cadena completa (nombre + apellidos)
      nombreCompleto.includes(filtro) ||
      // 2. En el DNI (como antes)
      v.dni.toLowerCase().includes(filtro)
    );
  });
  
  this.mostrarVendedores = true;
}

seleccionarVendedor(vendedor: Vendedor) {
  this.contratoForm.get('vendedorId')?.setValue(vendedor.idVendedor);
  this.filtroVendedor = `${vendedor.nombre} ${vendedor.apellidos}`;
  this.mostrarVendedores = false;
}

  private handleFormChanges() {
    this.contratoForm.get('montoTotal')?.valueChanges.subscribe(() => this.actualizarSaldo());
    this.contratoForm.get('inicial')?.valueChanges.subscribe(() => this.actualizarSaldo());

    this.contratoForm.get('tipoContrato')?.valueChanges.subscribe(tipo => {
      if (tipo === 'CONTADO') {
        this.contratoForm.get('inicial')?.disable();
        this.contratoForm.get('cantidadLetras')?.disable();
        this.contratoForm.get('inicial')?.setValue(this.formatCurrency(this.extractNumericValue(this.contratoForm.value.montoTotal)));
        this.contratoForm.get('saldo')?.setValue(this.formatCurrency(0));
        this.contratoForm.get('cantidadLetras')?.setValue(0);
      } else {
        this.contratoForm.get('inicial')?.enable();
        this.contratoForm.get('cantidadLetras')?.enable();
        this.actualizarSaldo();
      }
    });

    this.contratoForm.get('modalidadContrato')?.valueChanges.subscribe(modo => {
      if (modo === 'DIRECTO') {
        this.contratoForm.get('idSeparacion')?.reset();
        this.separaciones = [];
        this.enableClienteLoteControls(true);
        this.contratoForm.get('vendedorId')?.setValidators(Validators.required);
        this.contratoForm.get('idPrograma')?.setValidators(Validators.required);
        this.showSeparacionList = false;
        this.terminoBusquedaSeparacion = '';
      } else {
        this.clientesSeleccionados = [];
        this.lotesSeleccionados = [];
        this.actualizarIdsClientes();
        this.actualizarIdsLotes();
        this.enableClienteLoteControls(false);
        this.contratoForm.get('vendedorId')?.clearValidators();
        this.contratoForm.get('idPrograma')?.clearValidators();
        this.contratoForm.get('vendedorId')?.reset();
        this.contratoForm.get('idPrograma')?.reset();
        if (this.terminoBusquedaSeparacion.trim().length === 0) {
          this.showSeparacionList = false;
          this.separaciones = [];
        }
      }

      this.contratoForm.get('vendedorId')?.updateValueAndValidity();
      this.contratoForm.get('idPrograma')?.updateValueAndValidity();
    });

    this.contratoForm.get('idPrograma')?.valueChanges.subscribe(id => {
      if (id) {
        this.loteService.listarLotesPorPrograma(id).subscribe(lotes => {
          this.lotes = lotes;
        });
      } else {
        this.lotes = [];
      }
    });
  }

  private enableClienteLoteControls(enable: boolean) {
    this.contratoForm.get('idClientes')?.[enable ? 'enable' : 'disable']();
    this.contratoForm.get('idLotes')?.[enable ? 'enable' : 'disable']();
  }

  actualizarSaldo() {
    const rawMonto = this.contratoForm.get('montoTotal')?.value || '0';
    const rawInicial = this.contratoForm.get('inicial')?.value || '0';

    const total = this.extractNumericValue(rawMonto);
    const inicial = this.extractNumericValue(rawInicial);

    const saldo = total - inicial;
    this.contratoForm.get('saldo')?.setValue(this.formatCurrency(saldo >= 0 ? saldo : 0), { emitEvent: false });
  }

  private formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-US', { style: 'currency', currency: 'USD' }).format(value);
  }

  private extractNumericValue(value: any): number {
    if (typeof value !== 'string') {
      if (value === null || value === undefined) return 0;
      value = value.toString();
    }
    const numericValue = value.replace(/[^\d.]/g, "");
    return parseFloat(numericValue) || 0;
  }

  buscarSeparaciones(event: Event) {
    const input = event.target as HTMLInputElement;
    this.terminoBusquedaSeparacion = input.value;

    if (this.terminoBusquedaSeparacion.trim().length > 0) {
      this.showSeparacionList = true;
      this.separacionService.buscarSeparaciones(this.terminoBusquedaSeparacion).subscribe(seps => {
        this.separaciones = seps;
      });
    } else {
      this.showSeparacionList = false;
      this.separaciones = [];
    }
  }

  agregarCliente(event: Event) {
    const idCliente = +(event.target as HTMLSelectElement).value;
    const cliente = this.clientes.find(c => c.idCliente === idCliente);
    if (cliente && !this.clientesSeleccionados.some(c => c.idCliente === idCliente)) {
      this.clientesSeleccionados.push(cliente);
      this.actualizarIdsClientes();
    }
  }

  eliminarCliente(idCliente: number) {
    this.clientesSeleccionados = this.clientesSeleccionados.filter(c => c.idCliente !== idCliente);
    this.actualizarIdsClientes();
  }

  private actualizarIdsClientes() {
    const ids = this.clientesSeleccionados.map(c => c.idCliente);
    this.contratoForm.get('idClientes')?.setValue(ids);
  }

  agregarLote(event: Event) {
    const idLote = +(event.target as HTMLSelectElement).value;
    const lote = this.lotes.find(l => l.idLote === idLote);
    if (lote && !this.lotesSeleccionados.some(l => l.idLote === idLote)) {
      this.lotesSeleccionados.push(lote);
      this.actualizarIdsLotes();
    }
  }

  eliminarLote(idLote: number | undefined) {
    if (idLote === undefined) return;
    this.lotesSeleccionados = this.lotesSeleccionados.filter(l => l.idLote !== idLote);
    this.actualizarIdsLotes();
  }

  isLoteSeleccionado(idLote: number | undefined): boolean {
    if (idLote === undefined) return false;
    return this.lotesSeleccionados.some(lo => lo.idLote === idLote);
  }

  private actualizarIdsLotes() {
    const ids = this.lotesSeleccionados.map(l => l.idLote!);
    this.contratoForm.get('idLotes')?.setValue(ids);
  }

  guardarContrato() {
    if (this.contratoForm.invalid) {
      this.contratoForm.markAllAsTouched();
      this.toastr.error('Por favor, completa todos los campos requeridos.', 'Formulario Inválido');
      return;
    }

    const montoTotal = this.extractNumericValue(this.contratoForm.value.montoTotal);
    const inicial = this.extractNumericValue(this.contratoForm.value.inicial);
    const saldo = this.extractNumericValue(this.contratoForm.get('saldo')?.value);

    const request: ContratoRequestDTO = {
      fechaContrato: this.contratoForm.value.fechaContrato,
      tipoContrato: this.contratoForm.value.tipoContrato,
      montoTotal: montoTotal,
      inicial: inicial,
      saldo: saldo,
      cantidadLetras: this.contratoForm.value.cantidadLetras,
      observaciones: this.contratoForm.value.observaciones,
      idVendedor: this.contratoForm.value.vendedorId,
      idSeparacion: this.contratoForm.value.idSeparacion,
      idClientes: this.contratoForm.value.idClientes,
      idLotes: this.contratoForm.value.idLotes
    };

    this.contratoService.guardarContrato(request).subscribe({
      next: () => {
        this.toastr.success('Contrato guardado con éxito', '¡Éxito!');
        this.resetFormulario();
      },
      error: (err) => {
        console.error(err);
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
    });
    this.clientesSeleccionados = [];
    this.lotesSeleccionados = [];
    this.separaciones = [];
    this.filtroVendedor = '';
    this.vendedoresFiltrados = [...this.vendedores];
    this.lotes = [];
    this.showSeparacionList = false;
    this.terminoBusquedaSeparacion = '';
  }

  get esContado(): boolean {
    return this.contratoForm.get('tipoContrato')?.value === 'CONTADO';
  }
}
