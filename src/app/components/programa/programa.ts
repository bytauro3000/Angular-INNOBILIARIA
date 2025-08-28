import { Component, OnInit, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import * as bootstrap from 'bootstrap';

import { Programa } from '../../models/programa.model';
import { ProgramaService } from '../../services/programa.service';
import { Parcelero } from '../../models/parcelero.model';
import { Distrito } from '../../models/distrito.model';

@Component({
  selector: 'app-programa',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './programa.html',
  styleUrls: ['./programa.scss']
})
export class ProgramaComponent implements OnInit, AfterViewInit {
  programas: Programa[] = [];

  nuevoPrograma: Programa = {
    nombrePrograma: '',
    ubicacion: '',
    areaTotal: 0,
    precioM2: 0,
    costoTotal: 0,
    parcelero: { idParcelero: 1, nombres: '', apellidos: '', dni: '', distrito: { idDistrito: 1, nombre: '' } },
    distrito: { idDistrito: 1, nombre: '' }
  };

  programaEditando: Programa | null = null;
  private modal?: bootstrap.Modal;

  constructor(private programaService: ProgramaService) {}

  ngOnInit(): void {
    this.cargarProgramas();
  }

  ngAfterViewInit(): void {
    const modalEl = document.getElementById('programaModal');
    if (modalEl) {
      this.modal = new bootstrap.Modal(modalEl);
    }
  }

  abrirModal(programa?: Programa) {
    if (programa) {
      // Editar
      this.programaEditando = { ...programa };
      this.nuevoPrograma = { ...programa };
    } else {
      // Crear
      this.programaEditando = null;
      this.resetForm();
    }
    this.modal?.show();
  }

  cerrarModal() {
    this.modal?.hide();
  }

  cargarProgramas() {
    this.programaService.listarProgramas().subscribe(data => {
      this.programas = data;
    });
  }

  guardarPrograma() {
    if (this.programaEditando && this.programaEditando.idPrograma) {
      // EDITAR
      this.programaService.actualizarPrograma(this.programaEditando.idPrograma, this.nuevoPrograma).subscribe(() => {
        this.cargarProgramas();
        this.resetForm();
        this.cerrarModal();
      });
    } else {
      // CREAR
      this.programaService.crearPrograma(this.nuevoPrograma).subscribe(() => {
        this.cargarProgramas();
        this.resetForm();
        this.cerrarModal();
      });
    }
  }

  eliminarPrograma(id: number) {
    this.programaService.eliminarPrograma(id).subscribe(() => {
      this.cargarProgramas();
    });
  }

  private resetForm() {
    this.nuevoPrograma = {
      nombrePrograma: '',
      ubicacion: '',
      areaTotal: 0,
      precioM2: 0,
      costoTotal: 0,
      parcelero: { idParcelero: 1, nombres: '', apellidos: '', dni: '', distrito: { idDistrito: 1, nombre: '' } },
      distrito: { idDistrito: 1, nombre: '' }
    };
  }
}
