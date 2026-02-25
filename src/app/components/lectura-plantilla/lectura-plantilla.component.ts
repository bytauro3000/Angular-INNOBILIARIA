import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';
import { LecturaService } from '../../services/lectura.service';
import { ProgramaService } from '../../services/programa.service';
import { LecturaUnificadaDTO } from '../../dto/Lecturaunificada.dto';
import { Programa } from '../../models/programa.model';

@Component({
  selector: 'app-lectura-planilla',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './lectura-plantilla.html',
  styleUrls: ['./lectura-plantilla.scss']
})
export class LecturaPlanillaComponent implements OnInit {
  programaId: number | null = null;
  filtroManzana: string = '';
  filtroLote: string = '';
  fechaGiroManual: string = new Date().toISOString().split('T')[0];

  planillaCompleta: LecturaUnificadaDTO[] = [];
  planillaFiltrada: LecturaUnificadaDTO[] = [];
  programas: Programa[] = [];
  confLuz: any = null;
  confAgua: any = null;
  cargando: boolean = false;
  
  // 🟢 Mensaje dinámico inicial
  mensajeEstado: string = '⚠️ Seleccione un programa para cargar la lista de Luz y Agua.'; 

  constructor(
    private lecturaService: LecturaService,
    private programaService: ProgramaService
  ) {}

  ngOnInit(): void {
    this.cargarProgramas();
    this.cargarConfiguraciones();
  }

  cargarProgramas() {
    this.programaService.listarProgramas().subscribe(data => this.programas = data);
  }

  cargarConfiguraciones() {
    this.lecturaService.obtenerConfiguracion('LUZ').subscribe(c => this.confLuz = c);
    this.lecturaService.obtenerConfiguracion('AGUA').subscribe(c => this.confAgua = c);
  }

  onCambioPrograma() {
    this.planillaCompleta = [];
    this.planillaFiltrada = [];
    
    if (!this.programaId) {
      this.mensajeEstado = '⚠️ Seleccione un programa para cargar la lista de Luz y Agua.';
      return;
    }

    this.cargando = true;
    this.mensajeEstado = '⌛ Cargando planilla unificada, por favor espere...'; //

    this.lecturaService.prepararPlanillaUnificada(this.programaId).subscribe({
      next: (data) => {
        this.planillaCompleta = data.map(f => ({
          ...f,
          lecturaActLuz: f.lecturaAntLuz, 
          lecturaActAgua: f.lecturaAntAgua,
          consumoLuz: 0,
          importeLuz: 0,
          consumoAgua: 0,
          importeAgua: 0
        }));
        this.aplicarFiltrosLocal();
        this.cargando = false;
      },
      error: () => {
        this.cargando = false;
        this.mensajeEstado = '❌ Error al conectar con el servidor.';
        Swal.fire('Error', 'No se pudo obtener la planilla', 'error');
      }
    });
  }

  aplicarFiltrosLocal() {
    this.planillaFiltrada = this.planillaCompleta.filter(f => {
      const mz = !this.filtroManzana || f.manzana.toLowerCase().includes(this.filtroManzana.toLowerCase());
      const lt = !this.filtroLote || f.lote.toLowerCase().includes(this.filtroLote.toLowerCase());
      return mz && lt;
    });

    if (this.planillaFiltrada.length === 0 && this.programaId) {
      this.mensajeEstado = '🔍 No se encontraron clientes con los filtros aplicados.';
    }
  }

  calcular(fila: LecturaUnificadaDTO, tipo: 'LUZ' | 'AGUA') {
    if (tipo === 'LUZ') {
      fila.consumoLuz = Number(((fila.lecturaActLuz || 0) - fila.lecturaAntLuz).toFixed(2));
      fila.importeLuz = fila.consumoLuz * (this.confLuz?.precioUnitario || 0.80);
      fila.errorLuz = fila.lecturaActLuz !== null && fila.lecturaActLuz < fila.lecturaAntLuz;
    } else {
      fila.consumoAgua = Number(((fila.lecturaActAgua || 0) - fila.lecturaAntAgua).toFixed(2));
      fila.importeAgua = fila.consumoAgua * (this.confAgua?.precioUnitario || 15.00);
      fila.errorAgua = fila.lecturaActAgua !== null && fila.lecturaActAgua < fila.lecturaAntAgua;
    }
  }

  esPlanillaValida(): boolean {
    if (this.planillaCompleta.length === 0) return false;
    return this.planillaCompleta.every(f => 
      (!f.inscritoLuz || (f.lecturaActLuz !== null && f.lecturaActLuz > f.lecturaAntLuz && !f.errorLuz)) &&
      (!f.inscritoAgua || (f.lecturaActAgua !== null && f.lecturaActAgua > f.lecturaAntAgua && !f.errorAgua))
    );
  }

  guardarTodo() {
    this.lecturaService.guardarPlanillaUnificada(this.planillaCompleta, this.fechaGiroManual).subscribe({
      next: () => {
        Swal.fire('¡Éxito!', 'Registros procesados correctamente', 'success');
        this.planillaCompleta = [];
        this.planillaFiltrada = [];
        this.programaId = null;
        this.mensajeEstado = '⚠️ Seleccione un programa para cargar la lista de Luz y Agua.';
      }
    });
  }
}