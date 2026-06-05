import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminAnulacionesService, FiltrosAnulacion } from '../../services/admin-anulaciones.service';
import { PagoInscripcionDTO } from '../../services/inscripcion.service';

@Component({
  selector: 'app-admin-anulaciones-inscripciones',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-anulaciones-inscripciones.html',
  styleUrls: ['./admin-anulaciones-inscripciones.scss']
})
export class AdminAnulacionesInscripcionesComponent implements OnInit {

  pagos: PagoInscripcionDTO[] = [];
  pagosFiltrados: PagoInscripcionDTO[] = [];
  cargando = false;

  filtros: FiltrosAnulacion = {};

  mostrarModalAnular = false;
  pagoSeleccionado?: PagoInscripcionDTO;
  motivoAnulacion = '';
  procesando = false;

  toast = { mostrar: false, mensaje: '', tipo: 'success' };

  constructor(private anulacionesService: AdminAnulacionesService) {}

  ngOnInit(): void { this.cargarPagos(); }

  cargarPagos(): void {
    this.cargando = true;
    this.anulacionesService.listarPagosInscripciones(this.filtros).subscribe({
      next: (data) => {
        this.pagos = data;
        this.pagosFiltrados = data;
        this.cargando = false;
      },
      error: () => {
        this.mostrarNotificacion('Error al cargar pagos de servicios', 'error');
        this.cargando = false;
      }
    });
  }

  aplicarFiltros(): void { this.cargarPagos(); }
  limpiarFiltros(): void { this.filtros = {}; this.cargarPagos(); }

  abrirModalAnular(pago: PagoInscripcionDTO): void {
    this.pagoSeleccionado = pago;
    this.motivoAnulacion = '';
    this.mostrarModalAnular = true;
  }

  confirmarAnulacion(): void {
    if (!this.pagoSeleccionado || !this.motivoAnulacion.trim()) return;
    this.procesando = true;
    this.anulacionesService.anularPagoInscripcion(
      this.pagoSeleccionado.idPagoInscripcionComprobante,
      this.motivoAnulacion
    ).subscribe({
      next: () => {
        this.mostrarNotificacion('Pago de servicio anulado correctamente', 'success');
        this.cerrarModalAnular();
        this.cargarPagos();
      },
      error: () => { this.mostrarNotificacion('Error al anular el pago', 'error'); this.procesando = false; }
    });
  }

  cerrarModalAnular(): void {
    this.mostrarModalAnular = false;
    this.pagoSeleccionado = undefined;
    this.procesando = false;
  }

  descargarComprobante(pago: PagoInscripcionDTO): void {
    this.anulacionesService.descargarComprobanteInscripcion(pago.idPagoInscripcionComprobante).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url;
        a.download = `comprobante-servicio-${pago.numeroComprobante}.pdf`; a.click();
        URL.revokeObjectURL(url);
      },
      error: () => this.mostrarNotificacion('Error al descargar comprobante', 'error')
    });
  }

  mostrarNotificacion(mensaje: string, tipo: 'success' | 'error'): void {
    this.toast = { mostrar: true, mensaje, tipo };
    setTimeout(() => { this.toast.mostrar = false; }, 3500);
  }
}