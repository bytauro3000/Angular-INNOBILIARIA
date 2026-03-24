import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
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
import { PagoLetraMultipleInsertarComponent } from '../pagoletra-multiple-insertar/pagoletra-multiple-insertar.component';
import { PagoListaModalComponent } from '../pago-lista-modal/pago-lista-modal.component';

interface LetraCambioConSeleccion extends LetraCambio {
  seleccionada?: boolean;
}

@Component({
  selector: 'app-pago-letra',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    PagoletraInsertarComponent,
    PagoLetraMultipleInsertarComponent,
    PagoListaModalComponent
  ],
  templateUrl: './pagoletra-listar.html',
  styleUrls: ['./pagoletra-listar.scss'],
})
export class PagoletraListarComponent implements OnInit {

  programas: Programa[] = [];
  programaSeleccionado: number | null = null;
  manzanaBusqueda: string = '';
  numeroLoteBusqueda: string = '';

  contratoEncontrado: any = null;
  letrasPendientes: LetraCambioConSeleccion[] = [];
  letrasPagadas: LetraCambio[] = [];
  cargandoLetras: boolean = false;

  mostrarListaPagos: boolean = false;
  idContratoParaLista: number | null = null;

  letraSeleccionada: LetraCambio | null = null;
  tipoLista: 'pendientes' | 'pagadas' = 'pendientes';

  pageSize: number = 5;
  currentPage: number = 1;
  totalPages: number = 0;
  paginatedLetras: LetraCambioConSeleccion[] = [];

  // Selección persistente
  seleccionadasMap: Set<number> = new Set();
  modoPagoMultiple: boolean = false;
  letrasSeleccionadasTemp: LetraCambio[] = [];

  constructor(
    private contratoService: ContratoService,
    private programaService: ProgramaService,
    private letrasService: LetrasCambioService,
    private pagoService: PagoLetraService,
    private toastr: ToastrService,
    private cdr: ChangeDetectorRef,
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
        this.letrasPendientes = letras
          .filter(l => l.estadoLetra === 'PENDIENTE' || l.estadoLetra === 'VENCIDO')
          .map(l => ({ ...l, seleccionada: false }));
        this.letrasPagadas = letras.filter(l => l.estadoLetra === 'PAGADO');

        this.seleccionadasMap.clear();
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
    this.seleccionadasMap.clear();
  }

  // ── UTILIDAD: extrae el número de letra de "N/Total" o "N" ─────────────────
  private extraerNumeroLetra(numeroLetra: string): number {
    if (!numeroLetra) return 0;
    const parte = numeroLetra.includes('/') ? numeroLetra.split('/')[0] : numeroLetra;
    return parseInt(parte.trim(), 10) || 0;
  }

  /**
   * Calcula el máximo número de letra YA pagado para el contrato actual.
   * Usa letrasPagadas (ya disponibles en memoria) para evitar una llamada HTTP extra.
   * Retorna 0 si no hay ningún pago previo.
   */
  private maxNumeroLetraPagado(): number {
    if (!this.letrasPagadas || this.letrasPagadas.length === 0) return 0;
    return Math.max(...this.letrasPagadas.map(l => this.extraerNumeroLetra(l.numeroLetra)));
  }

  /**
   * Valida si una letra individual puede pagarse dado el historial actual.
   * Retorna null si es válida, o un mensaje de error si no lo es.
   */
  private validarLetraParaPago(letra: LetraCambio): string | null {
    const numLetra = this.extraerNumeroLetra(letra.numeroLetra);
    const maxPagado = this.maxNumeroLetraPagado();

    // Si no hay pagos previos, cualquier letra es válida
    if (maxPagado === 0) return null;

    // Si la letra está por delante del consecutivo permitido → bloquear
    if (numLetra > maxPagado + 1) {
      return `No puede pagar la letra N° ${numLetra} porque el siguiente pago debe ser ` +
             `la letra N° ${maxPagado + 1}. Solo puede pagar letras anteriores o la N° ${maxPagado + 1}.`;
    }

    return null; // OK
  }

