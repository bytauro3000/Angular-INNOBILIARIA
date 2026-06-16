import { Component, OnInit, AfterViewInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProgramaService } from '../../services/programa.service';
import { DistritoService } from '../../services/distrito.service';
import { ProgramaInsertEdit } from '../programa-insertar-editar/programa-inset-edit';
import { Programa } from '../../models/programa.model';
import { Distrito } from '../../models/distrito.model';

@Component({
  selector: 'app-programa-listar',
  standalone: true,
  imports: [CommonModule, FormsModule, ProgramaInsertEdit],
  templateUrl: './programa-listar.html',
  styleUrls: ['./programa-listar.scss']
})
export class ProgramaListarComponent implements OnInit {

  @ViewChild('registroModal') registroModal!: ProgramaInsertEdit;

  programas: Programa[] = [];
  distritos: Distrito[] = [];

  filtroTexto = '';
  currentPage = 1;
  itemsPerPage = 10;

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

  get programasFiltrados(): Programa[] {
    let data = this.programas;
    if (this.filtroTexto.trim()) {
      const term = this.filtroTexto.toLowerCase();
      data = data.filter(p =>
        p.nombrePrograma?.toLowerCase().includes(term) ||
        p.ubicacion?.toLowerCase().includes(term) ||
        p.distrito?.nombre?.toLowerCase().includes(term)
      );
    }
    const start = (this.currentPage - 1) * this.itemsPerPage;
    return data.slice(start, start + this.itemsPerPage);
  }

  get totalPages(): number {
    let data = this.programas;
    if (this.filtroTexto.trim()) {
      const term = this.filtroTexto.toLowerCase();
      data = data.filter(p =>
        p.nombrePrograma?.toLowerCase().includes(term) ||
        p.ubicacion?.toLowerCase().includes(term) ||
        p.distrito?.nombre?.toLowerCase().includes(term)
      );
    }
    return Math.max(1, Math.ceil(data.length / this.itemsPerPage));
  }

  get paginas(): (number | string)[] {
    const pages: (number | string)[] = [];
    const total = this.totalPages;
    if (total <= 7) {
      for (let i = 1; i <= total; i++) pages.push(i);
    } else {
      pages.push(1);
      if (this.currentPage > 3) pages.push('...');
      const start = Math.max(2, this.currentPage - 1);
      const end = Math.min(total - 1, this.currentPage + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (this.currentPage < total - 2) pages.push('...');
      pages.push(total);
    }
    return pages;
  }

  irPagina(n: number | string) {
    if (typeof n === 'number') {
      this.currentPage = n;
    }
  }

  filtrarProgramas() {
    this.currentPage = 1;
  }

  recargar() {
    this.cargarProgramas();
  }

  cargarDistritos() {
    this.distritoService.listarDistritos().subscribe(data => {
      this.distritos = data;
    });
  }

  cargarProgramas() {
    this.programaService.listarProgramas().subscribe(data => {
      this.programas = data;
    });
  }

  abrirModal(programa?: Programa) {
    this.registroModal.abrirModal(programa);
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

  cerrarModal() {
    this.registroModal.cerrarModal();
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
      a.download = 'programas.xlsx';
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
          20 + i * 30
        );
      });
      doc.save('programas.pdf');
    });
  }
}
