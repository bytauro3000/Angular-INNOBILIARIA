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

// 🟢 CORRECCIÓN: Importar el modelo Separacion (la entidad completa)
import { Separacion } from '../../models/separacion.model'; 

import { ContratoRequestDTO } from '../../dto/contratorequest.dto';
import { RouterModule } from '@angular/router';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { faPlus } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { VendedorInsertar } from '../vendedor-insertar/vendedor-insertar';
import { ClienteInsertarComponent } from '../cliente-insertar/cliente-insertar.component';
import { ProgramaInsetEdit } from '../programa-inset-edit/programa-inset-edit';

@Component({
  selector: 'app-contrato-insertar',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, FormsModule, FontAwesomeModule, VendedorInsertar, ClienteInsertarComponent, ProgramaInsetEdit],
  templateUrl: './contrato-insertar.html',
  styleUrls: ['./contrato-insertar.scss'],
})

export class ContratoInsertarComponent implements OnInit {
  // Referencias a los modales de vendedor, cliente y programa
  @ViewChild('vendedorModalContrato') vendedorModalContrato!: VendedorInsertar;
  @ViewChild('registroModal') registroModal!: ClienteInsertarComponent;
  @ViewChild('registroModalPrograma') registroModalPrograma!: ProgramaInsetEdit;
  
  // Referencias añadidas para el cierre al hacer click fuera
  @ViewChild('vendedorBusquedaContainer') vendedorBusquedaContainer!: ElementRef;
  @ViewChild('programaBusquedaContainer') programaBusquedaContainer!: ElementRef;
  @ViewChild('clienteBusquedaContainer') clienteBusquedaContainer!: ElementRef;
  @ViewChild('loteBusquedaContainer') loteBusquedaContainer!: ElementRef; 


  // Propiedades del formulario y datos
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

  // =======================
  // LÓGICA VENDEDORES (EXISTENTE)
  // =======================
  vendedoresFiltrados: Vendedor[] = [];
  filtroVendedor: string = '';
  mostrarVendedores: boolean = false;

  // =======================
  // LÓGICA PROGRAMAS (NUEVA)
  // =======================
  programasFiltrados: Programa[] = [];
  filtroPrograma: string = '';
  mostrarProgramas: boolean = false;
  programaSeleccionado: Programa | null = null;
  
  // =======================
  // LÓGICA CLIENTES (NUEVA)
  // =======================
  clientesFiltrados: Cliente[] = [];
  filtroCliente: string = '';
  mostrarClientes: boolean = false;

  // =======================
  // LÓGICA LOTES (NUEVA)
  // =======================
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

  // Detecta clics fuera de los componentes de búsqueda y cierra la lista
  @HostListener('document:click', ['$event'])
  onClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;

    // Cierre de Vendedores
    if (this.vendedorBusquedaContainer && !this.vendedorBusquedaContainer.nativeElement.contains(target)) {
      this.mostrarVendedores = false;
    }

    // Cierre de Programas
    if (this.programaBusquedaContainer && !this.programaBusquedaContainer.nativeElement.contains(target)) {
      this.mostrarProgramas = false;
    }
    
    // Cierre de Clientes
    if (this.clienteBusquedaContainer && !this.clienteBusquedaContainer.nativeElement.contains(target)) {
      this.mostrarClientes = false;
    }

