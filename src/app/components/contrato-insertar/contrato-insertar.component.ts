import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ContratoService } from '../../services/contrato.service';
import { ClienteService } from '../../services/cliente.service'; // Debes tener este para cargar clientes
import { LoteService } from '../../services/lote.service';       // Debes tener este para cargar lotes
import { SeparacionService } from '../../services/separacion.service'; // Servicio para separar (buscar separaciones)
import { ContratoRequestDTO } from '../../dto/contratorequest.dto';
import { ContratoResponseDTO } from '../../dto/contratoreponse.dto';
import { ClienteResponseDTO } from '../../dto/clienteresponse.dto';
import { Lote } from '../../models/lote.model';

@Component({
  selector: 'app-contrato-insertar',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './contrato-insertar.html',
  styleUrls: ['./contrato-insertar.css']
})
export class ContratoInsertarComponent implements OnInit {

  contratoForm!: FormGroup;

  clientesDisponibles: ClienteResponseDTO[] = [];
  lotesDisponibles: Lote[] = [];
  separacionesDisponibles: any[] = []; // Cambia según tu modelo de Separacion

  clientesSeleccionados: ClienteResponseDTO[] = [];
  lotesSeleccionados: Lote[] = [];

  modoRegistroValues = ['MANUAL', 'SEPARACION'];
  tipoContratoValues = ['CONTADO', 'FINANCIADO'];

  constructor(
    private fb: FormBuilder,
    private contratoService: ContratoService,
    private clienteService: ClienteService,
    private loteService: LoteService,
    private separacionService: SeparacionService,
  ) { }

  ngOnInit(): void {
    this.initForm();
    this.loadClientes();
    this.loadLotes();

    // Actualizar saldo automáticamente cuando cambian montoTotal o inicial
    this.contratoForm.get('montoTotal')?.valueChanges.subscribe(() => this.actualizarSaldo());
    this.contratoForm.get('inicial')?.valueChanges.subscribe(() => this.actualizarSaldo());

    // Cuando cambia el modo de registro, limpiar campos y listas para evitar errores
    this.contratoForm.get('modoRegistro')?.valueChanges.subscribe(modo => {
      if (modo === 'MANUAL') {
        this.contratoForm.get('idSeparacion')?.setValue(null);
        this.separacionesDisponibles = [];
      } else {
        // En separacion limpiamos clientes y lotes seleccionados
        this.clientesSeleccionados = [];
        this.lotesSeleccionados = [];
      }
    });
  }

  private initForm() {
    this.contratoForm = this.fb.group({
      modoRegistro: ['MANUAL', Validators.required],
      tipoContrato: ['FINANCIADO', Validators.required],
      fechaContrato: ['', Validators.required],
      vendedorId: [null, Validators.required],
      montoTotal: [0, Validators.required],
      inicial: [0],
      saldo: [{value: 0, disabled: true}],
      cantidadLetras: [0],
      observaciones: [''],
      idClientes: [[]],  // IDs de clientes seleccionados
      idLotes: [[]],    // IDs de lotes seleccionados
      idSeparacion: [null], // ID de separacion cuando modoSeparacion
    });
  }

  private loadClientes() {
    this.clienteService.listarClientes().subscribe(clis => this.clientesDisponibles = clis);
  }

  private loadLotes() {
    this.loteService.listarLotes().subscribe(lotes => this.lotesDisponibles = lotes);
  }

  buscarSeparaciones(filtro: string) {
    if (!filtro) {
      this.separacionesDisponibles = [];
      return;
    }
    this.separacionService.buscarSeparaciones(filtro).subscribe(seps => {
      this.separacionesDisponibles = seps;
    });
  }

  agregarCliente(clienteId: number) {
    if (!clienteId) return;
    const cliente = this.clientesDisponibles.find(c => c.idCliente === +clienteId);
    if (!cliente) return;

    // Evitar duplicados
    if (!this.clientesSeleccionados.some(c => c.idCliente === cliente.idCliente)) {
      this.clientesSeleccionados.push(cliente);
      this.actualizarIdsClientes();
    }
  }

