import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InscripcionService } from '../../services/inscripcion.service';
import { InscripcionServicioDTO } from '../../dto/inscripcionservicio.model';
import { TipoServicios } from '../../enums/tiposervicio';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-inscripcion-servicios-insertar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './inscripcion-servicios-insertar.html',
  styleUrls: ['./inscripcion-servicios-insertar.scss']
})
export class InscripcionServiciosInsertarComponent {
  @Output() inscripcionExitosa = new EventEmitter<void>();

  idContrato!: number;
  tipoServicio: TipoServicios = TipoServicios.LUZ;
  monto: number = 200;
  loading: boolean = false;
  
  // 🟢 Nueva variable de control
  estaAbierto: boolean = false;

  TipoServicios = TipoServicios;

  constructor(
    private inscripcionService: InscripcionService,
    private toastr: ToastrService
  ) {}

  // 🟢 Ya no necesitamos el objeto "bootstrap"
  abrirModal(idContrato: number): void {
    this.idContrato = idContrato;
    this.tipoServicio = TipoServicios.LUZ;
    this.estaAbierto = true;
  }

  cerrarModal(): void {
    this.estaAbierto = false;
  }

  confirmarInscripcion(): void {
    this.loading = true;
    const request: InscripcionServicioDTO = {
      idContrato: this.idContrato,
      tipoServicio: this.tipoServicio,
      montoPagado: this.monto
    };

    this.inscripcionService.registrarInscripcion(request).subscribe({
      next: () => {
        this.toastr.success(`Servicio registrado correctamente`, '¡Éxito!');
        this.loading = false;
        this.inscripcionExitosa.emit();
        this.cerrarModal();
      },
      error: (err) => {
        this.loading = false;
        this.toastr.error(err.error || 'Error al procesar la inscripción.', 'Error');
      }
    });
  }
}