    // Cierre de Lotes
    if (this.loteBusquedaContainer && !this.loteBusquedaContainer.nativeElement.contains(target)) {
      this.mostrarLotes = false;
    }
  }

  // Abre el modal de vendedor
  abrirModalVendedor() {
    this.vendedorModalContrato.abrirModal();
  }

  // Abre el modal de cliente
  abrirModalCliente(cliente?: Cliente) {
    this.registroModal.abrirModalCliente(cliente); 
  }

  // Abre el modal de programa
  abrirModalPrograma(Programa?: Programa) {
    this.registroModalPrograma.abrirModal(Programa);
  }

  // Recarga la lista de vendedores
  recargarVendedores() {
    this.vendedorService.listarVendedores().subscribe(v => {
      this.vendedores = v;
      this.vendedoresFiltrados = [...v];
    });
  }

  // Recarga la lista de clientes
  RecargarClientes(): void {
    this.clienteService.listarClientes().subscribe(c => {
      this.clientes = c;
      this.clientesFiltrados = [...c];
    });
  }

  // Recarga la lista de programas
  RecargarProgramas(): void {
    this.programaService.listarProgramas().subscribe(p => {
      this.programas = p;
      this.programasFiltrados = [...p];
    });
  }

  ngOnInit(): void {
    this.initForm();
    this.cargarCombos();
    this.handleFormChanges();
  }

  // Método para manejar la entrada de moneda y su formato
  onCurrencyInput(event: Event, controlName: string) {
    const input = event.target as HTMLInputElement;
    const numericValue = this.extractNumericValue(input.value);
    const formattedValue = this.formatCurrency(numericValue);
    this.contratoForm.get(controlName)?.setValue(formattedValue, { emitEvent: false });
  }

  // Método que limpia el valor numérico manteniendo el símbolo de moneda al hacer focus
  onFocusInput(event: Event, controlName: string) {
    const control = this.contratoForm.get(controlName);
    const numericValue = this.extractNumericValue(control?.value);
    if (numericValue === 0) {
      control?.setValue('', { emitEvent: false });
    } else {
      control?.setValue(numericValue.toString(), { emitEvent: false });
    }
  }

  // Inicializa el formulario
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

  // Carga los datos de programas, vendedores y clientes
  private cargarCombos() {
    this.programaService.listarProgramas().subscribe(p => {
      this.programas = p;
      this.programasFiltrados = [...p];
    });
    this.vendedorService.listarVendedores().subscribe(v => {
      this.vendedores = v;
      this.vendedoresFiltrados = [...v];
    });
    this.clienteService.listarClientes().subscribe(c => {
      this.clientes = c;
      this.clientesFiltrados = [...c];
    });
  }
  
  // =======================
  // LÓGICA VENDEDORES 
  // =======================
  // Alterna la visibilidad de la lista de vendedores
  toggleVendedores() {
    this.mostrarVendedores = !this.mostrarVendedores;
    if (this.mostrarVendedores && this.filtroVendedor.trim() === '') {
      this.vendedoresFiltrados = [...this.vendedores];
    }
  }

  // Filtra los vendedores según el texto ingresado
  filtrarVendedores() {
    const filtro = this.filtroVendedor.toLowerCase().trim();
    if (filtro === '') {
      this.vendedoresFiltrados = [...this.vendedores];
      this.mostrarVendedores = true;
    } else {
      this.vendedoresFiltrados = this.vendedores.filter(v => {
        const nombreCompleto = `${v.nombre} ${v.apellidos}`.toLowerCase();
        return nombreCompleto.includes(filtro) || (v.dni && v.dni.toLowerCase().includes(filtro));
      });
      this.mostrarVendedores = true;
    }
  }

  // Selecciona un vendedor de la lista
  seleccionarVendedor(vendedor: Vendedor) {
    this.contratoForm.get('vendedorId')?.setValue(vendedor.idVendedor);
    this.filtroVendedor = `${vendedor.nombre} ${vendedor.apellidos}`;
    this.mostrarVendedores = false; 
  }

  // =======================
  // LÓGICA PROGRAMAS 
  // =======================

  toggleProgramas() {
    this.mostrarProgramas = !this.mostrarProgramas;
    if (this.mostrarProgramas && this.filtroPrograma.trim() === '') {
      this.programasFiltrados = [...this.programas];
    }
  }

  filtrarProgramas() {
    const filtro = this.filtroPrograma.toLowerCase().trim();
    
    this.programasFiltrados = this.programas.filter(p => 
      p.nombrePrograma.toLowerCase().includes(filtro)
    );
    this.mostrarProgramas = true; // Mantener visible mientras se escribe

    // Si no hay filtro, mostrar la lista completa
    if (filtro === '') {
      this.programasFiltrados = [...this.programas];
    }
  }

  seleccionarPrograma(programa: Programa) {
    this.programaSeleccionado = programa;
    this.contratoForm.get('idPrograma')?.setValue(programa.idPrograma);
    this.filtroPrograma = programa.nombrePrograma;
    
    // Forzar el cierre de la lista en el siguiente ciclo de eventos
    setTimeout(() => {
      this.mostrarProgramas = false; 
    }, 0);
  }

  // =======================
  // LÓGICA CLIENTES 
  // =======================

  toggleClientes() {
    this.mostrarClientes = !this.mostrarClientes;
    if (this.mostrarClientes && this.filtroCliente.trim() === '') {
      this.clientesFiltrados = this.clientes.filter(c => !this.clientesSeleccionados.some(sc => sc.idCliente === c.idCliente));
    } else {
      this.filtrarClientes();
    }
  }

  filtrarClientes() {
    const filtro = this.filtroCliente.toLowerCase().trim();
    let clientesDisponibles = this.clientes.filter(c => 
      !this.clientesSeleccionados.some(sc => sc.idCliente === c.idCliente)
    );

    if (filtro === '') {
      this.clientesFiltrados = clientesDisponibles;
    } else {
      this.clientesFiltrados = clientesDisponibles.filter(c => {
        const nombreCompleto = `${c.nombre} ${c.apellidos}`.toLowerCase();
        return nombreCompleto.includes(filtro) || (c.numDoc && c.numDoc.toLowerCase().includes(filtro));
      });
    }
    this.mostrarClientes = true;
  }

  seleccionarCliente(cliente: Cliente) {
    if (!this.clientesSeleccionados.some(c => c.idCliente === cliente.idCliente)) {
      this.clientesSeleccionados.push(cliente);
      this.actualizarIdsClientes();
    }
    
    // Limpiar filtro y cerrar lista
    this.filtroCliente = '';
    this.filtrarClientes(); // Para actualizar la lista de filtrados
    
    // Forzar el cierre de la lista en el siguiente ciclo de eventos
    setTimeout(() => {
      this.mostrarClientes = false; 
    }, 0);
  }

  eliminarCliente(idCliente: number) {
    this.clientesSeleccionados = this.clientesSeleccionados.filter(c => c.idCliente !== idCliente);
    this.actualizarIdsClientes();
    // Si la lista de clientes estaba abierta, actualizarla
    if (this.mostrarClientes) {
      this.filtrarClientes();
    }
  }
  
  private actualizarIdsClientes() {
    const ids = this.clientesSeleccionados.map(c => c.idCliente);
    this.contratoForm.get('idClientes')?.setValue(ids);
  }

  // =======================
  // LÓGICA LOTES 
  // =======================

  toggleLotes() {
    if(!this.contratoForm.get('idPrograma')?.value) return; // No abrir si no hay programa
    
    this.mostrarLotes = !this.mostrarLotes;
    if (this.mostrarLotes && this.filtroLote.trim() === '') {
      this.lotesFiltrados = this.lotes.filter(l => !this.isLoteSeleccionado(l.idLote));
    } else {
      this.filtrarLotes();
    }
  }

  filtrarLotes() {
    const filtro = this.filtroLote.toLowerCase().trim();
    let lotesDisponibles = this.lotes.filter(l => !this.isLoteSeleccionado(l.idLote));

    if (filtro === '') {
      this.lotesFiltrados = lotesDisponibles;
    } else {
      this.lotesFiltrados = lotesDisponibles.filter(l => {
        const nombreLote = `manzana ${l.manzana} lote ${l.numeroLote}`.toLowerCase();
        return nombreLote.includes(filtro);
      });
    }
    this.mostrarLotes = true;
  }

  seleccionarLote(lote: Lote) {
    if (!this.isLoteSeleccionado(lote.idLote)) {
      this.lotesSeleccionados.push(lote);
      this.actualizarIdsLotes();
    }

    // Limpiar filtro y cerrar lista
    this.filtroLote = '';
    this.filtrarLotes(); // Para actualizar la lista de filtrados
    
    // Forzar el cierre de la lista en el siguiente ciclo de eventos
    setTimeout(() => {
      this.mostrarLotes = false; 
    }, 0);
  }

  eliminarLote(idLote: number | undefined) {
    if (idLote === undefined) return;
    this.lotesSeleccionados = this.lotesSeleccionados.filter(l => l.idLote !== idLote);
    this.actualizarIdsLotes();
    // Si la lista de lotes estaba abierta, actualizarla
    if (this.mostrarLotes) {
      this.filtrarLotes();
    }
  }

  isLoteSeleccionado(idLote: number | undefined): boolean {
    if (idLote === undefined) return false;
    return this.lotesSeleccionados.some(lo => lo.idLote === idLote);
  }

  private actualizarIdsLotes() {
    const ids = this.lotesSeleccionados.map(l => l.idLote!);
    this.contratoForm.get('idLotes')?.setValue(ids);
  }
  
  // =======================
  // FIN LÓGICA DE BÚSQUEDA
  // =======================

  // Maneja los cambios del formulario
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

    // 🟢 CORRECCIÓN CLAVE: Manejo de validadores para DIRECTO vs SEPARACION
    this.contratoForm.get('modalidadContrato')?.valueChanges.subscribe(modo => {
      if (modo === 'DIRECTO') {
        this.contratoForm.get('idSeparacion')?.reset();
        this.separaciones = [];
        
        // Establecer validadores requeridos para DIRECTO
        this.contratoForm.get('vendedorId')?.setValidators(Validators.required);
        this.contratoForm.get('idPrograma')?.setValidators(Validators.required);
        this.contratoForm.get('idClientes')?.setValidators(Validators.required);
        this.contratoForm.get('idLotes')?.setValidators(Validators.required);

        this.showSeparacionList = false;
        this.terminoBusquedaSeparacion = '';

        // Asegurar que el input de Programa muestre el nombre si ya tiene un ID
        if (this.contratoForm.value.idPrograma) {
          this.programaSeleccionado = this.programas.find(p => p.idPrograma === this.contratoForm.value.idPrograma) || null;
          this.filtroPrograma = this.programaSeleccionado?.nombrePrograma ?? '';
        }

      } else { // SEPARACION
        this.clientesSeleccionados = [];
        this.lotesSeleccionados = [];
        this.actualizarIdsClientes();
        this.actualizarIdsLotes();
        
        // Quitar validadores (los datos de cliente/lote vienen de la separación)
        this.contratoForm.get('vendedorId')?.clearValidators();
        this.contratoForm.get('idPrograma')?.clearValidators();
        this.contratoForm.get('idClientes')?.clearValidators(); // 👈 IMPORTANTE para que el botón se active
        this.contratoForm.get('idLotes')?.clearValidators();     // 👈 IMPORTANTE para que el botón se active
        
        this.contratoForm.get('vendedorId')?.reset();
        this.contratoForm.get('idPrograma')?.reset();
        
        // Limpiar filtros de búsqueda (y visualización)
        this.filtroVendedor = '';
        this.filtroPrograma = '';

        if (this.terminoBusquedaSeparacion.trim().length === 0) {
          this.showSeparacionList = false;
          this.separaciones = [];
        }
      }

    // Forzar re-evaluación de la validez
    this.contratoForm.get('vendedorId')?.updateValueAndValidity();
    this.contratoForm.get('idPrograma')?.updateValueAndValidity();
    this.contratoForm.get('idClientes')?.updateValueAndValidity();
    this.contratoForm.get('idLotes')?.updateValueAndValidity();
    });

    this.contratoForm.get('idPrograma')?.valueChanges.subscribe(id => {
      // Si el programa cambia, resetea los lotes seleccionados
      this.lotesSeleccionados = [];
      this.actualizarIdsLotes();
      this.filtroLote = '';
      this.mostrarLotes = false;

      if (id) {
        this.loteService.listarLotesPorPrograma(id).subscribe(lotes => {
          this.lotes = lotes;
          this.lotesFiltrados = [...lotes];
        });
      } else {
        this.lotes = [];
        this.lotesFiltrados = [];
      }
    });
  }

  // Actualiza el saldo calculado en el formulario
  actualizarSaldo() {
    const rawMonto = this.contratoForm.get('montoTotal')?.value || '0';
    const rawInicial = this.contratoForm.get('inicial')?.value || '0';

    const total = this.extractNumericValue(rawMonto);
    const inicial = this.extractNumericValue(rawInicial);

    const saldo = total - inicial;
    this.contratoForm.get('saldo')?.setValue(this.formatCurrency(saldo >= 0 ? saldo : 0), { emitEvent: false });
  }

  // Formatea el valor numérico como moneda
  private formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-US', { style: 'currency', currency: 'USD' }).format(value);
  }

  // Extrae el valor numérico de un string
  private extractNumericValue(value: any): number {
    if (typeof value !== 'string') {
      if (value === null || value === undefined) return 0;
      value = value.toString();
    }
    const numericValue = value.replace(/[^\d.]/g, "");
    return parseFloat(numericValue) || 0;
  }

  // Buscar separaciones basadas en un término de búsqueda
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

