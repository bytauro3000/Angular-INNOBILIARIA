import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';                      // <-- Agregado
import { LecturaService } from '../../services/lectura.service';
import { ReciboConClienteDTO } from '../../dto/reciboconcliente.dto';

@Component({
  selector: 'app-recibos-listar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './recibos-listar.html',
  styleUrls: ['./recibos-listar.scss']
})
export class RecibosListarComponent implements OnInit {
  meses = [
    { value: 1, nombre: 'Enero' },
    { value: 2, nombre: 'Febrero' },
    { value: 3, nombre: 'Marzo' },
    { value: 4, nombre: 'Abril' },
    { value: 5, nombre: 'Mayo' },
    { value: 6, nombre: 'Junio' },
    { value: 7, nombre: 'Julio' },
    { value: 8, nombre: 'Agosto' },
    { value: 9, nombre: 'Setiembre' },
    { value: 10, nombre: 'Octubre' },
    { value: 11, nombre: 'Noviembre' },
    { value: 12, nombre: 'Diciembre' }
  ];
  anio: number = new Date().getFullYear();
  mesSeleccionado: number = new Date().getMonth() + 1;
  tipoServicio: string = 'LUZ';
  recibos: ReciboConClienteDTO[] = [];
  cargando: boolean = false;

  constructor(private lecturaService: LecturaService) {}

  ngOnInit(): void {}

  buscar() {
    this.cargando = true;
    this.lecturaService.filtrarRecibos(this.mesSeleccionado, this.anio, this.tipoServicio).subscribe({
      next: (data) => {
        this.recibos = data;
        this.cargando = false;
      },
      error: (err) => {
        console.error('Error al filtrar recibos', err);
        this.cargando = false;
      }
    });
  }

  // NUEVO MÉTODO PARA DESCARGAR PDF
descargarPdf(idRecibo: number) {
  this.lecturaService.generarPdfRecibo(idRecibo).subscribe({
    next: (response) => {
      // Extraer nombre del header Content-Disposition de forma simple y robusta
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = `recibo_${idRecibo}.pdf`; // nombre por defecto

      if (contentDisposition) {
        const parts = contentDisposition.split(';');
        for (let part of parts) {
          part = part.trim();
          if (part.startsWith('filename=')) {
            filename = part.substring(9).replace(/['"]/g, '').trim();
            break;
          }
        }
      }

      const blob = response.body;
      if (blob) {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        window.URL.revokeObjectURL(url);
      }
    },
    error: (err) => {
      console.error('Error al descargar PDF', err);
      Swal.fire('Error', 'No se pudo generar el recibo', 'error');
    }
  });
}
}