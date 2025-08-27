import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ToastrService } from 'ngx-toastr';

import { ClienteService } from '../../services/cliente.service';
import { Cliente } from '../../models/cliente.model';
import { DistritoService } from '../../services/distrito.service';
import { Distrito } from '../../models/distrito.model';
import { EstadoCliente } from '../../enums/estadocliente.enum';
import { TipoCliente } from '../../enums/tipocliente.enum';   // ✅ importación añadida

@Component({
  selector: 'app-cliente-editar',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './cliente-editar.html',
  styleUrls: ['./cliente-editar.scss']
})
export class ClienteEditarComponent implements OnInit {

  clienteForm!: FormGroup;
  clienteId!: number;
  distritos: Distrito[] = [];

  // 👉 listas de valores de los enums para los <select>
  estadosCliente = Object.values(EstadoCliente);
  tiposCliente = Object.values(TipoCliente);   // ✅ añadido

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private clienteService: ClienteService,
    private distritoService: DistritoService,
    private toastr: ToastrService,
    public router: Router
  ) { }

  ngOnInit(): void {
    // Inicialización del formulario
    this.clienteForm = this.fb.group({
      idCliente: [null],
      nombre: ['', Validators.required],
      apellidos: [''],
      tipoCliente: [null, Validators.required],  // ✅ usar null como default
      numDoc: ['', Validators.required],
      celular: ['', Validators.required],
      telefono: [''],
      direccion: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      estado: [null, Validators.required],
      fechaRegistro: ['', Validators.required],
      distrito: this.fb.group({
        idDistrito: ['', Validators.required]
      })
    });

    // 1. Cargar distritos
    this.distritoService.listarDistritos().subscribe({
      next: (data) => {
        this.distritos = data;
        console.log('Distritos cargados:', this.distritos);
      },
      error: (err) => {
        console.error('Error al cargar distritos:', err);
        this.toastr.error('No se pudo cargar la lista de distritos.', 'Error');
      }
    });

    // 2. Obtener cliente por ID
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.clienteId = Number(id);

        this.clienteService.obtenerClientePorId(this.clienteId).subscribe({
          next: (cliente) => {
            if (cliente) {
              const fechaFormato = cliente.fechaRegistro
                ? new Date(cliente.fechaRegistro).toISOString().substring(0, 10)
                : '';

              // ⚡ normalizar los enums recibidos del backend
              const estadoNormalizado = cliente.estado
                ? cliente.estado.toString().toUpperCase() as EstadoCliente
                : null;

              const tipoClienteNormalizado = cliente.tipoCliente
                ? cliente.tipoCliente.toString().toUpperCase() as TipoCliente
                : null;

              this.clienteForm.patchValue({
                idCliente: cliente.idCliente,
                nombre: cliente.nombre,
                apellidos: cliente.apellidos,
                tipoCliente: tipoClienteNormalizado,  // ✅ ya normalizado
                numDoc: cliente.numDoc,
                celular: cliente.celular,
                telefono: cliente.telefono,
                direccion: cliente.direccion,
                email: cliente.email,
                estado: estadoNormalizado,
                fechaRegistro: fechaFormato,
                distrito: {
                  idDistrito: cliente.distrito.idDistrito
                }
              });
            } else {
              this.toastr.error('Cliente no encontrado.', 'Error');
              this.router.navigate(['/secretaria-menu/clientes']);
            }
          },
          error: (err) => {
            console.error('Error al obtener cliente:', err);
            this.toastr.error('No se pudo cargar el cliente.', 'Error');
            this.router.navigate(['/secretaria-menu/clientes']);
          }
        });
      } else {
        this.toastr.error('ID de cliente no proporcionado.', 'Error');
        this.router.navigate(['/secretaria-menu/clientes']);
      }
    });
  }

  actualizarCliente(): void {
    if (this.clienteForm.valid) {
      const clienteActualizado: Cliente = this.clienteForm.value;

      this.clienteService.actualizarCliente(this.clienteId, clienteActualizado).subscribe({
        next: () => {
          this.toastr.success('Cliente actualizado con éxito.', '¡Éxito!');
          this.router.navigate(['/secretaria-menu/clientes']);
        },
        error: (error) => {
          console.error('Error al actualizar cliente:', error);
          this.toastr.error('Error al actualizar el cliente.', 'Error');
        }
      });
    } else {
      this.toastr.warning('Por favor, complete todos los campos requeridos.', 'Advertencia');
    }
  }
}
