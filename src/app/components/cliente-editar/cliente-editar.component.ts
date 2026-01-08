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
import { TipoCliente } from '../../enums/tipocliente.enum';
import { Genero } from '../../enums/Genero.enum'; // 🟢 Importación añadida

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

  estadosCliente = Object.values(EstadoCliente);
  tiposCliente = Object.values(TipoCliente);
  generos = Object.values(Genero); // 🟢 Lista para el select de géneros

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private clienteService: ClienteService,
    private distritoService: DistritoService,
    private toastr: ToastrService,
    public router: Router
  ) { }

  ngOnInit(): void {
    this.clienteForm = this.fb.group({
      idCliente: [null],
      nombre: ['', Validators.required],
      apellidos: [''],
      tipoCliente: [null, Validators.required],
      numDoc: ['', Validators.required],
      celular: ['', Validators.required],
      telefono: [''],
      direccion: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      genero: ['', Validators.required], // 🟢 Campo añadido
      estado: [null, Validators.required],
      fechaRegistro: ['', Validators.required],
      distrito: this.fb.group({
        idDistrito: ['', Validators.required]
      })
    });

    this.distritoService.listarDistritos().subscribe({
      next: (data) => this.distritos = data,
      error: (err) => this.toastr.error('No se pudo cargar la lista de distritos.')
    });

    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.clienteId = Number(id);
        this.cargarDatosCliente();
      }
    });
  }

  cargarDatosCliente(): void {
    this.clienteService.obtenerClientePorId(this.clienteId).subscribe({
      next: (cliente) => {
        if (cliente) {
          const fechaFormato = cliente.fechaRegistro
            ? new Date(cliente.fechaRegistro).toISOString().substring(0, 10)
            : '';

          this.clienteForm.patchValue({
            idCliente: cliente.idCliente,
            nombre: cliente.nombre,
            apellidos: cliente.apellidos,
            tipoCliente: cliente.tipoCliente?.toString().toUpperCase(),
            numDoc: cliente.numDoc,
            celular: cliente.celular,
            telefono: cliente.telefono,
            direccion: cliente.direccion,
            email: cliente.email,
            genero: cliente.genero, // 🟢 Carga del valor de género
            estado: cliente.estado?.toString().toUpperCase(),
            fechaRegistro: fechaFormato,
            distrito: {
              idDistrito: cliente.distrito.idDistrito
            }
          });
        }
      },
      error: () => this.router.navigate(['/secretaria-menu/clientes'])
    });
  }

  actualizarCliente(): void {
    if (this.clienteForm.valid) {
      this.clienteService.actualizarCliente(this.clienteId, this.clienteForm.value).subscribe({
        next: () => {
          this.toastr.success('Cliente actualizado con éxito.');
          this.router.navigate(['/secretaria-menu/clientes']);
        },
        error: () => this.toastr.error('Error al actualizar el cliente.')
      });
    }
  }
}