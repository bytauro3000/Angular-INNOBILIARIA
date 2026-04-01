import {
  Component, EventEmitter, Input, OnInit, Output,
  ViewChild, ElementRef, AfterViewInit
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastrService } from 'ngx-toastr';
import * as bootstrap from 'bootstrap';
import Swal from 'sweetalert2';
import { MoraService } from '../../services/mora.service';
import { MoraResponse } from '../../dto/moraresponse.dto';
import { MoraPagarComponent } from '../mora-pagar/mora-pagar.component';

/**
 * Modal que lista todas las moras de un contrato.
 * Permite ver el estado de cada mora, pagarlas si están PENDIENTES
 * y descargar el comprobante PDF si ya están PAGADAS.
 */
@Component({
  selector: 'app-mora-listar',
  standalone: true,
  imports: [CommonModule, MoraPagarComponent],
  templateUrl: './mora-listar.html',
  styleUrls: ['./mora-listar.scss']
})
export class MoraListarComponent implements OnInit, AfterViewInit {
  @ViewChild('modalElement') modalElement!: ElementRef;
  private modal?: bootstrap.Modal;

  @Input() idContrato!: number;
  @Input() simboloMoneda: string = '$';

  @Output() onClose = new EventEmitter<void>();

  moras: MoraResponse[] = [];
  cargando = true;

  moraParaPagar: MoraResponse | null = null;

  constructor(
    private moraService: MoraService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.cargarMoras();
  }

  ngAfterViewInit(): void {
    this.modal = new bootstrap.Modal(this.modalElement.nativeElement);
    this.modal.show();
  }

  cargarMoras(): void {
    this.cargando = true;
    this.moraService.listarPorContrato(this.idContrato).subscribe({
      next: (data) => { this.moras = data; this.cargando = false; },
      error: () => {
        this.toastr.error('Error al cargar las moras', 'Error');
        this.cargando = false;
      }
    });
  }

  // ── Computed ────────────────────────────────────────────────────────────

  get morasPendientes(): MoraResponse[] {
    return this.moras.filter(m => m.estadoMora === 'PENDIENTE');
  }

  get morasPagadas(): MoraResponse[] {
    return this.moras.filter(m => m.estadoMora === 'PAGADO');
  }

  get morasAnuladas(): MoraResponse[] {
    return this.moras.filter(m => m.estadoMora === 'ANULADO');
  }

  get totalPendiente(): number {
    return this.morasPendientes.reduce((sum, m) => sum + m.montoMoraTotal, 0);
  }

  // ── Acciones ────────────────────────────────────────────────────────────

  abrirPagarMora(mora: MoraResponse): void {
    this.moraParaPagar = mora;
  }

  cerrarPagarMora(): void {
    this.moraParaPagar = null;
  }

  /**
   * Cuando el sub-modal mora-pagar completa el pago, nos devuelve el idPagoMora
   * para poder abrir el comprobante PDF automáticamente.
   */
  onMoraPagada(idPagoMora?: number): void {
    this.cerrarPagarMora();
    this.cargarMoras();

    if (idPagoMora) {
      this.descargarComprobanteMora(idPagoMora);
    }
  }

  descargarComprobanteMora(idPagoMora: number): void {
    this.moraService.descargarComprobante(idPagoMora).subscribe({
      next: (blob) => { window.open(URL.createObjectURL(blob), '_blank'); },
      error: () => {
        this.toastr.warning(
          'No se pudo abrir el comprobante de mora automáticamente.',
          'Aviso'
        );
      }
    });
  }

  anularMora(mora: MoraResponse): void {
    Swal.fire({
      title: '¿Anular mora?',
      text: `¿Estás seguro de anular la mora de la letra N° ${mora.numeroLetra}? Esta acción es administrativa.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Sí, anular',
      cancelButtonText: 'Cancelar'
    }).then(result => {
      if (result.isConfirmed) {
        this.moraService.anularMora(mora.idMora, 'Anulación administrativa').subscribe({
          next: () => {
            this.toastr.success('Mora anulada correctamente', 'Éxito');
            this.cargarMoras();
          },
          error: (err) => {
            const msg = err?.error?.message || 'No se pudo anular la mora';
            this.toastr.error(msg, 'Error');
          }
        });
      }
    });
  }

  cerrarModal(): void {
    this.modal?.hide();
    setTimeout(() => this.onClose.emit(), 300);
  }
}