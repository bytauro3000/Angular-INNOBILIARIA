import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminAnulacionesService, FiltrosAnulacion } from '../../services/admin-anulaciones.service';
import { PagoLetraResponse } from '../../dto/pagoletraresponse.dto';

@Component({
  selector: 'app-admin-anulaciones-letras',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-anulaciones-letras.html',
  styleUrls: ['./admin-anulaciones-letras.scss']
})
export class AdminAnulacionesLetrasComponent implements OnInit {

  pagos: PagoLetraResponse[] = [];
  pagosFiltrados: PagoLetraResponse[] = [];
  cargando = false;

  filtros: FiltrosAnulacion = {};

  // Modal anulación
  mostrarModalAnular = false;
  pagoSeleccionado?: PagoLetraResponse;
  motivoAnulacion = '';
  procesando = false;

  // Modal confirmación eliminar
  mostrarModalEliminar = false;
  pagoAEliminar?: PagoLetraResponse;

  // Modal Nota de Crédito
  mostrarModalNotaCredito = false;
  pagoNc?: PagoLetraResponse;
  codMotivoNc = '01';
  desMotivoNc = '';
  procesandoNc = false;
  motivosNc: {[key: string]: string} = {};

  toast = { mostrar: false, mensaje: '', tipo: 'success' };

  constructor(private anulacionesService: AdminAnulacionesService) {}

  ngOnInit(): void {
    this.cargarPagos();
  }

  cargarPagos(): void {
    this.cargando = true;
    this.anulacionesService.listarPagosLetras(this.filtros).subscribe({
      next: (data) => {
        this.pagos = data;
        this.pagosFiltrados = data;
        this.cargando = false;
      },
      error: () => {
        this.mostrarNotificacion('Error al cargar pagos de letras', 'error');
        this.cargando = false;
      }
    });
  }

  aplicarFiltros(): void {
    this.cargarPagos();
  }

  limpiarFiltros(): void {
    this.filtros = {};
    this.cargarPagos();
  }

  // ── Modal anular ────────────────────────────────────────

  abrirModalAnular(pago: PagoLetraResponse): void {
    this.pagoSeleccionado = pago;
    this.motivoAnulacion = '';
    this.mostrarModalAnular = true;
  }

  confirmarAnulacion(): void {
    if (!this.pagoSeleccionado || !this.motivoAnulacion.trim()) return;
    this.procesando = true;
    this.anulacionesService.anularPagoLetra(this.pagoSeleccionado.idPago, this.motivoAnulacion).subscribe({
      next: () => {
        this.mostrarNotificacion('Pago anulado correctamente', 'success');
        this.cerrarModalAnular();
        this.cargarPagos();
      },
      error: () => {
        this.mostrarNotificacion('Error al anular el pago', 'error');
        this.procesando = false;
      }
    });
  }

  cerrarModalAnular(): void {
    this.mostrarModalAnular = false;
    this.pagoSeleccionado = undefined;
    this.procesando = false;
  }

  // ── Modal eliminar ──────────────────────────────────────

  abrirModalEliminar(pago: PagoLetraResponse): void {
    this.pagoAEliminar = pago;
    this.mostrarModalEliminar = true;
  }

  confirmarEliminar(): void {
    if (!this.pagoAEliminar) return;
    this.procesando = true;
    this.anulacionesService.eliminarPagoLetra(this.pagoAEliminar.idPago).subscribe({
      next: () => {
        this.mostrarNotificacion('Pago eliminado correctamente', 'success');
        this.cerrarModalEliminar();
        this.cargarPagos();
      },
      error: () => {
        this.mostrarNotificacion('Error al eliminar el pago', 'error');
        this.procesando = false;
      }
    });
  }

  cerrarModalEliminar(): void {
    this.mostrarModalEliminar = false;
    this.pagoAEliminar = undefined;
    this.procesando = false;
  }

  // ── Nota de Crédito ─────────────────────────────────────

  puedeAnularConSunat(pago: PagoLetraResponse): boolean {
    return !pago.anulado && !!pago.numeroComprobante && pago.numeroComprobante.startsWith('B');
  }

  abrirModalNotaCredito(pago: PagoLetraResponse): void {
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
      this.pagoNc.idPago,
      'LETRA',
      this.codMotivoNc,
      this.desMotivoNc
    ).subscribe({
      next: (res: any) => {
        this.mostrarNotificacion(res.mensaje || 'Nota de crédito emitida correctamente', 'success');
        this.cerrarModalNotaCredito();
        this.cargarPagos();
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

  // ── Utilidades ──────────────────────────────────────────

  descargarComprobante(pago: PagoLetraResponse): void {
    this.anulacionesService.descargarComprobanteLetra(pago.idPago).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `comprobante-${pago.numeroComprobante}.pdf`;
        a.click();
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