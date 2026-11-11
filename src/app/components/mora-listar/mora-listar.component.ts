import {
  Component, EventEmitter, Input, OnInit, Output,
  ViewChild, ElementRef, AfterViewInit
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastrService } from 'ngx-toastr';
import * as bootstrap from 'bootstrap';
import Swal from 'sweetalert2';
import { jwtDecode } from 'jwt-decode';

import { MoraService } from '../../services/mora.service';
import { MoraResponse } from '../../dto/moraresponse.dto';
import { MoraPagarComponent } from '../mora-pagar/mora-pagar.component';
import { MoraMultiplePagarComponent } from '../mora-multiple-pagar/mora-multiple-pagar.component';
import { TokenService } from '../../auth/token.service';

@Component({
  selector: 'app-mora-listar',
  standalone: true,
  imports: [CommonModule, MoraPagarComponent, MoraMultiplePagarComponent],
  templateUrl: './mora-listar.html',
  styleUrls: ['./mora-listar.scss']
})
export class MoraListarComponent implements OnInit, AfterViewInit {
  @ViewChild('modalElement') modalElement!: ElementRef;
  private modal?: bootstrap.Modal;

  @Input() idContrato!: number;
  @Input() simboloMoneda = '$';
  @Output() onClose = new EventEmitter<void>();

  moras: MoraResponse[] = [];
  cargando = true;
  moraParaPagar: MoraResponse | null = null;
  esAdministrador = false;
  esSoporte = false;

  // ── Pago múltiple ──────────────────────────────────────────────────────────
  seleccionadasMap: Set<number> = new Set();
  modoPagoMultiple = false;
  morasSeleccionadasTemp: MoraResponse[] = [];

  constructor(
    private moraService: MoraService,
    private tokenService: TokenService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.verificarRol();
    this.cargarMoras();
  }

  ngAfterViewInit(): void {
    this.modal = new bootstrap.Modal(this.modalElement.nativeElement, {
      backdrop: 'static',
      keyboard: false
    });
    this.modal.show();
  }

  private verificarRol(): void {
    const token = this.tokenService.getToken();
    if (!token) return;
    try {
      const decoded: { rol: string } = jwtDecode(token);
      this.esAdministrador = decoded.rol === 'ROLE_ADMINISTRADOR';
      this.esSoporte = decoded.rol === 'ROLE_SOPORTE';
    } catch {
      this.esAdministrador = false;
      this.esSoporte = false;
    }
  }

  cargarMoras(): void {
    this.cargando = true;
    this.moraService.listarPorContrato(this.idContrato).subscribe({
      next: (data) => {
        this.moras = data;
        // Conservar solo la selección de moras que siguen pendientes
        const pendientes = new Set(
          data.filter(m => m.estadoMora === 'PENDIENTE').map(m => m.idMora));
        this.seleccionadasMap = new Set(
          [...this.seleccionadasMap].filter(id => pendientes.has(id)));
        this.cargando = false;
      },
      error: () => { this.toastr.error('Error al cargar las moras', 'Error'); this.cargando = false; }
    });
  }

  get morasPendientes(): MoraResponse[] { return this.moras.filter(m => m.estadoMora === 'PENDIENTE'); }
  get morasPagadas(): MoraResponse[]    { return this.moras.filter(m => m.estadoMora === 'PAGADO'); }
  get morasAnuladas(): MoraResponse[]   { return this.moras.filter(m => m.estadoMora === 'ANULADO'); }
  get totalPendiente(): number {
    return this.morasPendientes.reduce((s, m) => s + (m.saldoPendiente ?? m.montoMoraTotal), 0);
  }

  obtenerNumeroLetra(numeroLetra: string): string {
    if (!numeroLetra) return '';
    return numeroLetra.split('/')[0];
  }

  // ── Selección múltiple ─────────────────────────────────────────────────────

  toggleSeleccion(mora: MoraResponse): void {
    if (this.seleccionadasMap.has(mora.idMora)) {
      this.seleccionadasMap.delete(mora.idMora);
    } else {
      this.seleccionadasMap.add(mora.idMora);
    }
  }

  isSeleccionada(idMora: number): boolean {
    return this.seleccionadasMap.has(idMora);
  }

  get cantidadSeleccionadas(): number {
    return this.seleccionadasMap.size;
  }

  get morasSeleccionadas(): MoraResponse[] {
    return this.morasPendientes.filter(m => this.seleccionadasMap.has(m.idMora));
  }

  get totalSeleccionado(): number {
    return this.morasSeleccionadas.reduce((s, m) => s + (m.saldoPendiente ?? m.montoMoraTotal), 0);
  }

