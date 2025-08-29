import { Component, OnInit, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Vendedor } from '../../models/vendedor.model';
import { VendedorService } from '../../services/vendedor.service';
import { Distrito } from '../../models/distrito.model';
import { DistritoService } from '../../services/distrito.service'; // 👈 importar service
import * as bootstrap from 'bootstrap';

@Component({
  selector: 'app-vendedor',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './vendedor.html',
  styleUrls: ['./vendedor.scss']
})
export class VendedorComponent implements OnInit, AfterViewInit {
  vendedores: Vendedor[] = [];
  distritos: Distrito[] = []; // ✅ lista de distritos

  nuevoVendedor: Vendedor = {
    nombre: '',
    apellidos: '',
    dni: '',
    celular: '',
    direccion: '',
    email: '',
    distrito: { idDistrito: 1, nombre: '' }
  };

  vendedorEditando: Vendedor | null = null;
  private modal?: bootstrap.Modal;

  constructor(
    private vendedorService: VendedorService,
    private distritoService: DistritoService // ✅ inyectar
  ) {}

  ngOnInit(): void {
    this.cargarVendedores();
    this.cargarDistritos(); // ✅
  }

  ngAfterViewInit(): void {
    const modalEl = document.getElementById('vendedorModal');
    if (modalEl) {
      this.modal = new bootstrap.Modal(modalEl);
    }
  }

  cargarDistritos() {
    this.distritoService.listarDistritos().subscribe(data => {
      this.distritos = data;
    });
  }

  abrirModal(vendedor?: Vendedor) {
    if (vendedor) {
      this.vendedorEditando = { ...vendedor };
      this.nuevoVendedor = { ...vendedor };
    } else {
      this.vendedorEditando = null;
      this.resetForm();
    }
    this.modal?.show();
  }

  cerrarModal() {
    this.modal?.hide();
  }

  cargarVendedores() {
    this.vendedorService.listarVendedores().subscribe(data => {
      this.vendedores = data;
    });
  }

  guardarVendedor() {
    if (this.vendedorEditando && this.vendedorEditando.idVendedor) {
      this.vendedorService
        .actualizarVendedor(this.vendedorEditando.idVendedor, this.nuevoVendedor)
        .subscribe(() => {
          this.cargarVendedores();
          this.resetForm();
          this.cerrarModal();
        });
    } else {
      this.vendedorService.crearVendedor(this.nuevoVendedor).subscribe(() => {
        this.cargarVendedores();
        this.resetForm();
        this.cerrarModal();
      });
    }
  }

  eliminarVendedor(id: number) {
    this.vendedorService.eliminarVendedor(id).subscribe(() => {
      this.cargarVendedores();
    });
  }

  resetForm() {
    this.nuevoVendedor = {
      nombre: '',
      apellidos: '',
      dni: '',
      celular: '',
      direccion: '',
      email: '',
      distrito: { idDistrito: 1, nombre: '' }
    };
  }

  // ✅ DESCARGAR EXCEL
  descargarExcel() {
    this.vendedorService.exportarExcel().subscribe((data: Blob) => {
      const blob = new Blob([data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'vendedores.xlsx';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    });
  }

  exportarPDF() {
  import('jspdf').then(jsPDF => {
    const doc = new jsPDF.jsPDF();

    doc.setFontSize(14);
    doc.text('Listado de Vendedores', 10, 10);

    this.vendedores.forEach((v, i) => {
      doc.setFontSize(11);
      doc.text(
        `${i + 1}. ${v.nombre} ${v.apellidos} - DNI: ${v.dni} - Cel: ${v.celular || 'N/A'} - Email: ${v.email || 'N/A'} - Distrito: ${v.distrito?.nombre || 'N/A'}`,
        10,
        20 + i * 10
      );
    });

    doc.save('vendedores.pdf');
  });
}


}
