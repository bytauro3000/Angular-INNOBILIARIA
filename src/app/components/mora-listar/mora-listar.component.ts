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
import { TokenService } from '../../auth/token.service';

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
  @Input() simboloMoneda = '$';
  @Output() onClose = new EventEmitter<void>();

  moras: MoraResponse[] = [];
  cargando = true;
  moraParaPagar: MoraResponse | null = null;
  esAdministrador = false;
  esSoporte = false;

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
      next: (data) => { this.moras = data; this.cargando = false; },
      error: () => { this.toastr.error('Error al cargar las moras', 'Error'); this.cargando = false; }
    });
  }

  get morasPendientes(): MoraResponse[] { return this.moras.filter(m => m.estadoMora === 'PENDIENTE'); }
  get morasPagadas(): MoraResponse[]    { return this.moras.filter(m => m.estadoMora === 'PAGADO'); }
  get morasAnuladas(): MoraResponse[]   { return this.moras.filter(m => m.estadoMora === 'ANULADO'); }
  get totalPendiente(): number { return this.morasPendientes.reduce((s, m) => s + m.montoMoraTotal, 0); }

  obtenerNumeroLetra(numeroLetra: string): string {
    if (!numeroLetra) return '';
    return numeroLetra.split('/')[0];
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
    Swal.fire({
      title: 'Anular mora',
      html: `
        <p style="margin-bottom:12px">Ingrese el motivo de anulación de la mora de la letra <strong>N° ${mora.numeroLetra}</strong>:</p>
        <textarea id="motivo-anulacion-mora" class="swal2-textarea" placeholder="Motivo obligatorio..." rows="3" style="width:100%;resize:vertical"></textarea>
      `,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Sí, anular',
      cancelButtonText: 'Cancelar',
      preConfirm: () => {
        const motivo = (document.getElementById('motivo-anulacion-mora') as HTMLTextAreaElement)?.value?.trim();
        if (!motivo) {
          Swal.showValidationMessage('El motivo es obligatorio');
          return false;
        }
        return motivo;
      }
    }).then(result => {
      if (result.isConfirmed && result.value) {
        this.moraService.anularMora(mora.idMora, result.value).subscribe({
          next: () => { this.toastr.success('Mora anulada correctamente', 'Éxito'); this.cargarMoras(); },
          error: (err) => { this.toastr.error(err?.error?.message || 'No se pudo anular la mora', 'Error'); }
        });
      }
    });
  }

  anularPagoMora(idPagoMora: number, numeroComprobante: string | null): void {
    Swal.fire({
      title: 'Anular pago de mora',
      html: `
        <p style="margin-bottom:12px">Ingrese el motivo de anulación del pago${numeroComprobante ? ' <strong>' + numeroComprobante + '</strong>' : ''}:</p>
        <textarea id="motivo-anulacion-pago-mora" class="swal2-textarea" placeholder="Motivo obligatorio..." rows="3" style="width:100%;resize:vertical"></textarea>
      `,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Sí, anular',
      cancelButtonText: 'Cancelar',
      preConfirm: () => {
        const motivo = (document.getElementById('motivo-anulacion-pago-mora') as HTMLTextAreaElement)?.value?.trim();
        if (!motivo) {
          Swal.showValidationMessage('El motivo es obligatorio');
          return false;
        }
        return motivo;
      }
    }).then(result => {
      if (result.isConfirmed && result.value) {
        this.moraService.anularPagoMora(idPagoMora, result.value).subscribe({
          next: () => { this.toastr.success('Pago de mora anulado correctamente', 'Éxito'); this.cargarMoras(); },
          error: (err) => { this.toastr.error(err?.error?.message || 'No se pudo anular el pago de mora', 'Error'); }
        });
      }
    });
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