  abrirPagoMultiple(): void {
    if (this.cantidadSeleccionadas < 2) {
      this.toastr.warning('Seleccione al menos dos moras pendientes', 'Atención');
      return;
    }
    this.morasSeleccionadasTemp = this.morasSeleccionadas;
    this.modoPagoMultiple = true;
  }

  cerrarPagoMultiple(): void {
    this.modoPagoMultiple = false;
    this.morasSeleccionadasTemp = [];
  }

  onPagoMultipleRegistrado(numeroComprobante: string | null): void {
    this.cerrarPagoMultiple();
    this.seleccionadasMap.clear();
    this.cargarMoras();

    if (numeroComprobante) {
      this.moraService.descargarComprobanteMultiple(numeroComprobante).subscribe({
        next: (blob) => window.open(URL.createObjectURL(blob), '_blank'),
        error: () => this.toastr.warning('El pago se registró pero no se pudo abrir el comprobante', 'Aviso')
      });
    }
  }

  abrirPagarMora(mora: MoraResponse): void { this.moraParaPagar = mora; }
  cerrarPagarMora(): void { this.moraParaPagar = null; }

  onMoraPagada(idPagoMora?: number): void {
    this.cerrarPagarMora();
    this.cargarMoras();
    if (idPagoMora) this.descargarComprobanteMora(idPagoMora);
  }

  descargarComprobanteMora(idPagoMora: number): void {
    this.moraService.descargarComprobante(idPagoMora).subscribe({
      next: (blob) => window.open(URL.createObjectURL(blob), '_blank'),
      error: () => this.toastr.warning('No se pudo abrir el comprobante de mora.', 'Aviso')
    });
  }

  anularMora(mora: MoraResponse): void {
    this.modal?.hide();
    setTimeout(() => {
      Swal.fire({
        title: 'Anular mora',
        text: `Ingrese el motivo de anulación de la mora de la letra N° ${mora.numeroLetra}:`,
        input: 'textarea',
        inputPlaceholder: 'Motivo obligatorio...',
        inputAttributes: { 'aria-label': 'Motivo de anulación' },
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc2626',
        cancelButtonColor: '#6b7280',
        confirmButtonText: 'Sí, anular',
        cancelButtonText: 'Cancelar',
        inputValidator: (value) => {
          if (!value?.trim()) return 'El motivo es obligatorio';
          return null;
        },
        didClose: () => {
          this.modal?.show();
        }
      }).then(result => {
        if (result.isConfirmed && result.value) {
          this.moraService.anularMora(mora.idMora, result.value.trim()).subscribe({
            next: () => { this.toastr.success('Mora anulada correctamente', 'Éxito'); this.cargarMoras(); },
            error: (err) => { this.toastr.error(err?.error?.message || 'No se pudo anular la mora', 'Error'); }
          });
        }
      });
    }, 200);
  }

  anularPagoMora(idPagoMora: number, numeroComprobante: string | null): void {
    const texto = numeroComprobante
      ? `Ingrese el motivo de anulación del pago ${numeroComprobante}:`
      : 'Ingrese el motivo de anulación del pago:';
    this.modal?.hide();
    setTimeout(() => {
      Swal.fire({
        title: 'Anular pago de mora',
        text: texto,
        input: 'textarea',
        inputPlaceholder: 'Motivo obligatorio...',
        inputAttributes: { 'aria-label': 'Motivo de anulación' },
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc2626',
        cancelButtonColor: '#6b7280',
        confirmButtonText: 'Sí, anular',
        cancelButtonText: 'Cancelar',
        inputValidator: (value) => {
          if (!value?.trim()) return 'El motivo es obligatorio';
          return null;
        },
        didClose: () => {
          this.modal?.show();
        }
      }).then(result => {
        if (result.isConfirmed && result.value) {
          this.moraService.anularPagoMora(idPagoMora, result.value.trim()).subscribe({
            next: () => { this.toastr.success('Pago de mora anulado correctamente', 'Éxito'); this.cargarMoras(); },
            error: (err) => { this.toastr.error(err?.error?.message || 'No se pudo anular el pago de mora', 'Error'); }
          });
        }
      });
    }, 200);
  }

  cerrarModal(): void {
    this.modal?.hide();
    setTimeout(() => {
      this.modal?.dispose();
      document.body.classList.remove('modal-open');
      document.body.style.removeProperty('overflow');
      document.body.style.removeProperty('padding-right');
      document.querySelectorAll('.modal-backdrop').forEach(el => el.remove());
      this.onClose.emit();
    }, 300);
  }
}