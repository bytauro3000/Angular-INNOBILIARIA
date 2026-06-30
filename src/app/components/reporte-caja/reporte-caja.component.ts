import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReporteIngresosService } from '../../services/reporteingresos.service';
import { ResumenIngresosRangoDTO, ResumenIngresoItemDTO } from '../../dto/resumen-ingresos-rango.dto';
import { ToastrService } from 'ngx-toastr';
import { obtenerFechaPeru } from '../../utils/fecha-peru';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

@Component({
  selector: 'app-reporte-caja',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reporte-caja.html',
  styleUrls: ['./reporte-caja.scss']
})
export class ReporteCajaComponent implements OnInit {

  fecha: string = '';
  cargando = false;
  resumen: ResumenIngresosRangoDTO | null = null;

  constructor(
    private reporteService: ReporteIngresosService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.fecha = obtenerFechaPeru();
    this.cargar();
  }

  cargar(): void {
    if (!this.fecha) return;
    this.cargando = true;
    this.resumen = null;

    this.reporteService.obtenerIngresosPorRango(this.fecha, this.fecha).subscribe({
      next: (data) => {
        this.resumen = data;
        this.cargando = false;
      },
      error: () => {
        this.toastr.error('Error al cargar el reporte', 'Error');
        this.cargando = false;
      }
    });
  }

  get items(): ResumenIngresoItemDTO[] {
    return this.resumen?.detalle ?? [];
  }

  get totalEfectivo(): number {
    return this.items
      .filter(i => i.medioPago === 'EFECTIVO' && !i.anulado)
      .reduce((s, i) => s + Number(i.importePagado), 0);
  }

  get totalDeposito(): number {
    return this.items
      .filter(i => i.medioPago !== 'EFECTIVO' && !i.anulado)
      .reduce((s, i) => s + Number(i.importePagado), 0);
  }

  get totalGeneral(): number {
    return this.totalEfectivo + this.totalDeposito;
  }

  esDeposito(medio: string | null): boolean {
    return medio !== null && medio !== 'EFECTIVO';
  }

  esEfectivo(medio: string | null): boolean {
    return medio === 'EFECTIVO';
  }

  formatearFecha(fecha: any): string {
    if (!fecha) return '—';
    if (Array.isArray(fecha)) {
      const [y, m, d] = fecha;
      return `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y}`;
    }
    const parts = String(fecha).split('-');
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    return String(fecha);
  }

  formatMonto(valor: number | null | undefined): string {
    if (valor == null) return '$ 0.00';
    return `$ ${Number(valor).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  generarPdf(): void {
    if (!this.resumen || this.items.length === 0) {
      this.toastr.warning('No hay datos para generar el PDF', 'Atención');
      return;
    }

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Título
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('REPORTE DE CAJA DIARIO', pageWidth / 2, 18, { align: 'center' });

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Fecha: ${this.formatearFecha(this.fecha)}`, pageWidth / 2, 25, { align: 'center' });

    // Datos de la tabla
    const body: any[][] = [];
    let contador = 0;

    for (const item of this.items) {
      if (item.anulado) continue;
      contador++;
      const observacion = item.observaciones ?? `${item.nombreCliente ?? ''} - ${item.referencia ?? ''}`;
      body.push([
        contador,
        observacion,
        item.numeroComprobante ?? '—',
        this.esEfectivo(item.medioPago) ? this.formatMonto(item.importePagado) : '',
        this.esDeposito(item.medioPago) ? this.formatMonto(item.importePagado) : '',
        this.esDeposito(item.medioPago) ? this.formatearFecha(item.fechaOperacion) : ''
      ]);
    }

    autoTable(doc, {
      head: [[ 'N°', 'OBSERVACIONES', 'N° COMPROBANTE', 'EFECTIVO', 'DEPÓSITO', 'FECHA OP.' ]],
      body,
      startY: 32,
      styles: { fontSize: 7, cellPadding: 2 },
      headStyles: { fillColor: [15, 118, 110], fontSize: 7, halign: 'center' },
      columnStyles: {
        0: { cellWidth: 10, halign: 'center' },
        1: { cellWidth: 70 },
        2: { cellWidth: 30, halign: 'center' },
        3: { cellWidth: 25, halign: 'right' },
        4: { cellWidth: 25, halign: 'right' },
        5: { cellWidth: 22, halign: 'center' }
      },
      foot: [[
        '',
        { content: 'TOTALES', styles: { halign: 'right', fontStyle: 'bold', fontSize: 8 } },
        '',
        { content: this.formatMonto(this.totalEfectivo), styles: { halign: 'right', fontStyle: 'bold', fontSize: 8 } },
        { content: this.formatMonto(this.totalDeposito), styles: { halign: 'right', fontStyle: 'bold', fontSize: 8 } },
        ''
      ]],
      footStyles: { fillColor: [240, 240, 240] }
    });

    // Fecha de generación al pie
    const finalY = (doc as any).lastAutoTable.finalY || 40;
    doc.setFontSize(7);
    doc.setTextColor(150);
    doc.text(
      `Generado el: ${new Date().toLocaleString('es-PE')}`,
      pageWidth - 10, finalY + 10,
      { align: 'right' }
    );

    doc.save(`caja-${this.fecha}.pdf`);
  }
}
