import { Component, OnInit, AfterViewInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProgramaService } from '../../services/programa.service';
import { DistritoService } from '../../services/distrito.service';
import { ProgramaInsetEdit } from '../programa-inset-edit/programa-inset-edit'; // Importar el componente hijo del modal
import { Programa } from '../../models/programa.model';
import { Distrito } from '../../models/distrito.model';

@Component({
  selector: 'app-programa',
  standalone: true,
  imports: [CommonModule, FormsModule, ProgramaInsetEdit],
  templateUrl: './programa.html',
  styleUrls: ['./programa.scss']
})
export class ProgramaComponent implements OnInit {

  // REFERENCIA AL COMPONENTE DEL MODAL
  @ViewChild('registroModal') registroModal!: ProgramaInsetEdit;

  programas: Programa[] = [];
  distritos: Distrito[] = [];

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

  constructor(
    private programaService: ProgramaService,
    private distritoService: DistritoService
  ) {}

  ngOnInit(): void {
    this.cargarProgramas();
    this.cargarDistritos();
  }

  // Método para cargar los distritos desde el servicio
  cargarDistritos() {
    this.distritoService.listarDistritos().subscribe(data => {
      this.distritos = data;
    });
  }

  // Método para cargar los programas desde el servicio
  cargarProgramas() {
    this.programaService.listarProgramas().subscribe(data => {
      this.programas = data;
    });
  }

  // Método para abrir el modal, pasándole el programa a editar
  abrirModal(programa?: Programa) {
    this.registroModal.abrirModal(programa); // Llamamos al método del componente hijo para abrir el modal
  }

  // Método para guardar el programa (nuevo o editado)
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

  // Método para eliminar un programa
  eliminarPrograma(id: number) {
    this.programaService.eliminarPrograma(id).subscribe(() => {
      this.cargarProgramas();
    });
  }

  // Método para cerrar el modal
  cerrarModal() {
    this.registroModal.cerrarModal(); // Llamamos al método del componente hijo para cerrar el modal
  }

  // Método para reiniciar el formulario
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

  // Función para exportar en Excel
  descargarExcel() {
    this.programaService.descargarExcel().subscribe((data: Blob) => {
      const url = window.URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'programas.xlsx';
      a.click();
      window.URL.revokeObjectURL(url);
    });
  }

  // Función para exportar en PDF
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
          20 + i * 30
        );
      });

      doc.save('programas.pdf');
    });
  }
}
