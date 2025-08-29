import { Component, OnInit, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Parcelero } from '../../models/parcelero.model';
import { ParceleroService } from '../../services/parcelero.service';
import { Distrito } from '../../models/distrito.model';
import { DistritoService } from '../../services/distrito.service';

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
  distritos: Distrito[] = []; // 👈 lista de distritos

  nuevoParcelero: Parcelero = {
    nombres: '',
    apellidos: '',
    dni: '',
    celular: '',
    direccion: '',
    email: '',
    distrito: { idDistrito: 0, nombre: '' }
  };

  parceleroEditando: Parcelero | null = null;
  private modal?: bootstrap.Modal;

  constructor(
    private parceleroService: ParceleroService,
    private distritoService: DistritoService
  ) {}

  ngOnInit(): void {
    this.cargarParceleros();
    this.cargarDistritos(); // 👈 cargar distritos en el combo
  }

  ngAfterViewInit(): void {
    const modalEl = document.getElementById('parceleroModal');
    if (modalEl) {
      this.modal = new bootstrap.Modal(modalEl);
    }
  }

  abrirModal(parcelero?: Parcelero) {
    if (parcelero) {
      this.parceleroEditando = { ...parcelero };
      this.nuevoParcelero = { ...parcelero };
    } else {
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

  cargarDistritos() {
    this.distritoService.listarDistritos().subscribe(data => {
      this.distritos = data;
    });
  }

  guardarParcelero() {
    if (this.parceleroEditando && this.parceleroEditando.idParcelero) {
      this.parceleroService
        .actualizarParcelero(this.parceleroEditando.idParcelero, this.nuevoParcelero)
        .subscribe(() => {
          this.cargarParceleros();
          this.resetForm();
          this.cerrarModal();
        });
    } else {
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
      distrito: { idDistrito: 0, nombre: '' }
    };
  }

  exportarExcel() {
  this.parceleroService.exportarExcel().subscribe((data: Blob) => {
    const url = window.URL.createObjectURL(data);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'parceleros.xlsx'; // 👈 nombre del archivo
    a.click();
    window.URL.revokeObjectURL(url);
  });
}

}
