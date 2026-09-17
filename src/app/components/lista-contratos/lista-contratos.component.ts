import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ContratoService } from '../../services/contrato.service';
import { ProgramaService } from '../../services/programa.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-lista-contratos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './lista-contratos.html',
  styleUrls: ['./lista-contratos.scss']
})
export class ListaContratosComponent implements OnInit {

  programas: any[] = [];
  programaSeleccionado: number | null = null;

  estadosDisponibles: string[] = ['ACTIVO', 'MORA', 'CANCELADO', 'RENUNCIA'];
  estadosSeleccionados: string[] = [];

  contratos: any[] = [];
  cargando: boolean = false;
  generando: boolean = false;

  constructor(
    private contratoService: ContratoService,
    private programaService: ProgramaService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.programaService.listarProgramas().subscribe({
      next: (data) => this.programas = data,
      error: () => this.toastr.error('Error al cargar programas', 'Error')
    });
  }

  toggleEstado(estado: string): void {
    if (estado === 'TODOS') {
      if (this.estadosSeleccionados.length === this.estadosDisponibles.length) {
        this.estadosSeleccionados = [];
      } else {
        this.estadosSeleccionados = [...this.estadosDisponibles];
      }
      return;
    }
    const idx = this.estadosSeleccionados.indexOf(estado);
    if (idx >= 0) {
      this.estadosSeleccionados.splice(idx, 1);
    } else {
      this.estadosSeleccionados.push(estado);
    }
  }

  isSelected(estado: string): boolean {
    if (estado === 'TODOS') {
      return this.estadosSeleccionados.length === this.estadosDisponibles.length;
    }
    return this.estadosSeleccionados.includes(estado);
  }

  buscar(): void {
    this.cargando = true;
    this.contratoService.listaContratos(this.programaSeleccionado, this.estadosSeleccionados).subscribe({
      next: (data) => {
        this.contratos = data;
        this.cargando = false;
      },
      error: () => {
        this.toastr.error('Error al cargar contratos', 'Error');
        this.cargando = false;
      }
    });
  }

  descargarPdf(): void {
    this.generando = true;
    this.contratoService.descargarListaPdf(this.programaSeleccionado, this.estadosSeleccionados).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'Lista_Contratos.pdf';
        a.click();
        URL.revokeObjectURL(url);
        this.generando = false;
        this.toastr.success('PDF generado', 'Exito');
      },
      error: () => {
        this.toastr.error('Error al generar PDF', 'Error');
        this.generando = false;
      }
    });
  }

  descargarExcel(): void {
    this.generando = true;
    this.contratoService.descargarListaExcel(this.programaSeleccionado, this.estadosSeleccionados).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'Lista_Contratos.xlsx';
        a.click();
        URL.revokeObjectURL(url);
        this.generando = false;
        this.toastr.success('Excel generado', 'Exito');
      },
      error: () => {
        this.toastr.error('Error al generar Excel', 'Error');
        this.generando = false;
      }
    });
  }

  descargarWord(): void {
    this.generando = true;
    this.contratoService.descargarListaWord(this.programaSeleccionado, this.estadosSeleccionados).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'Lista_Contratos.docx';
        a.click();
        URL.revokeObjectURL(url);
        this.generando = false;
        this.toastr.success('Word generado', 'Exito');
      },
      error: () => {
        this.toastr.error('Error al generar Word', 'Error');
        this.generando = false;
      }
    });
  }

  agruparPorPrograma(): { programa: string; contratos: any[] }[] {
    const grupos: { programa: string; contratos: any[] }[] = [];
    let programaActual = '';
    let contratosActuales: any[] = [];

    for (const c of this.contratos) {
      const prog = c.nombrePrograma || 'SIN PROGRAMA';
      if (prog !== programaActual) {
        if (contratosActuales.length > 0) {
          grupos.push({ programa: programaActual, contratos: contratosActuales });
        }
        programaActual = prog;
        contratosActuales = [];
      }
      contratosActuales.push(c);
    }
    if (contratosActuales.length > 0) {
      grupos.push({ programa: programaActual, contratos: contratosActuales });
    }
    return grupos;
  }
}
