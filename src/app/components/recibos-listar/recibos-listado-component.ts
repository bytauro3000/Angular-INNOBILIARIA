import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LecturaService } from '../../services/lectura.service';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

@Component({
  selector: 'app-recibo-listado',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './recibos-listado.html',
  styleUrls: ['./recibos-plantilla.scss']
})
export class RecibosListadoComponent implements OnInit {

  recibos: any[] = [];
  recibosFiltrados: any[] = [];

  filtroTipo: string = '';
  filtroMes: string = '';

  cargando: boolean = false;

  constructor(private lecturaService: LecturaService) {}

  ngOnInit(): void {
    this.cargarRecibos();
  }

  cargarRecibos() {
    this.cargando = true;
    this.lecturaService.listarRecibos().subscribe({
      next: (data) => {
        this.recibos = data;
        this.aplicarFiltros();
        this.cargando = false;
      },
      error: (err) => {
        console.error(err);
        this.cargando = false;
        alert('Error al cargar recibos');
      }
    });
  }

  aplicarFiltros() {
    this.recibosFiltrados = this.recibos.filter(r => {

      const cumpleTipo =
        !this.filtroTipo || r.tipoServicio === this.filtroTipo;

      const cumpleMes =
        !this.filtroMes ||
        new Date(r.fechaLectura).getMonth() + 1 === parseInt(this.filtroMes);

      return cumpleTipo && cumpleMes;
    });
  }

  // 🔥 NUEVO MÉTODO EXPORTAR PDF
  exportarPDF() {

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [148, 210] // A5 real
  });

  this.recibosFiltrados.forEach((r, index) => {

    if (index !== 0) {
      doc.addPage();
    }

    // ===== ENCABEZADO =====
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('RECIBO DE SERVICIO', 74, 15, { align: 'center' });

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Recibo N°: ${r.idRecibo}`, 10, 25);
    doc.text(`Contrato: ${r.idContrato}`, 10, 30);

    // Línea separadora
    doc.line(10, 35, 138, 35);

    // ===== DATOS DEL SERVICIO =====
    doc.setFont('helvetica', 'bold');
    doc.text('DATOS DEL SERVICIO', 10, 45);

    doc.setFont('helvetica', 'normal');
    doc.text(`Tipo de Servicio: ${r.tipoServicio}`, 10, 55);
    doc.text(`Consumo del Mes: ${r.consumoMes}`, 10, 62);
    doc.text(`Fecha de Lectura: ${r.fechaLectura}`, 10, 69);
    doc.text(`Fecha de Vencimiento: ${r.fechaVencimiento}`, 10, 76);

    doc.line(10, 82, 138, 82);

    // ===== RESUMEN DE PAGO =====
    doc.setFont('helvetica', 'bold');
    doc.text('RESUMEN DE PAGO', 10, 92);

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Importe Total: S/. ${r.importeTotal}`, 10, 105);

    doc.setFontSize(10);
    doc.text(`Estado: ${r.estado}`, 10, 115);

    doc.line(10, 125, 138, 125);

    // ===== PIE =====
    doc.setFontSize(8);
    doc.text('Gracias por confiar en nuestra empresa.', 74, 140, { align: 'center' });
    doc.text('Este documento es una representación digital del recibo.', 74, 145, { align: 'center' });

  });

  doc.save('recibos-formato-real.pdf');
}
}