import { Component, EventEmitter, Input, OnInit, Output, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import * as bootstrap from 'bootstrap';
import Swal from 'sweetalert2';

import { PagoLetraService } from '../../services/pagoletra.service';
import { PagoLetraResponse } from '../../dto/pagoletraresponse.dto';
import { Moneda } from '../../dto/moneda.enum';

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
  cargando: boolean = false;
  eliminando: boolean = false;

  constructor(
    private pagoService: PagoLetraService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.cargarPagos();
  }

  ngAfterViewInit(): void {
    this.modal = new bootstrap.Modal(this.modalElement.nativeElement);
    this.modal.show();
  }

  cerrarModal(): void {
    this.modal?.hide();
    setTimeout(() => this.onClose.emit(), 300);
  }

  cargarPagos(): void {
    if (!this.idContrato) return;
    this.cargando = true;
    this.pagoService.listarPorContrato(this.idContrato).subscribe({
      next: (data) => {
        this.pagos = data;
        this.cargando = false;
      },
      error: (err) => {
        console.error('Error al cargar pagos:', err);
        this.toastr.error('No se pudieron cargar los pagos');
        this.cargando = false;
      }
    });
  }

  // Modificado para aceptar undefined
  getNumeroLetraLimpio(numeroLetra: string | undefined): string {
    return numeroLetra ? numeroLetra.split('/')[0] : '';
  }

  eliminarPago(idPago: number): void {
    if (this.eliminando) return;

    // Buscar el pago seleccionado
    const pago = this.pagos.find(p => p.idPago === idPago);
    const numeroComprobante = pago?.numeroComprobante;

    // Detectar si es un pago múltiple (mismo número de comprobante en más de 1 pago)
    const pagosDelMismoComprobante = numeroComprobante
      ? this.pagos.filter(p => p.numeroComprobante === numeroComprobante)
      : [];
    const esMultiple = pagosDelMismoComprobante.length > 1;

    // Obtener números de letra limpios (ej: "4", "5", "6")
    const numerosLetra = esMultiple
      ? pagosDelMismoComprobante
          .map(p => p.numeroLetra ? p.numeroLetra.split('/')[0].trim() : '?')
          .sort((a, b) => parseInt(a) - parseInt(b))
      : [pago?.numeroLetra ? pago.numeroLetra.split('/')[0].trim() : '?'];

    // Armar texto de letras: "4, 5 y 6" o simplemente "4"
    let letrasTexto: string;
    if (numerosLetra.length === 1) {
      letrasTexto = `la Letra N° <strong>${numerosLetra[0]}</strong>`;
    } else {
      const ultimas = numerosLetra[numerosLetra.length - 1];
      const anteriores = numerosLetra.slice(0, -1).join(', ');
      letrasTexto = `las Letras N° <strong>${anteriores} y ${ultimas}</strong>`;
    }

    const titulo = esMultiple
      ? '¿Eliminar pago múltiple?'
      : '¿Eliminar comprobante?';

    const texto = esMultiple
      ? `El comprobante <strong>${numeroComprobante}</strong> agrupa ${letrasTexto}. Se eliminarán los ${pagosDelMismoComprobante.length} pagos. ¡Esta acción no se puede revertir!`
      : `Se eliminará el comprobante <strong>${numeroComprobante}</strong> correspondiente a ${letrasTexto}. ¡Esta acción no se puede revertir!`;

    Swal.fire({
      title: titulo,
      html: texto,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#6b7280',
      confirmButtonText: esMultiple ? `Sí, eliminar los ${pagosDelMismoComprobante.length} pagos` : 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.eliminando = true;

        // IDs a eliminar: si es múltiple, todos del mismo comprobante; si no, solo este
        const idsAEliminar = esMultiple
          ? pagosDelMismoComprobante.map(p => p.idPago)
          : [idPago];

        // Eliminar secuencialmente
        this.eliminarSecuencial(idsAEliminar, 0);
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
      error: (err) => {
        console.error('Error al eliminar pago:', err);
        this.toastr.error(`Error al eliminar el pago ID ${ids[index]}`, 'Error');
        this.eliminando = false;
        this.cargarPagos();
        this.onPagoEliminado.emit();
      }
    });
  }
}