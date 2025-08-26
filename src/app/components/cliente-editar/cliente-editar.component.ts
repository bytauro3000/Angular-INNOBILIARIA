import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

import { ClienteService } from '../../services/cliente.service';
import { Cliente } from '../../models/cliente.model';
import { DistritoService } from '../../services/distrito.service';
import { Distrito } from '../../models/distrito.model';

@Component({
  selector: 'app-cliente-editar',
  imports: [ReactiveFormsModule, CommonModule], 
  templateUrl: './cliente-editar.html',
  styleUrls: ['./cliente-editar.scss']
})
export class ClienteEditarComponent implements OnInit {

  clienteForm!: FormGroup;
  clienteId!: number;
  distritos: Distrito[] = []; // ✅ Agregado: Propiedad para guardar la lista de distritos
  
  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private clienteService: ClienteService,
    private distritoService: DistritoService, // ✅ Inyectado: Para obtener la lista de distritos
    public router: Router
  ) { }

  ngOnInit(): void {
    // 1. Carga la lista de distritos para el <select>
    this.distritoService.listarDistritos().subscribe({
      next: (data) => {
        this.distritos = data;
        console.log('Distritos cargados:', this.distritos);
      },
      error: (err) => {
        console.error('Error al cargar la lista de distritos:', err);
      }
    });

    // 2. Obtiene el ID del cliente de la URL y carga sus datos.
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.clienteId = Number(id);
        
        // Carga los datos del cliente por su ID (asumiendo que tu API soporta esta búsqueda).
        // NOTA: Si 'id' en la URL es el 'numDoc', necesitas un método en tu servicio para ello.
        // Aquí asumimos que es el 'idCliente'.
        this.clienteService.actualizarCliente(this.clienteId, {} as Cliente).subscribe({
          next: (cliente) => {
            // ✅ Llamamos a crearFormulario solo después de que el cliente se ha cargado.
            this.crearFormulario(cliente);
          },
          error: (err) => {
            console.error('Error al obtener los datos del cliente:', err);
          }
        });
      }
    });
  }

  // ✅ Modificado: Crea el formulario y lo llena con los datos del cliente,
  // incluyendo el ID del distrito.
  crearFormulario(cliente: Cliente): void {
    this.clienteForm = this.fb.group({
      idCliente: [cliente.idCliente, Validators.required],
      nombre: [cliente.nombre, Validators.required],
      apellidos: [cliente.apellidos],
      tipoCliente: [cliente.tipoCliente, Validators.required],
      numDoc: [cliente.numDoc, Validators.required],
      celular: [cliente.celular, Validators.required],
      telefono: [cliente.telefono],
      direccion: [cliente.direccion, Validators.required],
      email: [cliente.email, [Validators.required, Validators.email]],
      estado: [cliente.estado, Validators.required],
      // ✅ Aquí es donde asignamos el ID del distrito al control del formulario.
      distrito: this.fb.group({
        idDistrito: [cliente.distrito.idDistrito, Validators.required]
      })
    });
  }

  // Envía los datos actualizados al servicio para guardar los cambios.
  actualizarCliente(): void {
    if (this.clienteForm.valid) {
      const clienteActualizado: Cliente = this.clienteForm.value;
      
      this.clienteService.actualizarCliente(this.clienteId, clienteActualizado).subscribe({
        next: () => {
          console.log('Cliente actualizado con éxito!');
          this.router.navigate(['/secretaria-menu/clientes']); 
        },
        error: (error) => {
          console.error('Error al actualizar el cliente:', error);
        }
      });
    }
  }
}