// 🟢 CORRECCIÓN: Usar SeparacionDTO para la lista, pero cargar el modelo Separacion para los detalles.
seleccionarSeparacion(sep: SeparacionDTO) {
    this.contratoForm.get('idSeparacion')?.setValue(sep.id);
    this.terminoBusquedaSeparacion = sep.text;
    this.showSeparacionList = false;

    // 🟢 PASO 1: Obtener detalles completos de la separación usando el ID
    this.separacionService.obtenerSeparacionPorId(sep.id!).subscribe({ 
        next: (separacionCompleta: Separacion) => {
            
            // 🟢 PASO 2: Cargar el Monto Total (y otros campos si aplican)
            const montoSeparacion = separacionCompleta.monto || 0;
            this.contratoForm.get('montoTotal')?.setValue(this.formatCurrency(montoSeparacion));
            // Al cargar monto, actualizamos el saldo
            this.actualizarSaldo(); 
            
            // -------------------------------------------------------------
            // 🟢 PASO 3: ASIGNAR IDs AL FORMULARIO DE CONTRATO
            // -------------------------------------------------------------
            
            // 3.1 Clientes
            if (separacionCompleta.cliente) {
                this.clientesSeleccionados = [separacionCompleta.cliente];
                this.actualizarIdsClientes(); // Establece idClientes: [ID_CLIENTE]
            } else {
                this.clientesSeleccionados = [];
                this.actualizarIdsClientes();
                this.toastr.warning('La separación no tiene un cliente principal asociado.', 'Aviso');
            }

            // 3.2 Lotes
            if (separacionCompleta.lote) {
                this.lotesSeleccionados = [separacionCompleta.lote];
                this.actualizarIdsLotes(); // Establece idLotes: [ID_LOTE]
                
                // 3.3 Programa 
                const idPrograma = separacionCompleta.lote.programa?.idPrograma || null;
                this.contratoForm.get('idPrograma')?.setValue(idPrograma);

                // Opcional: Mostrar el nombre del programa en el input
                if (separacionCompleta.lote.programa) {
                    this.programaSeleccionado = separacionCompleta.lote.programa;
                    this.filtroPrograma = separacionCompleta.lote.programa.nombrePrograma;
                }
                
            } else {
                this.lotesSeleccionados = [];
                this.actualizarIdsLotes();
                this.contratoForm.get('idPrograma')?.reset();
                this.toastr.warning('La separación no tiene un lote asociado.', 'Aviso');
            }
            
            // 3.4 Vendedor 
            if (separacionCompleta.vendedor) {
                this.contratoForm.get('vendedorId')?.setValue(separacionCompleta.vendedor.idVendedor);
                this.filtroVendedor = `${separacionCompleta.vendedor.nombre} ${separacionCompleta.vendedor.apellidos}`;
            } else {
                this.contratoForm.get('vendedorId')?.reset();
                this.filtroVendedor = '';
            }
            
            this.toastr.success('Separación seleccionada y detalles cargados.', '¡Éxito!');
        },
        error: (err) => {
            console.error('Error al cargar la separación completa:', err);
            this.toastr.error('No se pudieron cargar los detalles de la separación.', 'Error');
        }
    });
}

  // Guardar el contrato
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

  // Resetea el formulario después de guardar
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
    
    // Resetear filtros
    this.filtroVendedor = '';
    this.filtroPrograma = '';
    this.filtroCliente = '';
    this.filtroLote = '';

    this.vendedoresFiltrados = [...this.vendedores];
    this.programasFiltrados = [...this.programas];
    this.clientesFiltrados = [...this.clientes];
    this.lotes = [];
    this.lotesFiltrados = [];

    this.showSeparacionList = false;
    this.terminoBusquedaSeparacion = '';
  }

  get esContado(): boolean {
    return this.contratoForm.get('tipoContrato')?.value === 'CONTADO';
  }
}