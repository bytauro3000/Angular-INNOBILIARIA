// src/app/components/cliente-insertar/cliente-insertar.component.ts

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Cliente } from '../../models/cliente.model';
import { EstadoCliente } from '../../enums/estadocliente.enum';
import { TipoCliente } from '../../enums/tipocliente.enum';
import { Distrito } from '../../models/distrito.model';
import { ClienteService } from '../../services/cliente.service';
import { DistritoService } from '../../services/distrito.service';
import { ToastrService } from 'ngx-toastr'; // ✅ Importa ToastrService


@Component({
  selector: 'app-cliente-insertar',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './cliente-insertar.html',
  styleUrls: ['./cliente-insertar.scss']
})
export class ClienteInsertarComponent implements OnInit {
  clienteForm!: FormGroup;
  distritos: Distrito[] = [];

  constructor(
    private fb: FormBuilder,
    private clienteService: ClienteService,
    private distritoService: DistritoService,
    public router: Router,
    private toastr: ToastrService // ✅ Inyecta ToastrService
  ) {}

  ngOnInit(): void {
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

    this.distritoService.listarDistritos().subscribe({
      next: (data) => {
        this.distritos = data;
      },
      error: (err) => {
        console.error('Error al cargar distritos:', err);
      }
    });
  }

  onSubmit(): void {
    if (this.clienteForm.valid) {
      const nuevoCliente: Cliente = this.clienteForm.value;
      this.clienteService.agregarCliente(nuevoCliente).subscribe({
        next: (response) => {
          this.toastr.success('Cliente insertado correctamente.', '¡Éxito!'); // ✅ Muestra un toast de éxito
          this.router.navigate(['/secretaria-menu/clientes']);
        },
        error: (error) => {
          console.error('Error al insertar el cliente:', error);
          this.toastr.error(error.message, 'Error'); // ✅ Muestra un toast de error con el mensaje del backend
        }
      });
    } else {
      this.clienteForm.markAllAsTouched();
    }
  }
}