// src/app/components/cliente-insertar/cliente-insertar.component.ts
import { Component, OnInit, AfterViewInit, ViewChild, ElementRef, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import * as bootstrap from 'bootstrap'; // Importamos Bootstrap
import { Cliente } from '../../models/cliente.model';
import { EstadoCliente } from '../../enums/estadocliente.enum';
import { TipoCliente } from '../../enums/tipocliente.enum';
import { Distrito } from '../../models/distrito.model';
import { ClienteService } from '../../services/cliente.service';
import { DistritoService } from '../../services/distrito.service';
import { ToastrService } from 'ngx-toastr';
import { NgxIntlTelInputModule, CountryISO, SearchCountryField } from 'ngx-intl-tel-input'; 


@Component({
  selector: 'app-cliente-insertar',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, NgxIntlTelInputModule],
  templateUrl: './cliente-insertar.html',
  styleUrls: ['./cliente-insertar.scss']
})
export class ClienteInsertarComponent implements OnInit, AfterViewInit { // ✅ Implementamos AfterViewInit

  // ✅ REFERENCIAS DE MODAL DE BOOTSTRAP
  @ViewChild('modalElement') modalElement!: ElementRef;
  private modal?: bootstrap.Modal;
  
  // ✅ EVENTO PARA NOTIFICAR AL PADRE
  @Output() clienteGuardado = new EventEmitter<void>();

  clienteForm!: FormGroup;
  distritos: Distrito[] = [];

  SearchCountryField = SearchCountryField;
  CountryISO = CountryISO;
  preferredCountries: CountryISO[] = [
    CountryISO.Peru,
    CountryISO.UnitedStates,
    CountryISO.Mexico,
    CountryISO.Colombia
  ];

  constructor(
    private fb: FormBuilder,
    private clienteService: ClienteService,
    private distritoService: DistritoService,
    public router: Router,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.inicializarFormulario();

    this.distritoService.listarDistritos().subscribe({
      next: (data) => {
        this.distritos = data;
      },
      error: (err) => {
        console.error('Error al cargar distritos:', err);
      }
    });
  }
  
  // ✅ Inicializa el modal de Bootstrap
  ngAfterViewInit(): void {
    this.modal = new bootstrap.Modal(this.modalElement.nativeElement);
  }

  // ✅ Método de inicialización separado (para el reset)
  private inicializarFormulario(): void {
    this.clienteForm = this.fb.group({
      nombre: ['', Validators.required],
      apellidos: [''],
      tipoCliente: [TipoCliente.NATURAL, Validators.required],
      numDoc: ['', Validators.required],
      celular: ['', Validators.required], 
      telefono: [''],
      direccion: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      estado: [EstadoCliente.ACTIVO, Validators.required],
      distrito: this.fb.group({
        idDistrito: ['', Validators.required],
      }),
    });
  }

  // ============================================================
  // ✅ MÉTODOS DE CONTROL DEL MODAL (NUEVO)
  // ============================================================
  
  /**
   * Método público llamado por el componente padre (ClientesComponent).
   * @param cliente (Opcional) Datos del cliente a editar.
   */
  public abrirModalCliente(cliente?: Cliente): void {
    this.clienteForm.reset();
    
    if (cliente) {
      // Editar cliente: Patch the form values
      this.clienteForm.patchValue({
        ...cliente,
        // Si el distrito existe, patchValue lo manejará en el grupo anidado
        distrito: { idDistrito: cliente.distrito?.idDistrito } 
      });
      // ✅ Si necesitas manejar el ID para la edición/actualización:
      // this.clienteForm.addControl('idCliente', this.fb.control(cliente.idCliente)); 
    } else {
      // Nuevo cliente: Asegurar valores por defecto y re-aplicar validadores
      this.inicializarFormulario(); 
    }

    this.modal?.show();
  }

  public cerrarModal(): void {
    this.modal?.hide();
  }
  // ============================================================


  onSubmit(): void {
    if (this.clienteForm.valid) {
      const formValue = this.clienteForm.value;
      
      // ✅ LÓGICA CLAVE: Extraer el número internacional del objeto del formulario
      const celularData: any = formValue.celular;
      let celularFinal = '';

      if (typeof celularData === 'object' && celularData?.internationalNumber) {
        celularFinal = celularData.internationalNumber; 
      } else {
        celularFinal = String(formValue.celular || '');
      }

      // Clonar el objeto y asignar el celular como string
      const nuevoCliente: Cliente = {
        ...formValue,
        celular: celularFinal
      };
      
      // Determinar si es INSERTAR (no hay ID) o ACTUALIZAR (hay ID, si lo manejas en el form)
      // Usaremos agregarCliente ya que este componente es para Insertar según tu HTML.
      
      this.clienteService.agregarCliente(nuevoCliente).subscribe({
        next: (response) => {
          this.toastr.success('Cliente insertado correctamente.', '¡Éxito!');
          this.cerrarModal(); // ✅ Cerramos el modal
          this.clienteGuardado.emit(); // ✅ Emitimos el evento
        },
        error: (error) => {
          console.error('Error al insertar el cliente:', error);
          this.toastr.error(error.message, 'Error');
        }
      });
    } else {
      this.clienteForm.markAllAsTouched();
    }
  }
}