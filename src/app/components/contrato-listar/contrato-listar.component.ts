import { Component, ViewChild, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { ContratoService } from '../../services/contrato.service';
import { ProgramaService } from '../../services/programa.service';
import { ContratoResponseDTO } from '../../dto/contratoreponse.dto';
import { Programa } from '../../models/programa.model';
import { TipoContrato } from '../../enums/tipocontrato.enum';
import { ToastrService } from 'ngx-toastr';
import { InscripcionServiciosInsertarComponent } from '../inscripcion-servicios-insertar/inscripcion-servicios-insertar.component';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-contrato-listar',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    CurrencyPipe,
    DatePipe,
    InscripcionServiciosInsertarComponent
  ],
  templateUrl: './contrato-listar.html',
  styleUrls: ['./contrato-listar.scss'],
})
export class ContratoListarComponent implements OnInit {

  @ViewChild('modalInscripcion') modalInscripcion!: InscripcionServiciosInsertarComponent;

  contratos: ContratoResponseDTO[] = [];
  contratosFiltrados: ContratoResponseDTO[] = [];
  paginatedContratos: ContratoResponseDTO[] = [];

  // CONTROL DE VISTA DE FILTROS
  tipoBusqueda: 'ID' | 'LOTE' = 'ID'; 

  terminoBusqueda: string = '';

  // Para búsqueda por lote
  programas: Programa[] = [];
  programaSeleccionado: number | null = null;
  manzanaBusqueda: string = '';
  numeroLoteBusqueda: string = '';

  pageSize: number = 5;
  currentPage: number = 1;
  totalPages: number = 0;

  TipoContrato = TipoContrato;

  constructor(
    private contratoService: ContratoService,
    private programaService: ProgramaService,
    private toastr: ToastrService,
    private cdr: ChangeDetectorRef 
  ) { }

  ngOnInit(): void {
    this.cargarContratos();
    this.cargarProgramas();
  }

  // Cambiar entre modos de búsqueda y resetear valores
  cambiarModoBusqueda(modo: 'ID' | 'LOTE'): void {
    this.tipoBusqueda = modo;
    this.limpiarBusqueda();
  }

  cargarContratos(): void {
    this.contratoService.listarContrato().subscribe({
      next: (data) => {
        this.contratos = [...data]; 
        this.filtrarContratos();
        this.cdr.markForCheck(); 
      },
      error: (error) => {
        console.error('Error al cargar contratos:', error);
        this.toastr.error('Error al cargar los contratos.', 'Error');
        this.cdr.detectChanges();
      }
    });
  }

  cargarProgramas(): void {
    this.programaService.listarProgramas().subscribe({
      next: (data) => {
        this.programas = data;
      },
      error: (err) => {
        console.error('Error al cargar programas:', err);
        this.toastr.warning('No se pudieron cargar los programas', 'Aviso');
      }
    });
  }

  buscarPorLote(): void {
    if (!this.programaSeleccionado || !this.manzanaBusqueda.trim() || !this.numeroLoteBusqueda.trim()) {
      this.toastr.warning('Debe seleccionar un programa, ingresar manzana y número de lote', 'Atención');
      return;
    }

    this.contratoService.buscarPorProgramaManzanaLote(
      this.programaSeleccionado,
      this.manzanaBusqueda.trim().toUpperCase(),
      this.numeroLoteBusqueda.trim().toUpperCase()
    ).subscribe({
      next: (contrato) => {
        this.contratosFiltrados = [contrato];
        this.currentPage = 1;
        this.aplicarPaginacion();
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error al buscar contrato por lote:', err);
        this.toastr.error('No se encontró ningún contrato para esos datos', 'Error');
      }
    });
  }

  limpiarBusqueda(): void {
    this.programaSeleccionado = null;
    this.manzanaBusqueda = '';
    this.numeroLoteBusqueda = '';
    this.terminoBusqueda = '';
    this.filtrarContratos();
  }

  imprimirContrato(contrato: ContratoResponseDTO): void {
    if (contrato.tipoContrato === 'FINANCIADO' && (!contrato.letras || contrato.letras.length === 0)) {
      this.toastr.warning('Primero debe generar las letras de cambio para este contrato.', 'Atención');
      return;
    }

    this.toastr.info('Generando documento...', 'Espere');

    this.contratoService.imprimirContratoPdf(contrato.idContrato).subscribe({
      next: (blob: Blob) => {
        const listaLotes = contrato.lotes;
        let nombreBase = '';

        if (listaLotes.length === 1) {
          nombreBase = `MZ. ${listaLotes[0].manzana} LT. ${listaLotes[0].numeroLote}`;
        } else {
          const todasMismaMz = listaLotes.every(l => l.manzana === listaLotes[0].manzana);
          if (todasMismaMz) {
            const lotesTexto = listaLotes.map(l => l.numeroLote).join(' y ');
            nombreBase = `MZ. ${listaLotes[0].manzana} LT. ${lotesTexto}`;
          } else {
            nombreBase = listaLotes.map(l => `MZ. ${l.manzana} LT. ${l.numeroLote}`).join(' y ');
          }
        }

        const tipo = contrato.tipoContrato.charAt(0).toUpperCase() + contrato.tipoContrato.slice(1).toLowerCase();
        const nombreArchivoFinal = `${nombreBase} - ${tipo}.pdf`;

        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = nombreArchivoFinal;
        link.click();
        
        window.URL.revokeObjectURL(url);
        this.toastr.success('Contrato descargado con éxito', 'Éxito');
      },
      error: (err: any) => {
        console.error('Error al descargar el PDF:', err);
        this.toastr.error('No se pudo obtener el PDF desde el servidor.', 'Error');
      }
    });
  }

  filtrarContratos(): void {
    if (!this.terminoBusqueda) {
      this.contratosFiltrados = [...this.contratos];
    } else {
      const termino = this.terminoBusqueda.toLowerCase();
      this.contratosFiltrados = this.contratos.filter(contrato =>
        contrato.idContrato?.toString().includes(termino)
      );
    }
    this.currentPage = 1;
    this.aplicarPaginacion();
  }

  aplicarPaginacion(): void {
    this.totalPages = Math.ceil(this.contratosFiltrados.length / this.pageSize);
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.paginatedContratos = this.contratosFiltrados.slice(startIndex, endIndex);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.aplicarPaginacion();
      this.cdr.detectChanges();
    }
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.goToPage(this.currentPage - 1);
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.goToPage(this.currentPage + 1);
    }
  }

  getPagesArray(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  abrirModalInscripcion(id: number): void {
    this.modalInscripcion.abrirModal(id);
  }

  onInscripcionExitosa(): void {
    this.cargarContratos();
  }

  eliminarContrato(id: number): void {
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
        this.contratoService.eliminarContrato(id).subscribe({
          next: () => {
            this.toastr.success('Contrato eliminado exitosamente', 'Éxito');
            this.cargarContratos();
          },
          error: () => {
            this.toastr.error('Error al eliminar el contrato', 'Error');
          }
        });
      }
    });
  }

  trackById(index: number, contrato: ContratoResponseDTO): number {
    return contrato.idContrato!;
  }
}