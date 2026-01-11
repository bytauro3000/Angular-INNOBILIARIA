import { Component, OnInit, ViewChild, ElementRef, Output, EventEmitter, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import * as bootstrap from 'bootstrap'; 
import { ToastrService } from 'ngx-toastr';

import { ClienteService } from '../../services/cliente.service';
import { Cliente } from '../../models/cliente.model';
import { DistritoService } from '../../services/distrito.service';
import { Distrito } from '../../models/distrito.model';
import { EstadoCliente } from '../../enums/estadocliente.enum';
import { TipoCliente } from '../../enums/tipocliente.enum';
import { Genero } from '../../enums/Genero.enum';
import { EstadoCivil } from '../../enums/estadocivil.enum';

@Component({
  selector: 'app-cliente-editar',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './cliente-editar.html',
  styleUrls: ['./cliente-editar.scss']
})
export class ClienteEditarComponent implements OnInit {

  @ViewChild('modalEditarElement') modalElement!: ElementRef;
  private modal?: bootstrap.Modal;

  @Output() clienteActualizado = new EventEmitter<void>();

  clienteForm!: FormGroup;
  clienteId!: number;
  distritos: Distrito[] = [];

  estadosCliente = Object.values(EstadoCliente);
  tiposCliente = Object.values(TipoCliente);
  generos = Object.values(Genero);
  estadosCiviles = Object.values(EstadoCivil);

  constructor(
    private fb: FormBuilder,
    private clienteService: ClienteService,
    private distritoService: DistritoService,
    private toastr: ToastrService
  ) { }

  ngOnInit(): void {
    this.inicializarFormulario();
    this.distritoService.listarDistritos().subscribe({
      next: (data) => this.distritos = data
    });
  }

  // Método para que el Listado de Clientes abra este modal
  public abrirModal(id: number): void {
    this.clienteId = id;
    if (!this.modal) {
      this.modal = new bootstrap.Modal(this.modalElement.nativeElement);
    }
    this.cargarDatosCliente();
    this.modal.show();
  }

  private inicializarFormulario(): void {
    this.clienteForm = this.fb.group({
      idCliente: [null],
      nombre: ['', [Validators.required, Validators.pattern(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)]],
      apellidos: ['', [Validators.pattern(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]*$/)]],
      tipoCliente: [null, Validators.required],
      numDoc: ['', Validators.required],
      genero: ['', Validators.required],
      estadoCivil: [null, Validators.required],
      celular: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      direccion: ['', Validators.required],
      distrito: this.fb.group({ idDistrito: ['', Validators.required] }),
      estado: [null, Validators.required],
      telefono: [''],
      fechaRegistro: [{ value: '', disabled: true }]
    });

    this.clienteForm.get('tipoCliente')?.valueChanges.subscribe(tipo => this.actualizarValidacionDocumento(tipo));
  }

  private actualizarValidacionDocumento(tipo: string): void {
    const control = this.clienteForm.get('numDoc');
    const length = tipo === 'NATURAL' ? 8 : 11;
    control?.setValidators([Validators.required, Validators.minLength(length), Validators.maxLength(length)]);
    control?.updateValueAndValidity();
  }

  cargarDatosCliente(): void {
    this.clienteService.obtenerClientePorId(this.clienteId).subscribe({
      next: (cliente) => {
        if (cliente) {
          const fechaFormato = cliente.fechaRegistro ? new Date(cliente.fechaRegistro).toISOString().substring(0, 10) : '';
          this.clienteForm.patchValue({
            ...cliente,
            fechaRegistro: fechaFormato,
            distrito: { idDistrito: cliente.distrito?.idDistrito }
          });
          this.actualizarValidacionDocumento(cliente.tipoCliente);
        }
      }
    });
  }

  onSubmit(): void {
    if (this.clienteForm.valid) {
      this.clienteService.actualizarCliente(this.clienteId, this.clienteForm.getRawValue()).subscribe({
        next: () => {
          this.toastr.success('Cliente actualizado correctamente.');
          this.modal?.hide();
          this.clienteActualizado.emit();
        },
        error: (err) => this.toastr.error('Error: ' + err.message)
      });
    }
  }

  cerrarModal(): void { this.modal?.hide(); }

  formatearTexto(event: any, controlName: string): void {
    const input = event.target as HTMLInputElement;
    let valor = input.value.toLowerCase().split(' ').map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
    this.clienteForm.get(controlName)?.setValue(valor, { emitEvent: false });
  }
}