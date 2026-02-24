import { Component } from '@angular/core';
import { CommonModule } from '@angular/common'; // 🟢 Necesario para *ngIf y *ngFor
import { FormsModule } from '@angular/forms'; // 🟢 Necesario para [(ngModel)]
import Swal from 'sweetalert2';
import { LecturaService } from '../../services/lectura.service';

@Component({
  selector: 'app-lectura-planilla',
  standalone: true, // 🟢 Indica que es un componente independiente
  imports: [CommonModule, FormsModule], // 🟢 Agregamos los módulos aquí
  templateUrl: './lectura-plantilla.html',
  styleUrls: ['./lectura-plantilla.scss']
})
export class LecturaPlanillaComponent {
  tipoSeleccionado: string = 'LUZ';
  planilla: any[] = [];
  cargando: boolean = false;

  constructor(private lecturaService: LecturaService) {}

  cargarPlanilla() {
    this.cargando = true;
    this.lecturaService.prepararPlanilla(this.tipoSeleccionado).subscribe({
      next: (data) => {
        this.planilla = data.map(f => ({
          ...f,
          lecturaActual: f.lecturaAnterior,
          consumo: 0,
          error: false
        }));
        this.cargando = false;
      },
      error: () => {
        this.cargando = false;
        Swal.fire('Error', 'No se pudo conectar con el servidor', 'error');
      }
    });
  }

  calcular(fila: any) {
    if (fila.lecturaActual < fila.lecturaAnterior) {
      fila.error = true;
      fila.consumo = 0;
    } else {
      fila.error = false;
      fila.consumo = fila.lecturaActual - fila.lecturaAnterior;
    }
  }

  esPlanillaValida(): boolean {
    return this.planilla.length > 0 && 
           this.planilla.every(f => !f.error && f.lecturaActual >= f.lecturaAnterior);
  }

  guardarTodo() {
    const datosEnvio = this.planilla.map(f => ({
      idContrato: f.idContrato,
      tipoServicio: this.tipoSeleccionado,
      lecturaAnterior: f.lecturaAnterior,
      lecturaActual: f.lecturaActual,
      estado: 'PENDIENTE'
    }));

    this.lecturaService.guardarPlanilla(datosEnvio).subscribe({
      next: () => {
        Swal.fire('Guardado', 'Planilla registrada correctamente', 'success');
        this.planilla = [];
      },
      error: (err) => Swal.fire('Error', 'Error al guardar: ' + err.error, 'error')
    });
  }
}