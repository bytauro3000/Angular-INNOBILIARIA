import { Component, EventEmitter, Input, OnInit, Output, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import * as bootstrap from 'bootstrap';
import Swal from 'sweetalert2';

import { PagoLetraService } from '../../services/pagoletra.service';
import { PagoLetraResponse } from '../../dto/pagoletraresponse.dto';
import { Moneda } from '../../dto/moneda.enum';
import { TokenService } from '../../auth/token.service';
import { jwtDecode } from 'jwt-decode';

@Component({
  selector: 'app-pago-lista-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './pago-lista-modal.html',
  styleUrls: ['./pago-lista-modal.scss']
})
export class PagoListaModalComponent implements OnInit, AfterViewInit {
  @ViewChild('modalElement') modalElement!: ElementRef;
  private modal?: bootstrap.Modal;

  @Input() idContrato!: number;
  @Input() monedaContrato: Moneda = 'USD';
  @Output() onClose = new EventEmitter<void>();
  @Output() onPagoEliminado = new EventEmitter<void>();

  pagos: PagoLetraResponse[] = [];
  cargando = false;
  eliminando = false;
  anulando = false;
  esAdministrador = false;

  constructor(
    private pagoService: PagoLetraService,
    private toastr: ToastrService,
    private tokenService: TokenService
  ) {}

  ngOnInit(): void {
    this.verificarRol();
    this.cargarPagos();
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
    } catch {
      this.esAdministrador = false;
    }
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

  cargarPagos(): void {
    if (!this.idContrato) return;
    this.cargando = true;
    this.pagoService.listarPorContrato(this.idContrato).subscribe({
      next: (data) => { this.pagos = data; this.cargando = false; },
      error: () => { this.toastr.error('No se pudieron cargar los pagos'); this.cargando = false; }
    });
  }

  getNumeroLetraLimpio(numeroLetra: string | undefined): string {
    return numeroLetra ? numeroLetra.split('/')[0] : '';
  }

  getNumeroComprobante(pago: PagoLetraResponse): string | undefined {
    return (pago as any).comprobante?.numeroCompleto ?? pago.numeroComprobante;
  }

  eliminarPago(idPago: number): void {
    if (this.eliminando) return;

    const pago = this.pagos.find(p => p.idPago === idPago);
    const numeroComprobante = this.getNumeroComprobante(pago!);
    const pagosDelMismoComprobante = numeroComprobante
      ? this.pagos.filter(p => this.getNumeroComprobante(p) === numeroComprobante)
      : [];
    const esMultiple = pagosDelMismoComprobante.length > 1;

    const numerosLetra = (esMultiple ? pagosDelMismoComprobante : [pago!])
      .map(p => p.numeroLetra ? p.numeroLetra.split('/')[0].trim() : '?')
      .sort((a, b) => parseInt(a) - parseInt(b));

    const letrasTexto = numerosLetra.length === 1
      ? `la Letra N° <strong>${numerosLetra[0]}</strong>`
      : `las Letras N° <strong>${numerosLetra.slice(0, -1).join(', ')} y ${numerosLetra[numerosLetra.length - 1]}</strong>`;

    Swal.fire({
      title: esMultiple ? '¿Eliminar pago múltiple?' : '¿Eliminar comprobante?',
      html: esMultiple
        ? `El comprobante <strong>${numeroComprobante}</strong> agrupa ${letrasTexto}. Se eliminarán los ${pagosDelMismoComprobante.length} pagos. ¡Esta acción no se puede revertir!`
        : `Se eliminará el comprobante <strong>${numeroComprobante}</strong> correspondiente a ${letrasTexto}. ¡Esta acción no se puede revertir!`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#6b7280',
      confirmButtonText: esMultiple ? `Sí, eliminar los ${pagosDelMismoComprobante.length} pagos` : 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then(result => {
      if (result.isConfirmed) {
        this.eliminando = true;
        const ids = esMultiple ? pagosDelMismoComprobante.map(p => p.idPago) : [idPago];
        this.eliminarSecuencial(ids, 0);
      }
    });
  }

  private eliminarSecuencial(ids: number[], index: number): void {
    if (index >= ids.length) {
      this.toastr.success(
        ids.length > 1 ? `${ids.length} pagos eliminados correctamente` : 'Pago eliminado correctamente',
        'Éxito'
      );
      this.eliminando = false;
      this.cargarPagos();
      this.onPagoEliminado.emit();
      return;
    }
    this.pagoService.eliminarPago(ids[index]).subscribe({
      next: () => this.eliminarSecuencial(ids, index + 1),
      error: () => {
        this.toastr.error(`Error al eliminar el pago ID ${ids[index]}`, 'Error');
        this.eliminando = false;
        this.cargarPagos();
        this.onPagoEliminado.emit();
      }
    });
  }

  anularPago(idPago: number): void {
    if (this.anulando) return;
    const pago = this.pagos.find(p => p.idPago === idPago);

    Swal.fire({
      title: 'Anular pago',
      html: `
        <p style="margin-bottom:12px">Ingrese el motivo de anulación del pago de la letra <strong>N° ${this.getNumeroLetraLimpio(pago?.numeroLetra)}</strong>:</p>
        <textarea id="motivo-anulacion" class="swal2-textarea" placeholder="Motivo obligatorio..." rows="3" style="width:100%;resize:vertical"></textarea>
      `,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Anular pago',
      cancelButtonText: 'Cancelar',
      preConfirm: () => {
        const motivo = (document.getElementById('motivo-anulacion') as HTMLTextAreaElement)?.value?.trim();
        if (!motivo) {
          Swal.showValidationMessage('El motivo es obligatorio');
          return false;
        }
        return motivo;
      }
    }).then(result => {
      if (result.isConfirmed && result.value) {
        this.anulando = true;
        this.pagoService.anularPago(idPago, result.value).subscribe({
          next: () => {
            this.toastr.success('Pago anulado correctamente', 'Éxito');
            this.anulando = false;
            this.cargarPagos();
            this.onPagoEliminado.emit();
          },
          error: (err) => {
            const msg = err?.error?.message || 'No se pudo anular el pago';
            this.toastr.error(msg, 'Error');
            this.anulando = false;
          }
        });
      }
    });
  }
}