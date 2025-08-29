import { Component, OnInit, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import * as bootstrap from 'bootstrap';

import { Programa } from '../../models/programa.model';
import { ProgramaService } from '../../services/programa.service';
import { Parcelero } from '../../models/parcelero.model';
import { Distrito } from '../../models/distrito.model';
import { DistritoService } from '../../services/distrito.service'; // ✅ import

@Component({
  selector: 'app-programa',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './programa.html',
  styleUrls: ['./programa.scss']
})
export class ProgramaComponent implements OnInit, AfterViewInit {
  programas: Programa[] = [];
  distritos: Distrito[] = []; // ✅ lista de distritos

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

  constructor(
    private programaService: ProgramaService,
    private distritoService: DistritoService // ✅ inyectamos el service
  ) {}

  ngOnInit(): void {
    this.cargarProgramas();
    this.cargarDistritos(); // ✅ cargamos distritos al iniciar
  }

  ngAfterViewInit(): void {
    const modalEl = document.getElementById('programaModal');
    if (modalEl) {
      this.modal = new bootstrap.Modal(modalEl);
    }
  }

  // ✅ Método nuevo
  cargarDistritos() {
    this.distritoService.listarDistritos().subscribe(data => {
      this.distritos = data;
    });
  }

  abrirModal(programa?: Programa) {
    if (programa) {
      this.programaEditando = { ...programa };
      this.nuevoPrograma = { ...programa };
    } else {
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
      this.programaService.actualizarPrograma(this.programaEditando.idPrograma, this.nuevoPrograma).subscribe(() => {
        this.cargarProgramas();
        this.resetForm();
        this.cerrarModal();
      });
    } else {
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

  descargarExcel() {
  this.programaService.descargarExcel().subscribe((data: Blob) => {
    const url = window.URL.createObjectURL(data);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'programas.xlsx'; // nombre del archivo
    a.click();
    window.URL.revokeObjectURL(url);
  });
  }

  exportarPDF() {
  import('jspdf').then(jsPDF => {
    const doc = new jsPDF.jsPDF();

    doc.text('Listado de Programas', 10, 10);

    this.programas.forEach((p, i) => {
      doc.text(
        `${i + 1}. ${p.nombrePrograma} - Ubicación: ${p.ubicacion || 'N/A'} 
        Área: ${p.areaTotal} m² - Precio: ${p.precioM2 || 0} x m² 
        Total: ${p.costoTotal || 0} 
        Parcelero: ${p.parcelero ? (p.parcelero.nombres + ' ' + p.parcelero.apellidos) : 'N/A'} 
        Distrito: ${p.distrito?.nombre || 'N/A'}`,
        10,
        20 + i * 30 // 👈 más espacio porque son varias líneas por programa
      );
    });

    doc.save('programas.pdf');
  });
}

}
