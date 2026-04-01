import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ToastrService } from 'ngx-toastr';

import { ContratoService } from '../../services/contrato.service';
import { ProgramaService } from '../../services/programa.service';
import { LetrasCambioService } from '../../services/letracambio.service';
import { PagoLetraService } from '../../services/pagoletra.service';
import { MoraService } from '../../services/mora.service';

import { Programa } from '../../models/programa.model';
import { LetraCambio } from '../../models/letra-cambio.model';
import { MoraResumenContratoDTO } from '../../dto/moraresumencontrato.dto';
import { CalculoMoraDTO } from '../../dto/calculomora.dto';

import { PagoletraInsertarComponent } from '../pagoletra-insertar/pagoletra-insertar.component';
import { PagoLetraMultipleInsertarComponent } from '../pagoletra-multiple-insertar/pagoletra-multiple-insertar.component';
import { PagoListaModalComponent } from '../pago-lista-modal/pago-lista-modal.component';
import { MoraListarComponent } from '../mora-listar/mora-listar.component';
import { MoraAlertaComponent } from '../mora-alerta/mora-alerta.component';

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
    PagoListaModalComponent,
    MoraListarComponent,
    MoraAlertaComponent,
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

  // ── MORA ────────────────────────────────────────────────────────────────────
  moraResumen: MoraResumenContratoDTO | null = null;
  mostrarMoraListar: boolean = false;
  mostrarMoraAlerta: boolean = false;
  letraParaPagarConMora: LetraCambio | null = null;
  /** Cálculo de mora a pasar al modal de pago (solo cuando elige pagar mora ahora) */
  calculoMoraParaPago: CalculoMoraDTO | null = null;

  /**
   * NUEVO: indica al modal de pago de letra que la mora ya fue cobrada
   * en el paso anterior (desde mora-alerta → Pagar Mora).
   * Cuando es true, el modal de pago NO mostrará el aviso de mora
   * ni intentará crear/registrar la mora nuevamente.
   */
  moraPreviamentePagada: boolean = false;

  constructor(
    private contratoService: ContratoService,
    private programaService: ProgramaService,
    private letrasService: LetrasCambioService,
    private pagoService: PagoLetraService,
    private moraService: MoraService,
    private toastr: ToastrService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.cargarProgramas();
  }

  cargarProgramas(): void {
    this.programaService.listarProgramas().subscribe({
      next: (data) => { this.programas = data; },
      error: () => { this.toastr.warning('No se pudieron cargar los programas', 'Aviso'); }
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
        this.cargarResumenMora(contrato.idContrato);
      },
      error: () => {
        this.toastr.error('No se encontró ningún contrato para esos datos', 'Error');
        this.contratoEncontrado = null;
        this.letrasPendientes = [];
        this.letrasPagadas = [];
        this.moraResumen = null;
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
      error: () => {
        this.toastr.error('Error al cargar las letras', 'Error');
        this.cargandoLetras = false;
      }
    });
  }

  // ── MORA ────────────────────────────────────────────────────────────────────

  cargarResumenMora(idContrato: number): void {
    this.moraService.obtenerResumenPorContrato(idContrato).subscribe({
      next: (resumen) => { this.moraResumen = resumen; },
      error: () => { this.moraResumen = null; }
    });
  }

  abrirMoraListar(): void {
    this.mostrarMoraListar = true;
  }

  cerrarMoraListar(): void {
    this.mostrarMoraListar = false;
    if (this.contratoEncontrado) {
      this.cargarResumenMora(this.contratoEncontrado.idContrato);
    }
  }

  /**
   * CORRECCIÓN PRINCIPAL — Flujo: Pagar Mora → Pagar Letra
   *
   * El operador pagó la mora desde mora-alerta y luego quiere cobrar la letra.
   * En este caso:
   *   - calculoMoraParaPago = NULL  (la mora ya fue pagada, no hay nada pendiente)
   *   - moraPreviamentePagada = TRUE (le avisamos al modal de pago que no cree otra mora)
   *
   * Así, cuando el modal de pagoletra-insertar registre el pago de la letra,
   * el backend puede crear la mora en PENDIENTE (comportamiento normal del backend)
   * PERO el frontend NO intentará registrar un segundo pago de mora,
   * porque moraPreviamentePagada = true bloquea ese camino.
   */
  onMoraPagadaQuierePagarLetra(calculo: CalculoMoraDTO): void {
    this.mostrarMoraAlerta = false;
    this.calculoMoraParaPago = null;      // mora ya pagada → no mostrar bloque de mora en el modal
    this.moraPreviamentePagada = true;    // ← NUEVO: le dice al modal que NO registre mora de nuevo
    this.letraSeleccionada = this.letraParaPagarConMora;
    this.letraParaPagarConMora = null;
    if (this.contratoEncontrado) {
      this.cargarResumenMora(this.contratoEncontrado.idContrato);
    }
  }

  onMoraPagadaSinLetra(): void {
    this.mostrarMoraAlerta = false;
    this.letraParaPagarConMora = null;
    this.calculoMoraParaPago = null;
    this.moraPreviamentePagada = false;
    if (this.contratoEncontrado) {
      this.cargarResumenMora(this.contratoEncontrado.idContrato);
    }
  }

  /** El operador hizo clic en "Pagar" sobre una letra VENCIDA → mostrar alerta de mora */
  iniciarFlujoPago(letra: LetraCambio): void {
    const errorOrden = this.validarLetraParaPago(letra);
    if (errorOrden) {
      this.toastr.error(errorOrden, 'Pago no permitido');
      return;
    }

    if (letra.estadoLetra === 'VENCIDO') {
      this.letraParaPagarConMora = letra;
      this.moraPreviamentePagada = false; // resetear al iniciar flujo nuevo
      this.mostrarMoraAlerta = true;
    } else {
      this.calculoMoraParaPago = null;
      this.moraPreviamentePagada = false;
      this.letraSeleccionada = letra;
    }
  }

  /** Operador eligió "Pagar letra + mora ahora" (desde el checkbox dentro del modal de pago) */
  onConfirmarConMora(calculo: CalculoMoraDTO): void {
    this.mostrarMoraAlerta = false;
    this.calculoMoraParaPago = calculo;           // ← se pasa al modal de pago
    this.moraPreviamentePagada = false;
    this.letraSeleccionada = this.letraParaPagarConMora;
    this.letraParaPagarConMora = null;
  }

  /** Operador eligió "Pagar solo la letra" → mora queda PENDIENTE en el backend */
  onConfirmarSinPagarMora(calculo: CalculoMoraDTO): void {
    this.mostrarMoraAlerta = false;
    this.calculoMoraParaPago = null;              // sin mora — el backend la crea como PENDIENTE
    this.moraPreviamentePagada = false;
    this.letraSeleccionada = this.letraParaPagarConMora;
    this.letraParaPagarConMora = null;
  }

  onCancelarMoraAlerta(): void {
    this.mostrarMoraAlerta = false;
    this.letraParaPagarConMora = null;
    this.calculoMoraParaPago = null;
    this.moraPreviamentePagada = false;
  }

  // ── MÉTODOS EXISTENTES ───────────────────────────────────────────────────────

  formatearNumeroLote(): void {
    const soloNumeros = this.numeroLoteBusqueda.replace(/\D/g, '');
    const procesado = soloNumeros.length > 2 ? soloNumeros.slice(-2) : soloNumeros;
    if (procesado.length === 1) {
      const num = parseInt(procesado, 10);
      this.numeroLoteBusqueda = (num >= 1 && num <= 9) ? '0' + num : procesado;
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
    this.moraResumen = null;
    this.calculoMoraParaPago = null;
    this.moraPreviamentePagada = false;
  }

  private extraerNumeroLetra(numeroLetra: string): number {
    if (!numeroLetra) return 0;
    const parte = numeroLetra.includes('/') ? numeroLetra.split('/')[0] : numeroLetra;
    return parseInt(parte.trim(), 10) || 0;
  }

  private maxNumeroLetraPagado(): number {
    if (!this.letrasPagadas || this.letrasPagadas.length === 0) return 0;
    return Math.max(...this.letrasPagadas.map(l => this.extraerNumeroLetra(l.numeroLetra)));
  }

  private validarLetraParaPago(letra: LetraCambio): string | null {
    const numLetra = this.extraerNumeroLetra(letra.numeroLetra);
    const maxPagado = this.maxNumeroLetraPagado();
    if (maxPagado === 0) return null;
    if (numLetra > maxPagado + 1) {
      return `No puede pagar la letra N° ${numLetra} porque el siguiente pago debe ser ` +
             `la letra N° ${maxPagado + 1}. Solo puede pagar letras anteriores o la N° ${maxPagado + 1}.`;
    }
    return null;
  }

  private validarLetrasMultipleParaPago(letras: LetraCambio[]): string | null {
    const maxPagado = this.maxNumeroLetraPagado();
    if (maxPagado === 0) return null;
    const numeros = letras.map(l => this.extraerNumeroLetra(l.numeroLetra)).sort((a, b) => a - b);
    if (numeros[0] > maxPagado + 1) {
      return `La selección no puede comenzar en la letra N° ${numeros[0]}. El siguiente pago permitido es la letra N° ${maxPagado + 1}.`;
    }
    return null;
  }

  toggleSeleccion(letra: LetraCambioConSeleccion): void {
    if (this.seleccionadasMap.has(letra.idLetra)) {
      this.seleccionadasMap.delete(letra.idLetra);
    } else {
      this.seleccionadasMap.add(letra.idLetra);
    }
    letra.seleccionada = this.seleccionadasMap.has(letra.idLetra);
    this.cdr.markForCheck();
  }

  seleccionarTodas(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    this.paginatedLetras.forEach(l => {
      if (checked) this.seleccionadasMap.add(l.idLetra);
      else this.seleccionadasMap.delete(l.idLetra);
      l.seleccionada = checked;
    });
    this.cdr.markForCheck();
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
    const letrasElegidas = this.letrasPendientes.filter(l => this.seleccionadasMap.has(l.idLetra));
    const errorOrden = this.validarLetrasMultipleParaPago(letrasElegidas);
    if (errorOrden) {
      this.toastr.error(errorOrden, 'Pago no permitido');
      return;
    }
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
      this.cargarResumenMora(this.contratoEncontrado.idContrato);
      this.refrescarContrato();
    }
    this.toastr.success('Pago múltiple registrado correctamente', 'Éxito');
  }

  abrirModalPago(letra: LetraCambio): void {
    this.iniciarFlujoPago(letra);
  }

  cerrarModalPago(): void {
    this.letraSeleccionada = null;
    this.calculoMoraParaPago = null;
    this.moraPreviamentePagada = false;
  }

  onPagoRegistrado(): void {
    this.cerrarModalPago();
    if (this.contratoEncontrado) {
      this.cargarLetrasPendientes(this.contratoEncontrado.idContrato);
      this.cargarResumenMora(this.contratoEncontrado.idContrato);
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
      next: (contrato) => { if (contrato) this.contratoEncontrado = contrato; },
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
    const listaActual = this.tipoLista === 'pendientes' ? this.letrasPendientes : this.letrasPagadas;
    this.totalPages = Math.ceil(listaActual.length / this.pageSize);
    const start = (this.currentPage - 1) * this.pageSize;
    this.paginatedLetras = listaActual.slice(start, start + this.pageSize) as LetraCambioConSeleccion[];
  }

  previousPage(): void { if (this.currentPage > 1) { this.currentPage--; this.aplicarPaginacion(); } }
  nextPage(): void { if (this.currentPage < this.totalPages) { this.currentPage++; this.aplicarPaginacion(); } }
  goToPage(page: number): void { if (page >= 1 && page <= this.totalPages) { this.currentPage = page; this.aplicarPaginacion(); } }

  getPagesArray(): (number | string)[] {
    const total = this.totalPages, current = this.currentPage;
    const pages: (number | string)[] = [];
    if (total <= 7) { for (let i = 1; i <= total; i++) pages.push(i); }
    else {
      pages.push(1);
      if (current > 3) pages.push('...');
      let start = Math.max(2, current - 1), end = Math.min(total - 1, current + 1);
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
        if (pago.numeroComprobante) {
          this.pagoService.descargarComprobanteMultiple(pago.numeroComprobante).subscribe({
            next: (blob) => window.open(URL.createObjectURL(blob), '_blank'),
            error: () => this.toastr.error('No se pudo generar el comprobante', 'Error')
          });
        } else {
          this.pagoService.descargarComprobante(pago.idPago).subscribe({
            next: (blob) => window.open(URL.createObjectURL(blob), '_blank'),
            error: () => this.toastr.error('No se pudo generar el comprobante', 'Error')
          });
        }
      },
      error: () => this.toastr.error('Error al buscar el pago de la letra', 'Error')
    });
  }
}