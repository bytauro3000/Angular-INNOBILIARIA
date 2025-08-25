// src/app/components/cliente-insertar/cliente-insertar.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';

// ✅ Importa tu modelo y los enums
import { Cliente } from '../../models/cliente.model';
import { EstadoCliente } from '../../enums/estadocliente.enum';
import { TipoCliente } from '../../enums/tipocliente.enum';
import { Distrito } from '../../models/distrito.model';

// ✅ Importa tu servicio de clientes
import { ClienteService } from '../../services/cliente.service';

@Component({
  selector: 'app-cliente-insertar',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './cliente-insertar.html',
  styleUrls: ['./cliente-insertar.scss']
})
export class ClienteInsertarComponent implements OnInit {

  clienteForm!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private clienteService: ClienteService,
    public router: Router
  ) { }

  ngOnInit(): void {
    // ✅ Inicializa el formulario con todos los campos del modelo Cliente
    // Usa un objeto anidado para la relación 'distrito'
    this.clienteForm = this.fb.group({
      nombre: ['', Validators.required],
      apellidos: [''],
      tipoCliente: [TipoCliente.NATURAL, Validators.required],
      dni: [''],
      ruc: [''],
      celular: ['', Validators.required],
      telefono: [''],
      direccion: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      estado: [EstadoCliente.ACTIVO, Validators.required],
      // ✅ Campo anidado para la relación 'distrito'
      // Asume que necesitas el id del distrito para insertarlo
      distrito: this.fb.group({
        idDistrito: ['', Validators.required],
      }),
    });
  }

  onSubmit(): void {
    if (this.clienteForm.valid) {
      // ✅ Convierte los datos del formulario a la interfaz Cliente
      const nuevoCliente: Cliente = this.clienteForm.value;

      // ✅ Asegúrate de llamar al método 'agregarCliente' de tu servicio
      this.clienteService.agregarCliente(nuevoCliente).subscribe({
        next: (response) => {
          console.log('Cliente insertado con éxito', response);
          this.router.navigate(['/secretaria-menu/clientes']);
        },
        error: (error) => {
          console.error('Error al insertar el cliente:', error);
        }
      });
    } else {
      console.log('El formulario no es válido. Por favor, revisa los campos.');
      this.clienteForm.markAllAsTouched();
    }
  }
}
