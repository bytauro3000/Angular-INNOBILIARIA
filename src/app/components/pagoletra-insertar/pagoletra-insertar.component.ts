import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';

import { LetraCambio } from '../../models/letra-cambio.model';
import { PagoLetraService } from '../../services/pagoletra.service';
import { PagoLetraRequest } from '../../dto/pagoletrarequest .dto';
import {MedioPago} from '../../enums/mediopago.enum';
import { TipoComprobante } from '../../enums/tipocomprobante';

@Component({
  selector: 'app-pago-letra-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './pagoletra-insertar.html',
  styleUrls: ['./pagoletra-insertar.scss']
})
export class PagoletraInsertarComponent implements OnInit {
  @Input() letra!: LetraCambio;
  @Output() onClose = new EventEmitter<void>();
  @Output() onPagoExitoso = new EventEmitter<void>();

  // Enums para selects
  medioPagoOptions = Object.values(MedioPago);
  tipoComprobanteOptions = Object.values(TipoComprobante);

  // Modelo del formulario
  pagoRequest: PagoLetraRequest = {
    idLetra: 0,
    importePagado: 0,
    medioPago: MedioPago.EFECTIVO,
    numeroOperacion: '',
    fechaOperacion: '',
    tipoComprobante: undefined,
    numeroComprobante: '',
    observaciones: ''
  };

  voucherFile: File | null = null;
  enviando: boolean = false;

  constructor(
    private pagoService: PagoLetraService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    if (this.letra) {
      this.pagoRequest.idLetra = this.letra.idLetra;
      this.pagoRequest.importePagado = this.letra.importe; // Por defecto el importe de la letra
      // Opcional: pre-cargar fecha de operación con hoy
      this.pagoRequest.fechaOperacion = new Date().toISOString().split('T')[0];
    }
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      // Validar tipo y tamaño si es necesario
      this.voucherFile = file;
    }
  }

  guardarPago(): void {
    // Validaciones básicas
    if (!this.pagoRequest.importePagado || this.pagoRequest.importePagado <= 0) {
      this.toastr.warning('El importe pagado debe ser mayor a cero', 'Validación');
      return;
    }
    if (!this.pagoRequest.medioPago) {
      this.toastr.warning('Debe seleccionar un medio de pago', 'Validación');
      return;
    }

    this.enviando = true;
    this.pagoService.registrarPago(this.pagoRequest, this.voucherFile || undefined).subscribe({
      next: (response) => {
        this.toastr.success('Pago registrado correctamente', 'Éxito');
        this.enviando = false;
        this.onPagoExitoso.emit();
      },
      error: (err) => {
        console.error('Error al registrar pago:', err);
        this.toastr.error('Error al registrar el pago', 'Error');
        this.enviando = false;
      }
    });
  }

  cerrarModal(): void {
    this.onClose.emit();
  }
}