  /**
   * Valida si un grupo de letras seleccionadas puede pagarse en conjunto.
   * Retorna null si es válido, o un mensaje de error si no lo es.
   */
  private validarLetrasMultipleParaPago(letras: LetraCambio[]): string | null {
    if (!letras || letras.length === 0) return null;

    const nums = letras.map(l => this.extraerNumeroLetra(l.numeroLetra)).sort((a, b) => a - b);
    const maxPagado = this.maxNumeroLetraPagado();

    // El primero de la selección no puede saltarse el consecutivo
    if (maxPagado > 0 && nums[0] > maxPagado + 1) {
      return `No puede pagar la letra N° ${nums[0]} porque el siguiente pago debe ser ` +
             `la letra N° ${maxPagado + 1}. Ajuste su selección.`;
    }

    // Las letras seleccionadas deben ser consecutivas entre sí
    for (let i = 1; i < nums.length; i++) {
      if (nums[i] !== nums[i - 1] + 1) {
        return `Las letras seleccionadas no son consecutivas: tiene la N° ${nums[i - 1]} ` +
               `y la N° ${nums[i]}, pero falta la N° ${nums[i - 1] + 1} entre ellas.`;
      }
    }

    return null; // OK
  }

  // ── SELECCIÓN MÚLTIPLE ────────────────────────────────────────────────────

  seleccionarTodas(event: any): void {
    const checked = event.target.checked;
    if (checked) {
      this.paginatedLetras.forEach(letra => this.seleccionadasMap.add(letra.idLetra));
    } else {
      this.paginatedLetras.forEach(letra => this.seleccionadasMap.delete(letra.idLetra));
    }
  }

  toggleSeleccion(letra: LetraCambioConSeleccion): void {
    if (this.seleccionadasMap.has(letra.idLetra)) {
      this.seleccionadasMap.delete(letra.idLetra);
    } else {
      this.seleccionadasMap.add(letra.idLetra);
    }
  }

  isSeleccionada(idLetra: number): boolean {
    return this.seleccionadasMap.has(idLetra);
  }

  isTodasSeleccionadas(): boolean {
    return this.paginatedLetras.length > 0 &&
           this.paginatedLetras.every(l => this.isSeleccionada(l.idLetra));
  }

  get cantidadSeleccionadas(): number {
    return this.seleccionadasMap.size;
  }

  abrirModalPagoMultiple(): void {
    if (this.cantidadSeleccionadas === 0) {
      this.toastr.warning('Seleccione al menos una letra', 'Atención');
      return;
    }

    const letrasElegidas = this.letrasPendientes
      .filter(l => this.seleccionadasMap.has(l.idLetra));

    // ── VALIDACIÓN DE ORDEN ────────────────────────────────────────────────
    const errorOrden = this.validarLetrasMultipleParaPago(letrasElegidas);
    if (errorOrden) {
      this.toastr.error(errorOrden, 'Pago no permitido');
      return;
    }
    // ──────────────────────────────────────────────────────────────────────

    this.letrasSeleccionadasTemp = letrasElegidas;
    this.modoPagoMultiple = true;
  }

  abrirListaPagos(): void {
    if (this.contratoEncontrado) {
      this.idContratoParaLista = this.contratoEncontrado.idContrato;
      this.mostrarListaPagos = true;
    }
  }

  cerrarListaPagos(): void {
    this.mostrarListaPagos = false;
    this.idContratoParaLista = null;
  }

  onPagoEliminado(): void {
    if (this.contratoEncontrado) {
      this.cargarLetrasPendientes(this.contratoEncontrado.idContrato);
      this.refrescarContrato();
    }
  }

  cerrarModalPagoMultiple(): void {
    this.modoPagoMultiple = false;
    this.letrasSeleccionadasTemp = [];
  }

  onPagoMultipleRegistrado(): void {
    this.cerrarModalPagoMultiple();
    this.seleccionadasMap.clear();
    if (this.contratoEncontrado) {
      this.cargarLetrasPendientes(this.contratoEncontrado.idContrato);
      this.refrescarContrato();
    }
    this.toastr.success('Pago múltiple registrado correctamente', 'Éxito');
  }

