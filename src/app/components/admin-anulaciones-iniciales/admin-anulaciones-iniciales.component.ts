import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminAnulacionesService, FiltrosAnulacion } from '../../services/admin-anulaciones.service';
import { PagoInicialResponseDTO } from '../../dto/pagoinicialresponse.dto';

// El backend devuelve el pago inicial enriquecido con datos del contrato
export interface PagoInicialAdminDTO extends PagoInicialResponseDTO {
  idContrato?: number;
  nombreCliente?: string;
  programa?: string;
  manzana?: string;
  lote?: string;
}

@Component({
  selector: 'app-admin-anulaciones-iniciales',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-anulaciones-iniciales.html',
  styleUrls: ['./admin-anulaciones-iniciales.scss']
})
export class AdminAnulacionesInicialesComponent implements OnInit {

  pagos: PagoInicialAdminDTO[] = [];
  pagosFiltrados: PagoInicialAdminDTO[] = [];
  cargando = false;

  filtros: FiltrosAnulacion = {};

  mostrarModalAnular = false;
  pagoSeleccionado?: PagoInicialAdminDTO;
  motivoAnulacion = '';
  procesando = false;

  mostrarModalNotaCredito = false;
  pagoNc?: PagoInicialAdminDTO;
  codMotivoNc = '01';
  desMotivoNc = '';
  procesandoNc = false;
  motivosNc: {[key: string]: string} = {};

  toast = { mostrar: false, mensaje: '', tipo: 'success' };

  constructor(private anulacionesService: AdminAnulacionesService) {}

  ngOnInit(): void { this.cargarPagos(); }

  cargarPagos(): void {
    this.cargando = true;
    this.anulacionesService.listarPagosIniciales(this.filtros).subscribe({
      next: (data) => {
        this.pagos = data as PagoInicialAdminDTO[];
        this.pagosFiltrados = this.pagos;
        this.cargando = false;
      },
      error: () => {
        this.mostrarNotificacion('Error al cargar pagos iniciales', 'error');
        this.cargando = false;
      }
    });
  }

  aplicarFiltros(): void { this.cargarPagos(); }
  limpiarFiltros(): void { this.filtros = {}; this.cargarPagos(); }

  abrirModalAnular(pago: PagoInicialAdminDTO): void {
    this.pagoSeleccionado = pago;
    this.motivoAnulacion = '';
    this.mostrarModalAnular = true;
  }

  confirmarAnulacion(): void {
    if (!this.pagoSeleccionado?.idContrato || !this.motivoAnulacion.trim()) return;
    this.procesando = true;
    this.anulacionesService.anularPagoInicial(this.pagoSeleccionado.idContrato, this.motivoAnulacion).subscribe({
      next: () => {
        this.mostrarNotificacion('Pago inicial anulado correctamente', 'success');
        this.cerrarModalAnular();
        this.cargarPagos();
      },
      error: () => { this.mostrarNotificacion('Error al anular', 'error'); this.procesando = false; }
    });
  }

  cerrarModalAnular(): void {
    this.mostrarModalAnular = false;
    this.pagoSeleccionado = undefined;
    this.procesando = false;
  }

  puedeAnularConSunat(pago: PagoInicialAdminDTO): boolean {
    return !pago.anulado && !!pago.numeroComprobante && pago.numeroComprobante.startsWith('B');
  }

  abrirModalNotaCredito(pago: PagoInicialAdminDTO): void {
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
      this.pagoNc.idPagoInicial,
      'INICIAL',
      this.codMotivoNc,
      this.desMotivoNc
    ).subscribe({
      next: (res: any) => {
        this.mostrarNotificacion(res.mensaje || 'Nota de crédito emitida', 'success');
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

  descargarComprobante(pago: PagoInicialAdminDTO): void {
    if (!pago.idContrato) return;
    this.anulacionesService.descargarComprobanteInicial(pago.idContrato).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `comprobante-inicial-${pago.numeroComprobante || pago.idContrato}.pdf`;
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