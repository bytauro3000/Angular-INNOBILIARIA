import { Component, EventEmitter, Input, OnInit, Output, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import * as bootstrap from 'bootstrap';
import Swal from 'sweetalert2';

import { PagoLetraService } from '../../services/pagoletra.service';
import { PagoLetraResponse } from '../../dto/pagoletraresponse.dto';

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

    Swal.fire({
      title: '¿Estás seguro?',
      text: '¡No podrás revertir esto!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.eliminando = true;
        this.pagoService.eliminarPago(idPago).subscribe({
          next: () => {
            this.toastr.success('Pago eliminado correctamente', 'Éxito');
            this.eliminando = false;
            this.cargarPagos();
            this.onPagoEliminado.emit();
          },
          error: (err) => {
            console.error('Error al eliminar pago:', err);
            this.toastr.error('Error al eliminar el pago', 'Error');
            this.eliminando = false;
          }
        });
      }
    });
  }
}