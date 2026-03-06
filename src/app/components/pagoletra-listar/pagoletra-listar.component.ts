import { Component, OnInit, ViewChild, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ToastrService } from 'ngx-toastr';

import { ContratoService } from '../../services/contrato.service';
import { ProgramaService } from '../../services/programa.service';
import { LetrasCambioService } from '../../services/letracambio.service';
import { PagoLetraService } from '../../services/pagoletra.service';
import { Programa } from '../../models/programa.model';
import { LetraCambio } from '../../models/letra-cambio.model';
import { PagoletraInsertarComponent } from '../pagoletra-insertar/pagoletra-insertar.component';

@Component({
  selector: 'app-pago-letra',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    PagoletraInsertarComponent
  ],
  templateUrl: './pagoletra-listar.html',
  styleUrls: ['./pagoletra-listar.scss'],
})
export class PagoletraListarComponent implements OnInit {
  // Para búsqueda de contrato
  programas: Programa[] = [];
  programaSeleccionado: number | null = null;
  manzanaBusqueda: string = '';
  numeroLoteBusqueda: string = '';

  contratoEncontrado: any = null;
  letrasPendientes: LetraCambio[] = [];
  letrasPagadas: LetraCambio[] = [];
  cargandoLetras: boolean = false;

  // Control del modal de pago
  mostrarModalPago: boolean = false;
  letraSeleccionada: LetraCambio | null = null;

  // Tipo de lista a mostrar
  tipoLista: 'pendientes' | 'pagadas' = 'pendientes';

  // Paginación
  pageSize: number = 5;
  currentPage: number = 1;
  totalPages: number = 0;
  paginatedLetras: LetraCambio[] = [];

  constructor(
    private contratoService: ContratoService,
    private programaService: ProgramaService,
    private letrasService: LetrasCambioService,
    private pagoService: PagoLetraService,
    private toastr: ToastrService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.cargarProgramas();
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

  buscarContrato(): void {
    if (!this.programaSeleccionado || !this.manzanaBusqueda.trim() || !this.numeroLoteBusqueda.trim()) {
      this.toastr.warning('Debe seleccionar programa, manzana y número de lote', 'Atención');
      return;
    }

    this.contratoService.buscarPorProgramaManzanaLote(
      this.programaSeleccionado,
      this.manzanaBusqueda.trim().toUpperCase(),
      this.numeroLoteBusqueda.trim().toUpperCase()
    ).subscribe({
      next: (contrato) => {
        this.contratoEncontrado = contrato;
        this.cargarLetrasPendientes(contrato.idContrato);
      },
      error: (err) => {
        console.error('Error al buscar contrato:', err);
        this.toastr.error('No se encontró ningún contrato para esos datos', 'Error');
        this.contratoEncontrado = null;
        this.letrasPendientes = [];
        this.letrasPagadas = [];
      }
    });
  }

  cargarLetrasPendientes(idContrato: number): void {
    this.cargandoLetras = true;
    this.letrasService.listarPorContrato(idContrato).subscribe({
      next: (letras) => {
        this.letrasPendientes = letras.filter(l => l.estadoLetra === 'PENDIENTE' || l.estadoLetra === 'VENCIDO');
        this.letrasPagadas = letras.filter(l => l.estadoLetra === 'PAGADO');
        this.currentPage = 1;
        this.aplicarPaginacion();
        this.cargandoLetras = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error al cargar letras:', err);
        this.toastr.error('Error al cargar las letras', 'Error');
        this.cargandoLetras = false;
      }
    });
  }

  formatearNumeroLote(): void {
    const soloNumeros = this.numeroLoteBusqueda.replace(/\D/g, '');
    const procesado = soloNumeros.length > 2 ? soloNumeros.slice(-2) : soloNumeros;
    if (procesado.length === 1) {
      const num = parseInt(procesado, 10);
      if (num >= 1 && num <= 9) {
        this.numeroLoteBusqueda = '0' + num;
      } else {
        this.numeroLoteBusqueda = procesado;
      }
    } else {
      this.numeroLoteBusqueda = procesado;
    }
  }

  limpiarBusqueda(): void {
    this.programaSeleccionado = null;
    this.manzanaBusqueda = '';
    this.numeroLoteBusqueda = '';
    this.contratoEncontrado = null;
    this.letrasPendientes = [];
    this.letrasPagadas = [];
  }

  abrirModalPago(letra: LetraCambio): void {
    this.letraSeleccionada = letra;
    this.mostrarModalPago = true;
  }

  cerrarModalPago(): void {
    this.mostrarModalPago = false;
    this.letraSeleccionada = null;
  }

  onPagoRegistrado(): void {
    this.cerrarModalPago();
    if (this.contratoEncontrado) {
      this.cargarLetrasPendientes(this.contratoEncontrado.idContrato);
    }
    this.toastr.success('Pago registrado correctamente', 'Éxito');
  }

  isLetraVencida(fechaVencimiento: string): boolean {
    const hoy = new Date();
    const fechaVen = new Date(fechaVencimiento);
    return fechaVen < hoy;
  }

  // ========== CAMBIO DE LISTA ==========
  cambiarTipoLista(tipo: 'pendientes' | 'pagadas'): void {
    if (this.tipoLista !== tipo) {
      this.tipoLista = tipo;
      this.currentPage = 1;
      this.aplicarPaginacion();
    }
  }

  get tituloLista(): string {
    return this.tipoLista === 'pendientes' ? 'Letras Pendientes de Pago' : 'Letras Pagadas';
  }

  // ========== PAGINACIÓN ==========
  aplicarPaginacion(): void {
    const listaActual = this.tipoLista === 'pendientes' ? this.letrasPendientes : this.letrasPagadas;
    this.totalPages = Math.ceil(listaActual.length / this.pageSize);
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    this.paginatedLetras = listaActual.slice(start, end);
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.aplicarPaginacion();
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.aplicarPaginacion();
    }
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.aplicarPaginacion();
    }
  }

  getPagesArray(): (number | string)[] {
    const total = this.totalPages;
    const current = this.currentPage;
    const pages: (number | string)[] = [];

    if (total <= 7) {
      for (let i = 1; i <= total; i++) pages.push(i);
    } else {
      pages.push(1);
      if (current > 3) pages.push('...');
      let start = Math.max(2, current - 1);
      let end = Math.min(total - 1, current + 1);
      if (current <= 3) end = 4;
      if (current >= total - 2) start = total - 3;
      for (let i = start; i <= end; i++) pages.push(i);
      if (current < total - 2) pages.push('...');
      pages.push(total);
    }
    return pages;
  }
}