  eliminarCliente(clienteId: number) {
    this.clientesSeleccionados = this.clientesSeleccionados.filter(c => c.idCliente !== clienteId);
    this.actualizarIdsClientes();
  }

  private actualizarIdsClientes() {
    const ids = this.clientesSeleccionados.map(c => c.idCliente);
    this.contratoForm.get('idClientes')?.setValue(ids);
  }

  agregarLote(loteId: number) {
    if (!loteId) return;
    const lote = this.lotesDisponibles.find(l => l.idLote === +loteId);
    if (!lote) return;

    // Evitar duplicados
    if (!this.lotesSeleccionados.some(l => l.idLote === lote.idLote)) {
      this.lotesSeleccionados.push(lote);
      this.actualizarIdsLotes();
    }
  }

  eliminarLote(loteId: number) {
    this.lotesSeleccionados = this.lotesSeleccionados.filter(l => l.idLote !== loteId);
    this.actualizarIdsLotes();
  }

  private actualizarIdsLotes() {
    const ids = this.lotesSeleccionados.map(l => l.idLote!);
    this.contratoForm.get('idLotes')?.setValue(ids);
  }

  actualizarSaldo() {
    const total = +this.contratoForm.get('montoTotal')?.value || 0;
    const inicial = +this.contratoForm.get('inicial')?.value || 0;
    const saldo = total - inicial;
    this.contratoForm.get('saldo')?.setValue(saldo >= 0 ? saldo : 0, { emitEvent: false });
  }

  seleccionarSeparacion(idSeparacion: number) {
    this.contratoForm.get('idSeparacion')?.setValue(idSeparacion);
    // Aquí puedes cargar los clientes/lotes relacionados si quieres autocompletar
    // Por ejemplo:
    // this.separacionService.obtenerPorId(idSeparacion).subscribe(data => {
    //    this.clientesSeleccionados = data.clientes;
    //    this.lotesSeleccionados = data.lotes;
    //    this.actualizarIdsClientes();
    //    this.actualizarIdsLotes();
    // });
  }

  guardarContrato() {
    if (this.contratoForm.invalid) {
      this.contratoForm.markAllAsTouched();
      return;
    }

    const request: ContratoRequestDTO = {
      contrato: {
        idContrato: 0, // nuevo
        fechaContrato: this.contratoForm.value.fechaContrato,
        tipoContrato: this.contratoForm.value.tipoContrato,
        montoTotal: this.contratoForm.value.montoTotal,
        inicial: this.contratoForm.value.inicial,
        saldo: this.contratoForm.get('saldo')?.value,
        cantidadLetras: this.contratoForm.value.cantidadLetras,
        observaciones: this.contratoForm.value.observaciones,
        usuario: { id: 1, nombres: '', apellidos: '', correo: '', contrasena: '', estado: 1, fechaRegistro: '', rol: { id: 1, nombre: '' } }, // Ajusta según contexto
        vendedor: { idVendedor: this.contratoForm.value.vendedorId }, // Ajusta según modelo
        letrasCambio: [],
        clientes: [],
        lotes: []
      },
      idClientes: this.contratoForm.value.idClientes,
      idLotes: this.contratoForm.value.idLotes,
      idSeparacion: this.contratoForm.value.idSeparacion
    };

    this.contratoService.guardarContrato(request).subscribe({
      next: (res) => {
        alert('Contrato guardado con éxito');
        this.contratoForm.reset({
          modoRegistro: 'MANUAL',
          tipoContrato: 'FINANCIADO',
          montoTotal: 0,
          inicial: 0,
          saldo: 0,
          cantidadLetras: 0,
        });
        this.clientesSeleccionados = [];
        this.lotesSeleccionados = [];
      },
      error: (err) => {
        alert('Error al guardar contrato');
        console.error(err);
      }
    });
  }
}
