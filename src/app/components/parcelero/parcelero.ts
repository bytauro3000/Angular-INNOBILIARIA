import { Component, OnInit, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Parcelero } from '../../models/parcelero.model';
import { ParceleroService } from '../../services/parcelero.service';

import * as bootstrap from 'bootstrap';

@Component({
  selector: 'app-parcelero',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './parcelero.html',
  styleUrls: ['./parcelero.scss']
})
export class ParceleroComponent implements OnInit, AfterViewInit {
  parceleros: Parcelero[] = [];
  nuevoParcelero: Parcelero = {
    nombres: '',
    apellidos: '',
    dni: '',
    celular: '',
    direccion: '',
    email: '',
    distrito: { idDistrito: 1, nombre: '' }
  };

  parceleroEditando: Parcelero | null = null; // 👈 Nuevo para edición
  private modal?: bootstrap.Modal;

  constructor(private parceleroService: ParceleroService) {}

  ngOnInit(): void {
    this.cargarParceleros();
  }

  ngAfterViewInit(): void {
    const modalEl = document.getElementById('parceleroModal');
    if (modalEl) {
      this.modal = new bootstrap.Modal(modalEl);
    }
  }

  abrirModal(parcelero?: Parcelero) {
    if (parcelero) {
      // Editar
      this.parceleroEditando = { ...parcelero }; // copia
      this.nuevoParcelero = { ...parcelero };    // carga en form
    } else {
      // Crear
      this.parceleroEditando = null;
      this.resetForm();
    }
    this.modal?.show();
  }

  cerrarModal() {
    this.modal?.hide();
  }

  cargarParceleros() {
    this.parceleroService.listarParceleros().subscribe(data => {
      this.parceleros = data;
    });
  }

  guardarParcelero() {
    if (this.parceleroEditando && this.parceleroEditando.idParcelero) {
      // 🔹 EDITAR
      this.parceleroService
        .actualizarParcelero(this.parceleroEditando.idParcelero, this.nuevoParcelero)
        .subscribe(() => {
          this.cargarParceleros();
          this.resetForm();
          this.cerrarModal();
        });
    } else {
      // 🔹 CREAR
      this.parceleroService.crearParcelero(this.nuevoParcelero).subscribe(() => {
        this.cargarParceleros();
        this.resetForm();
        this.cerrarModal();
      });
    }
  }

  eliminarParcelero(id: number) {
    this.parceleroService.eliminarParcelero(id).subscribe(() => {
      this.cargarParceleros();
    });
  }

  private resetForm() {
    this.nuevoParcelero = {
      nombres: '',
      apellidos: '',
      dni: '',
      celular: '',
      direccion: '',
      email: '',
      distrito: { idDistrito: 1, nombre: '' }
    };
  }
}