  abrirModalPago(letra: LetraCambio): void {
    // ── VALIDACIÓN DE ORDEN ────────────────────────────────────────────────
    const errorOrden = this.validarLetraParaPago(letra);
    if (errorOrden) {
      this.toastr.error(errorOrden, 'Pago no permitido');
      return;
    }
    // ──────────────────────────────────────────────────────────────────────

    this.letraSeleccionada = letra;
  }

  cerrarModalPago(): void {
    this.letraSeleccionada = null;
  }

  onPagoRegistrado(): void {
    this.cerrarModalPago();
    if (this.contratoEncontrado) {
      this.cargarLetrasPendientes(this.contratoEncontrado.idContrato);
      this.refrescarContrato();
    }
  }

  refrescarContrato(): void {
    if (!this.programaSeleccionado || !this.manzanaBusqueda.trim() || !this.numeroLoteBusqueda.trim()) return;
    this.contratoService.buscarPorProgramaManzanaLote(
      this.programaSeleccionado,
      this.manzanaBusqueda.trim(),
      this.numeroLoteBusqueda.trim()
    ).subscribe({
      next: (contrato) => {
        if (contrato) this.contratoEncontrado = contrato;
      },
      error: (err) => console.error('Error al refrescar contrato:', err)
    });
  }

  cambiarTipoLista(tipo: 'pendientes' | 'pagadas'): void {
    if (this.tipoLista !== tipo) {
      this.tipoLista = tipo;
      this.currentPage = 1;
      this.aplicarPaginacion();
      this.seleccionadasMap.clear();
    }
  }

  get tituloLista(): string {
    return this.tipoLista === 'pendientes' ? 'Letras Pendientes de Pago' : 'Letras Pagadas';
  }

  aplicarPaginacion(): void {
    const listaActual = this.tipoLista === 'pendientes'
      ? this.letrasPendientes
      : this.letrasPagadas;
    this.totalPages = Math.ceil(listaActual.length / this.pageSize);
    const start = (this.currentPage - 1) * this.pageSize;
    const end   = start + this.pageSize;
    this.paginatedLetras = listaActual.slice(start, end) as LetraCambioConSeleccion[];
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
    const total   = this.totalPages;
    const current = this.currentPage;
    const pages: (number | string)[] = [];

    if (total <= 7) {
      for (let i = 1; i <= total; i++) pages.push(i);
    } else {
      pages.push(1);
      if (current > 3) pages.push('...');
      let start = Math.max(2, current - 1);
      let end   = Math.min(total - 1, current + 1);
      if (current <= 3) end = 4;
      if (current >= total - 2) start = total - 3;
      for (let i = start; i <= end; i++) pages.push(i);
      if (current < total - 2) pages.push('...');
      pages.push(total);
    }
    return pages;
  }

  imprimirComprobante(idLetra: number): void {
    this.pagoService.listarPorLetra(idLetra).subscribe({
      next: (pagos) => {
        if (!pagos || pagos.length === 0) {
          this.toastr.warning('No se encontró el pago de esta letra', 'Aviso');
          return;
        }
        const pago = pagos[0];
        const numeroComprobante = pago.numeroComprobante;

        if (numeroComprobante) {
          this.pagoService.descargarComprobanteMultiple(numeroComprobante).subscribe({
            next: (blob) => {
              const url = URL.createObjectURL(blob);
              window.open(url, '_blank');
            },
            error: () => this.toastr.error('No se pudo generar el comprobante', 'Error')
          });
        } else {
          this.pagoService.descargarComprobante(pago.idPago).subscribe({
            next: (blob) => {
              const url = URL.createObjectURL(blob);
              window.open(url, '_blank');
            },
            error: () => this.toastr.error('No se pudo generar el comprobante', 'Error')
          });
        }
      },
      error: () => this.toastr.error('Error al buscar el pago de la letra', 'Error')
    });
  }
}