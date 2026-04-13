import { Component, OnInit, ViewChild, ElementRef, Output, EventEmitter, OnDestroy, HostListener } from '@angular/core';
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

  // Referencia al enum para el HTML
  TipoCliente = TipoCliente;

  // Mismo listado de paises que en insertar
  paises: { nombre: string; bandera: string; nacionalidadM: string; nacionalidadF: string }[] = [
    { nombre: 'Venezuela', bandera: 'https://flagcdn.com/40x30/ve.png', nacionalidadM: 'venezolano', nacionalidadF: 'venezolana' },
    { nombre: 'Colombia', bandera: 'https://flagcdn.com/40x30/co.png', nacionalidadM: 'colombiano', nacionalidadF: 'colombiana' },
    { nombre: 'Chile', bandera: 'https://flagcdn.com/40x30/cl.png', nacionalidadM: 'chileno', nacionalidadF: 'chilena' },
    { nombre: 'Ecuador', bandera: 'https://flagcdn.com/40x30/ec.png', nacionalidadM: 'ecuatoriano', nacionalidadF: 'ecuatoriana' },
    { nombre: 'Bolivia', bandera: 'https://flagcdn.com/40x30/bo.png', nacionalidadM: 'boliviano', nacionalidadF: 'boliviana' },
    { nombre: 'Argentina', bandera: 'https://flagcdn.com/40x30/ar.png', nacionalidadM: 'argentino', nacionalidadF: 'argentina' },
    { nombre: 'Brasil', bandera: 'https://flagcdn.com/40x30/br.png', nacionalidadM: 'brasileño', nacionalidadF: 'brasileña' },
    { nombre: 'México', bandera: 'https://flagcdn.com/40x30/mx.png', nacionalidadM: 'mexicano', nacionalidadF: 'mexicana' },
    { nombre: 'España', bandera: 'https://flagcdn.com/40x30/es.png', nacionalidadM: 'español', nacionalidadF: 'española' },
    { nombre: 'EEUU', bandera: 'https://flagcdn.com/40x30/us.png', nacionalidadM: 'estadounidense', nacionalidadF: 'estadounidense' },
    { nombre: 'Otro', bandera: 'https://flagcdn.com/40x30/un.png', nacionalidadM: 'extranjero', nacionalidadF: 'extranjera' },
  ];

  paisSeleccionado: { nombre: string; bandera: string; nacionalidadM: string; nacionalidadF: string } | null = null;
  dropdownPaisAbierto = false;
  cargandoDatos = false;

  get esCarnetExtranjeria(): boolean {
    return this.clienteForm?.get('tipoCliente')?.value === TipoCliente.CE;
  }

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

  public abrirModal(id: number): void {
    this.clienteId = id;
    if (!this.modal) {
      this.modal = new bootstrap.Modal(this.modalElement.nativeElement);
    }
    // Limpiar estado anterior y mostrar spinner
    this.clienteForm.reset();
    this.paisSeleccionado = null;
    this.dropdownPaisAbierto = false;
    this.cargandoDatos = true;
    // Abrir modal inmediatamente — el usuario ve el spinner mientras carga
    this.modal.show();
    this.cargarDatosCliente();
  }

  private inicializarFormulario(): void {
    const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
    this.clienteForm = this.fb.group({
      idCliente: [null],
      nombre: ['', [Validators.required, Validators.pattern(/^[a-zA-ZáéíóúüÁÉÍÓÚÜñÑ\s]+$/)]],
      apellidos: ['', [Validators.pattern(/^[a-zA-ZáéíóúüÁÉÍÓÚÜñÑ\s]*$/)]],
      tipoCliente: [null, Validators.required],
      numDoc: ['', Validators.required],
      genero: ['', Validators.required],
      estadoCivil: [null, Validators.required],
      celular: ['', Validators.required],
      email: ['', [Validators.pattern(EMAIL_REGEX)]],
      direccion: ['', Validators.required],
      distrito: this.fb.group({ idDistrito: ['', Validators.required] }),
      estado: [null, Validators.required],
      telefono: [''],
      fechaRegistro: [{ value: '', disabled: true }],
      nacionalidad: [null],
    });

    this.clienteForm.get('tipoCliente')?.valueChanges.subscribe(tipo => {
      this.actualizarValidacionDocumento(tipo);
      this.actualizarValidacionNacionalidad(tipo);
    });
  }

  private actualizarValidacionDocumento(tipo: string): void {
    const control = this.clienteForm.get('numDoc');
    if (!control) return;
    if (tipo === TipoCliente.CE) {
      control.setValidators([Validators.required, Validators.minLength(9), Validators.maxLength(12)]);
    } else {
      const length = tipo === 'NATURAL' ? 8 : 11;
      control.setValidators([Validators.required, Validators.minLength(length), Validators.maxLength(length)]);
    }
    control.updateValueAndValidity();
  }

  private actualizarValidacionNacionalidad(tipo: string): void {
    const ctrl = this.clienteForm.get('nacionalidad');
    if (!ctrl) return;
    if (tipo === TipoCliente.CE) {
      ctrl.setValidators([Validators.required]);
    } else {
      ctrl.clearValidators();
      ctrl.setValue(null);
    }
    ctrl.updateValueAndValidity();
  }

  // Al cambiar pais recalcula la nacionalidad segun genero actual
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.pais-dropdown')) {
      this.dropdownPaisAbierto = false;
    }
  }

  seleccionarPais(pais: { nombre: string; bandera: string; nacionalidadM: string; nacionalidadF: string }): void {
    this.paisSeleccionado = pais;
    this.dropdownPaisAbierto = false;
    const genero = this.clienteForm.get('genero')?.value;
    const esFemenino = genero === Genero.Femenino;
    this.clienteForm.get('nacionalidad')?.setValue(
      esFemenino ? pais.nacionalidadF : pais.nacionalidadM,
      { emitEvent: false }
    );
  }

  onPaisChange(event: Event): void { }

  // Devuelve el nombre del pais a partir de la nacionalidad guardada
  // Para preseleccionar el select cuando se carga un cliente CE existente
  paisDesdeNacionalidad(nacionalidad: string | null): string {
    if (!nacionalidad) return '';
    const pais = this.paises.find(p =>
      p.nacionalidadM === nacionalidad.toLowerCase() ||
      p.nacionalidadF === nacionalidad.toLowerCase()
    );
    return pais?.nombre || '';
  }

  cargarDatosCliente(): void {
    this.clienteService.obtenerClientePorId(this.clienteId).subscribe({
      next: (cliente) => {
        if (cliente) {
          const fechaFormato = cliente.fechaRegistro
            ? new Date(cliente.fechaRegistro).toISOString().substring(0, 10) : '';
          this.clienteForm.patchValue({
            ...cliente,
            fechaRegistro: fechaFormato,
            distrito: { idDistrito: cliente.distrito?.idDistrito }
          });
          this.actualizarValidacionDocumento(cliente.tipoCliente);
          this.actualizarValidacionNacionalidad(cliente.tipoCliente);
          if (cliente.tipoCliente === 'CE' && cliente.nacionalidad) {
            const pais = this.paises.find(p =>
              p.nacionalidadM === cliente.nacionalidad?.toLowerCase() ||
              p.nacionalidadF === cliente.nacionalidad?.toLowerCase()
            );
            this.paisSeleccionado = pais || null;
          }
        }
        this.cargandoDatos = false;
      },
      error: () => { this.cargandoDatos = false; }
    });
  }

  onSubmit(): void {
    if (this.clienteForm.valid) {
      const raw = this.clienteForm.getRawValue();
      const payload = {
        ...raw,
        // Si no es CE, aseguramos enviar null
        nacionalidad: raw.tipoCliente === TipoCliente.CE ? raw.nacionalidad : null
      };
      this.clienteService.actualizarCliente(this.clienteId, payload).subscribe({
        next: () => {
          this.toastr.success('Cliente actualizado correctamente.');
          this.modal?.hide();
          this.clienteActualizado.emit();
        },
        error: (err) => this.toastr.error(err.error?.message || 'Error al actualizar')
      });
    }
  }

  cerrarModal(): void { this.modal?.hide(); }

  formatearTexto(event: any, controlName: string): void {
    const input = event.target as HTMLInputElement;
    let valor = input.value.toLowerCase().split(' ')
      .map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
    this.clienteForm.get(controlName)?.setValue(valor, { emitEvent: false });
  }
}