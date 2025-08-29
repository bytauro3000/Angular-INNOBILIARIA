// contrato-insertar.component.ts

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {FormBuilder,FormGroup,Validators,ReactiveFormsModule,FormsModule} from '@angular/forms';
import Cleave from 'cleave.js';
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

@Component({
  selector: 'app-contrato-insertar',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, FormsModule], // ✅ Añade FormsModule aquí
  templateUrl: './contrato-insertar.html',
  styleUrls: ['./contrato-insertar.scss']
})


export class ContratoInsertarComponent implements OnInit {
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
  
  // Nuevas propiedades para la lógica de búsqueda de separaciones
  terminoBusquedaSeparacion: string = '';
  showSeparacionList: boolean = false;

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

  ngOnInit(): void {
    this.initForm();
    this.cargarCombos();
    this.handleFormChanges();
 // Inicializa Cleave aquí para formatear montoTotal
    new Cleave('#montoTotal', {
      prefix: '$ ', // Símbolo de moneda
      numeral: true,
      numeralThousandsGroupStyle: 'thousand',
    });

    // Agregar formateo a inicial y saldo
    new Cleave('#inicial', {
      prefix: '$ ', // Símbolo de moneda
      numeral: true,
      numeralThousandsGroupStyle: 'thousand',
    });

    new Cleave('#saldo', {
      prefix: '$ ', // Símbolo de moneda
      numeral: true,
      numeralThousandsGroupStyle: 'thousand',
    });
    
  }

limpiarSiEsCero(controlName: string) {
  const control = this.contratoForm.get(controlName);
  if (control?.value === 0 || control?.value === '0') {
    control.setValue('');
  }
}
  
  private initForm() {
    this.contratoForm = this.fb.group({
      modalidadContrato: ['DIRECTO', Validators.required],
      tipoContrato: ['FINANCIADO', Validators.required], //Inicializado con valor por defecto
      fechaContrato: ['', Validators.required],
      vendedorId: [null, Validators.required],
      idPrograma: [null, Validators.required],
      idSeparacion: [null],
      // Campos numéricos inicializados con 0
      montoTotal: [0, [Validators.required, Validators.min(0)]],
      inicial: [0, [Validators.min(0)]],
      saldo: [{ value: 0, disabled: true }],
      cantidadLetras: [0, [Validators.min(0)]],
      observaciones: [''],
      idClientes: [[], Validators.required],
      idLotes: [[], Validators.required]
    });
  }

  private cargarCombos() {
    this.programaService.listarProgramas().subscribe(p => (this.programas = p));
    this.vendedorService.listarVendedores().subscribe(v => (this.vendedores = v));
    this.clienteService.listarClientes().subscribe(c => (this.clientes = c));
  }

  private handleFormChanges() {
  this.contratoForm.get('montoTotal')?.valueChanges.subscribe(() => this.actualizarSaldo());
  this.contratoForm.get('inicial')?.valueChanges.subscribe(() => this.actualizarSaldo());

  this.contratoForm.get('tipoContrato')?.valueChanges.subscribe(tipo => {
    if (tipo === 'CONTADO') {
      this.contratoForm.get('inicial')?.disable();
      this.contratoForm.get('cantidadLetras')?.disable();
    } else {
      this.contratoForm.get('inicial')?.enable();
      this.contratoForm.get('cantidadLetras')?.enable();
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
  this.contratoForm.get('saldo')?.setValue(saldo >= 0 ? saldo : 0, { emitEvent: false });
}
private extractNumericValue(value: any): number {
  if (typeof value !== 'string') {
    // Si no es string, intentar convertir a string o devolver 0
    if (value === null || value === undefined) return 0;
    value = value.toString();
  }
  const numericValue = value.replace(/[^0-9.-]+/g, "");
  return parseFloat(numericValue) || 0;
}
  //Método modificado para controlar la visibilidad y el servicio de búsqueda
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
    return;
  }

  // Convertir los campos numéricos a valores numéricos
  const montoTotal = this.extractNumericValue(this.contratoForm.value.montoTotal);
  const inicial = this.extractNumericValue(this.contratoForm.value.inicial);
  const saldo = this.extractNumericValue(this.contratoForm.get('saldo')?.value);

  const request: ContratoRequestDTO = {
    fechaContrato: this.contratoForm.value.fechaContrato,
    tipoContrato: this.contratoForm.value.tipoContrato,
    montoTotal: montoTotal,  // Se asegura que es un número
    inicial: inicial,        // Se asegura que es un número
    saldo: saldo,            // Se asegura que es un número
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
      montoTotal: 0,
      inicial: 0,
      saldo: 0,
      cantidadLetras: 0
    });
    this.clientesSeleccionados = [];
    this.lotesSeleccionados = [];
    this.separaciones = [];
    this.lotes = [];
    this.showSeparacionList = false; //Reinicia el estado de visibilidad
    this.terminoBusquedaSeparacion = ''; //Reinicia el campo de búsqueda
  }
  // ✅ Aquí lo agregas
  get esContado(): boolean {
    return this.contratoForm.get('tipoContrato')?.value === 'CONTADO';
  }
}