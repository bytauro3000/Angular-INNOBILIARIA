import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { ContratoService } from '../../services/contrato.service';
import { ProgramaService } from '../../services/programa.service';
import { Programa } from '../../models/programa.model';
import { ContratoResponseDTO } from '../../dto/contratoreponse.dto';
import { HistorialMorasPdfComponent } from './historial-moras-pdf.component';

@Component({
  selector: 'app-historial-moras-picker',
  standalone: true,
  imports: [CommonModule, FormsModule, HistorialMorasPdfComponent],
  templateUrl: './historial-moras-picker.component.html',
  styleUrls: ['./historial-moras-picker.component.scss']
})
export class HistorialMorasPickerComponent implements OnInit {

  @ViewChild('inputManzana') inputManzana!: ElementRef<HTMLInputElement>;

  programas:    Programa[]            = [];
  programaSel:  number | null         = null;
  manzana:      string                = '';
  numeroLote:   string                = '';

  buscando:     boolean               = false;
  contrato:     ContratoResponseDTO | null = null;

  mostrarReporte: boolean = false;

  /** Fecha para calcular moras pendientes (YYYY-MM-DD). Por defecto: hoy. */
  fechaCalculo: string = new Date().toISOString().slice(0, 10);

  constructor(
    private programaService:  ProgramaService,
    private contratoService:  ContratoService,
    private toastr:           ToastrService
  ) {}

  ngOnInit(): void {
    this.cargarProgramas();
  }

  cargarProgramas(): void {
    this.programaService.listarProgramas().subscribe({
      next: (data) => this.programas = data,
      error: () => this.toastr.error('No se pudieron cargar los programas.', 'Error')
    });
  }

  buscarContrato(): void {
    if (!this.programaSel || !this.manzana.trim() || !this.numeroLote.trim()) {
      this.toastr.warning('Seleccione programa, manzana y lote.', 'Validación');
      return;
    }
    this.buscando = true;
    this.contrato = null;
    this.contratoService.buscarPorProgramaManzanaLote(
      this.programaSel, this.manzana.trim(), this.numeroLote.trim()
    ).subscribe({
      next: (c) => {
        this.contrato = c;
        this.buscando  = false;
        if (!c) this.toastr.warning('No se encontró contrato con esos datos.', 'Sin resultados');
      },
      error: () => {
        this.buscando = false;
        this.toastr.error('Error al buscar el contrato.', 'Error');
      }
    });
  }

  abrirReporte(): void {
    if (!this.contrato) return;
    this.mostrarReporte = true;
  }

  cerrarReporte(): void {
    this.mostrarReporte = false;
  }

  limpiar(): void {
    this.contrato     = null;
    this.programaSel   = null;
    this.manzana       = '';
    this.numeroLote    = '';
    this.fechaCalculo  = new Date().toISOString().slice(0, 10);
    setTimeout(() => this.inputManzana?.nativeElement?.focus(), 50);
  }
}
