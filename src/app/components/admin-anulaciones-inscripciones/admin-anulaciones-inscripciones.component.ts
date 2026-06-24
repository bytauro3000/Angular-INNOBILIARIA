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

  mostrarModalNotaCredito = false;
  pagoNc?: PagoInscripcionDTO;
  codMotivoNc = '01';
  desMotivoNc = '';
  procesandoNc = false;
  motivosNc: {[key: string]: string} = {};

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

  puedeAnularConSunat(pago: PagoInscripcionDTO): boolean {
    return !pago.anulado && !!pago.numeroComprobante && pago.numeroComprobante.startsWith('B');
  }

  abrirModalNotaCredito(pago: PagoInscripcionDTO): void {
    this.pagoNc = pago;
    this.codMotivoNc = '01';
    this.desMotivoNc = '';
    this.procesandoNc = false;
    this.mostrarModalNotaCredito = true;
    if (Object.keys(this.motivosNc).length === 0) {
      this.anulacionesService.obtenerMotivosNotaCredito().subscribe({
        next: (m) => this.motivosNc = m,
        error: () => this.motivosNc = { '01': 'Anulacion de la operacion', '06': 'Devolucion total' }
      });
    }
  }

  confirmarNotaCredito(): void {
    if (!this.pagoNc || !this.desMotivoNc.trim()) return;
    this.procesandoNc = true;
    this.anulacionesService.enviarNotaCredito(
      this.pagoNc.idPagoInscripcionComprobante,
      'INSCRIPCION',
      this.codMotivoNc,
      this.desMotivoNc
    ).subscribe({
      next: (res: any) => {
        this.mostrarNotificacion(res.mensaje || 'Nota de crédito emitida', 'success');
        this.cerrarModalNotaCredito();
        this.cargarPagos();
        if (res.idNotaCredito) {
          const obs = res.serieNC?.startsWith('BB')
            ? this.anulacionesService.descargarPdfNotaCredito(res.idNotaCredito)
            : this.anulacionesService.descargarPdfNotaCreditoRecibo(res.idNotaCredito);
          obs.subscribe({ next: (blob) => window.open(URL.createObjectURL(blob), '_blank') });
        }
      },
      error: (err) => {
        const msg = err.error?.error || 'Error al emitir nota de crédito';
        this.mostrarNotificacion(msg, 'error');
        this.procesandoNc = false;
      }
    });
  }

  cerrarModalNotaCredito(): void {
    this.mostrarModalNotaCredito = false;
    this.pagoNc = undefined;
    this.procesandoNc = false;
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

  descargarNotaCredito(pago: PagoInscripcionDTO): void {
    if (!pago.idComprobante) return;
    this.anulacionesService.buscarNotaCreditoPorOriginal(pago.idComprobante).subscribe({
      next: (res) => {
        if (!res.idNotaCredito) return;
        const obs = res.serie?.startsWith('BB')
          ? this.anulacionesService.descargarPdfNotaCredito(res.idNotaCredito)
          : this.anulacionesService.descargarPdfNotaCreditoRecibo(res.idNotaCredito);
        obs.subscribe({
          next: (blob) => {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.download = `nc-${res.idNotaCredito}.pdf`; a.href = url;
            a.click();
            URL.revokeObjectURL(url);
          },
          error: () => this.mostrarNotificacion('Error al descargar nota de crédito', 'error')
        });
      },
      error: () => this.mostrarNotificacion('No se encontró nota de crédito', 'error')
    });
  }

  mostrarNotificacion(mensaje: string, tipo: 'success' | 'error'): void {
    this.toast = { mostrar: true, mensaje, tipo };
    setTimeout(() => { this.toast.mostrar = false; }, 3500);
  }
}