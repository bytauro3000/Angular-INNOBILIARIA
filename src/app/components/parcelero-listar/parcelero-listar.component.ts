import { Component, OnInit, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Parcelero } from '../../models/parcelero.model';
import { ParceleroService } from '../../services/parcelero.service';
import { Distrito } from '../../models/distrito.model';
import { DistritoService } from '../../services/distrito.service';

import * as bootstrap from 'bootstrap';

@Component({
  selector: 'app-parcelero-listar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './parcelero-listar.html',
  styleUrls: ['./parcelero-listar.scss']
})
export class ParceleroListarComponent implements OnInit, AfterViewInit {
  parceleros: Parcelero[] = [];
  distritos: Distrito[] = [];

  filtroTexto = '';
  currentPage = 1;
  itemsPerPage = 10;

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
    this.cargarDistritos();
  }

  ngAfterViewInit(): void {
    const modalEl = document.getElementById('parceleroModal');
    if (modalEl) {
      this.modal = new bootstrap.Modal(modalEl);
    }
  }

  get parcelerosFiltrados(): Parcelero[] {
    let data = this.parceleros;
    if (this.filtroTexto.trim()) {
      const term = this.filtroTexto.toLowerCase();
      data = data.filter(p =>
        p.nombres?.toLowerCase().includes(term) ||
        p.apellidos?.toLowerCase().includes(term) ||
        p.dni?.includes(term) ||
        p.celular?.includes(term) ||
        p.distrito?.nombre?.toLowerCase().includes(term)
      );
    }
    const start = (this.currentPage - 1) * this.itemsPerPage;
    return data.slice(start, start + this.itemsPerPage);
  }

  get totalPages(): number {
    let data = this.parceleros;
    if (this.filtroTexto.trim()) {
      const term = this.filtroTexto.toLowerCase();
      data = data.filter(p =>
        p.nombres?.toLowerCase().includes(term) ||
        p.apellidos?.toLowerCase().includes(term) ||
        p.dni?.includes(term) ||
        p.celular?.includes(term) ||
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

  filtrar() {
    this.currentPage = 1;
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
      a.download = 'parceleros.xlsx';
      a.click();
      window.URL.revokeObjectURL(url);
    });
  }

  exportarPDF() {
    import('jspdf').then(jsPDF => {
      const doc = new jsPDF.jsPDF();
      doc.setFontSize(14);
      doc.text('Listado de Parceleros', 10, 10);
      this.parceleros.forEach((p, i) => {
        doc.setFontSize(11);
        doc.text(
          `${i + 1}. ${p.nombres} ${p.apellidos} - DNI: ${p.dni} - Cel: ${p.celular || 'N/A'} - Distrito: ${p.distrito?.nombre || 'N/A'}`,
          10,
          20 + i * 10
        );
      });
      doc.save('parceleros.pdf');
    });
  }
}
