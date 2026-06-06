import { Component, OnInit, ChangeDetectorRef, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import Swal from 'sweetalert2';
import { jwtDecode } from 'jwt-decode';

import { ContratoService } from '../../services/contrato.service';
import { ProgramaService } from '../../services/programa.service';
import { LetrasCambioService } from '../../services/letracambio.service';
import { PagoLetraService } from '../../services/pagoletra.service';
import { MoraService } from '../../services/mora.service';
import { TokenService } from '../../auth/token.service';

import { Programa } from '../../models/programa.model';
import { LetraCambio } from '../../models/letra-cambio.model';
import { MoraResumenContratoDTO } from '../../dto/moraresumencontrato.dto';
import { CalculoMoraDTO } from '../../dto/calculomora.dto';
import { ContratoResponseDTO } from '../../dto/contratoreponse.dto';
import { PagoInicialResponseDTO } from '../../dto/pagoinicialresponse.dto';

import { PagoletraInsertarComponent } from '../pagoletra-insertar/pagoletra-insertar.component';
import { PagoletraMultipleInsertarComponent } from '../pagoletra-multiple-insertar/pagoletra-multiple-insertar.component';
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
    PagoletraMultipleInsertarComponent,
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
  letrasParciales: LetraCambio[] = [];

  /** Abonos (PagoLetraResponse) cargados por idLetra para la vista Parciales */
  abonosPorLetra: { [key: number]: any[] } = {};
  cargandoAbonosPorLetra: { [key: number]: boolean } = {};

  getAbonosPorLetra(idLetra: number): any[] {
    return this.abonosPorLetra[idLetra] ?? [];
  }

  tieneAbonosCargados(idLetra: number): boolean {
    return Array.isArray(this.abonosPorLetra[idLetra]);
  }
  cargandoLetras: boolean = false;

  mostrarListaPagos: boolean = false;
  idContratoParaLista: number | null = null;

  letraSeleccionada: LetraCambio | null = null;
  tipoLista: 'pendientes' | 'parciales' | 'pagadas' = 'pendientes';

  filtroNumeroLetra: string = '';

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
  calculoMoraParaPago: CalculoMoraDTO | null = null;
  moraPreviamentePagada: boolean = false;

  private ultimaLetraPagadaNum: number = 0;

  // ── MODAL BÚSQUEDA DE CONTRATO ───────────────────────────────────────────────
  @ViewChild('inputBusquedaNombre') inputBusquedaNombre!: ElementRef<HTMLInputElement>;
  @ViewChild('inputBusquedaId') inputBusquedaId!: ElementRef<HTMLInputElement>;
  mostrarModalBusqueda: boolean = false;
  terminoBusquedaModal: string = '';      // búsqueda por nombre/apellido
  idContratoModal: string = '';           // búsqueda por ID de contrato
  resultadosModal: ContratoResponseDTO[] = [];
  buscandoModal: boolean = false;
  modosBusquedaModal: 'nombre' | 'id' = 'nombre';

  // ── PAGO INICIAL ────────────────────────────────────────────────────────────
  esAdministrador: boolean = false;
  anulandoPagoInicial: boolean = false;

  constructor(
    private contratoService: ContratoService,
    private programaService: ProgramaService,
    private letrasService: LetrasCambioService,
    private pagoService: PagoLetraService,
    private moraService: MoraService,
    private toastr: ToastrService,
    private cdr: ChangeDetectorRef,
    private tokenService: TokenService,
  ) {}

  ngOnInit(): void {
    this.cargarProgramas();
    this.verificarRol();
  }

  private verificarRol(): void {
    const token = this.tokenService.getToken();
    if (!token) return;
    try {
      const decoded: { rol: string } = jwtDecode(token);
      this.esAdministrador = decoded.rol === 'ROLE_ADMINISTRADOR';
    } catch {
      this.esAdministrador = false;
    }
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
        this.letrasParciales = [];
        this.moraResumen = null;
      }
    });
  }

  cargarLetrasPendientes(idContrato: number): void {
    this.cargandoLetras = true;
    this.letrasService.listarPorContrato(idContrato).subscribe({
      next: (letras) => {
        // PARCIAL se incluye en pendientes para que no desaparezca de la lista
        this.letrasPendientes = letras
          .filter(l => l.estadoLetra === 'PENDIENTE' || l.estadoLetra === 'VENCIDO' || l.estadoLetra === 'PARCIAL')
          .map(l => ({ ...l, seleccionada: false }));
        this.letrasPagadas = letras.filter(l => l.estadoLetra === 'PAGADO');
        this.letrasParciales = letras.filter(l => l.estadoLetra === 'PARCIAL');
        this.seleccionadasMap.clear();
        this.filtroNumeroLetra = '';

        const maxPagadoNum = this.letrasPagadas.length > 0
          ? Math.max(...this.letrasPagadas.map(l => this.extraerNumeroLetra(l.numeroLetra)))
          : 0;

        let paginaDestino = 1;

        if (maxPagadoNum > 0) {
          const indiceSiguiente = this.letrasPendientes
            .findIndex(l => this.extraerNumeroLetra(l.numeroLetra) >= maxPagadoNum + 1);
          if (indiceSiguiente >= 0) {
            paginaDestino = Math.floor(indiceSiguiente / this.pageSize) + 1;
          }
        } else {
          const indiceUltimaVencida = this.letrasPendientes
            .map((l, i) => l.estadoLetra === 'VENCIDO' ? i : -1)
            .filter(i => i >= 0)
            .pop() ?? -1;
          if (indiceUltimaVencida >= 0) {
            paginaDestino = Math.floor(indiceUltimaVencida / this.pageSize) + 1;
          }
        }

        this.currentPage = paginaDestino;
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

  cargarLetrasPendientesConNavegacion(idContrato: number): void {
    this.cargandoLetras = true;
    this.letrasService.listarPorContrato(idContrato).subscribe({
      next: (letras) => {
        // PARCIAL se incluye en pendientes para que no desaparezca de la lista
        this.letrasPendientes = letras
          .filter(l => l.estadoLetra === 'PENDIENTE' || l.estadoLetra === 'VENCIDO' || l.estadoLetra === 'PARCIAL')
          .map(l => ({ ...l, seleccionada: false }));
        this.letrasPagadas = letras.filter(l => l.estadoLetra === 'PAGADO');
        this.letrasParciales = letras.filter(l => l.estadoLetra === 'PARCIAL');
        this.seleccionadasMap.clear();
        this.filtroNumeroLetra = '';

        const siguienteNum = this.ultimaLetraPagadaNum + 1;
        const indiceSiguiente = this.letrasPendientes
          .findIndex(l => this.extraerNumeroLetra(l.numeroLetra) >= siguienteNum);

        if (indiceSiguiente >= 0) {
          this.currentPage = Math.floor(indiceSiguiente / this.pageSize) + 1;
        } else {
          this.currentPage = 1;
        }

        this.ultimaLetraPagadaNum = 0;
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

  onMoraPagadaQuierePagarLetra(calculo: CalculoMoraDTO): void {
    this.mostrarMoraAlerta = false;
    this.calculoMoraParaPago = null;
    this.moraPreviamentePagada = true;
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

  iniciarFlujoPago(letra: LetraCambio): void {
    const errorOrden = this.validarLetraParaPago(letra);
    if (errorOrden) {
      this.toastr.error(errorOrden, 'Pago no permitido');
      return;
    }

    if (letra.estadoLetra === 'VENCIDO') {
      // Letra vencida → mostrar alerta de mora primero
      this.letraParaPagarConMora = letra;
      this.moraPreviamentePagada = false;
      this.mostrarMoraAlerta = true;
    } else {
      // PENDIENTE o PARCIAL → ir directo al modal de pago sin pasar por mora-alerta
      this.calculoMoraParaPago = null;
      this.moraPreviamentePagada = false;
      this.letraSeleccionada = letra;
    }
  }

  onConfirmarConMora(calculo: CalculoMoraDTO): void {
    this.mostrarMoraAlerta = false;
    this.calculoMoraParaPago = calculo;
    this.moraPreviamentePagada = false;
    this.letraSeleccionada = this.letraParaPagarConMora;
    this.letraParaPagarConMora = null;
  }

  onConfirmarSinPagarMora(calculo: CalculoMoraDTO): void {
    this.mostrarMoraAlerta = false;
    this.calculoMoraParaPago = null;
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
  const valor = this.numeroLoteBusqueda;

  // Extraer dígitos y sufijo (ej: "24B" → digits="24", sufijo="B")
  const soloDigitos = valor.replace(/[^0-9]/g, '');
  const sufijo = valor.replace(/[0-9]/g, '').toUpperCase();

  // Sin dígitos → vaciar
  if (!soloDigitos) {
    this.numeroLoteBusqueda = '';
    return;
  }

  // Aplicar la misma lógica original: máx 2 dígitos, cero a la izquierda si es 1 dígito
  const procesado = soloDigitos.length > 2 ? soloDigitos.slice(-2) : soloDigitos;
  const num = parseInt(procesado, 10);
  const numFormateado = procesado.length === 1 && num >= 1 && num <= 9
    ? '0' + num
    : procesado;

  this.numeroLoteBusqueda = numFormateado + sufijo;
}

  limpiarBusqueda(): void {
    this.programaSeleccionado = null;
    this.manzanaBusqueda = '';
    this.numeroLoteBusqueda = '';
    this.contratoEncontrado = null;
    this.letrasPendientes = [];
    this.letrasPagadas = [];
    this.letrasParciales = [];
    this.abonosPorLetra = {};
    this.cargandoAbonosPorLetra = {};
    this.seleccionadasMap.clear();
    this.moraResumen = null;
    this.calculoMoraParaPago = null;
    this.moraPreviamentePagada = false;
    this.filtroNumeroLetra = '';
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

  onPagoMultipleRegistrado(numeroComprobante: string | null): void {
    this.cerrarModalPagoMultiple();
    this.seleccionadasMap.clear();
    if (this.contratoEncontrado) {
      this.cargarLetrasPendientes(this.contratoEncontrado.idContrato);
      this.cargarResumenMora(this.contratoEncontrado.idContrato);
      this.refrescarContrato();
    }
    this.toastr.success('Pago múltiple registrado correctamente', 'Éxito');

    // Abrir el comprobante PDF automáticamente si el backend lo generó
    if (numeroComprobante) {
      this.pagoService.descargarComprobanteMultiple(numeroComprobante).subscribe({
        next: (blob) => window.open(URL.createObjectURL(blob), '_blank'),
        error: () => this.toastr.warning('El pago se registró pero no se pudo abrir el comprobante', 'Aviso')
      });
    }
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
    this.ultimaLetraPagadaNum = this.letraSeleccionada
      ? this.extraerNumeroLetra(this.letraSeleccionada.numeroLetra)
      : 0;
    this.cerrarModalPago();
    this.abonosPorLetra = {};        // invalidar caché para que Parciales recargue
    this.cargandoAbonosPorLetra = {};
    if (this.contratoEncontrado) {
      this.cargarLetrasPendientesConNavegacion(this.contratoEncontrado.idContrato);
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

  cambiarTipoLista(tipo: 'pendientes' | 'parciales' | 'pagadas'): void {
    if (this.tipoLista !== tipo) {
      this.tipoLista = tipo;
      this.filtroNumeroLetra = '';
      this.currentPage = 1;
      this.aplicarPaginacion();
      this.seleccionadasMap.clear();
      if (tipo === 'parciales') {
        this.cargarAbonosDeParciales();
      }
    }
  }

  /** Carga los abonos de cada letra PARCIAL (solo una vez por letra) */
  cargarAbonosDeParciales(): void {
    for (const letra of this.letrasParciales) {
      if (this.abonosPorLetra[letra.idLetra] !== undefined) continue; // ya cargado
      this.cargandoAbonosPorLetra[letra.idLetra] = true;
      this.pagoService.listarPorLetra(letra.idLetra).subscribe({
        next: (pagos) => {
          this.abonosPorLetra[letra.idLetra] = pagos || [];
          this.cargandoAbonosPorLetra[letra.idLetra] = false;
        },
        error: () => {
          this.abonosPorLetra[letra.idLetra] = [];
          this.cargandoAbonosPorLetra[letra.idLetra] = false;
        }
      });
    }
  }

  /** Reimprimir comprobante de un abono individual (desde la vista Parciales) */
  imprimirComprobanteAbono(abono: any): void {
    if (abono.numeroComprobante) {
      this.pagoService.descargarComprobanteMultiple(abono.numeroComprobante).subscribe({
        next: (blob) => window.open(URL.createObjectURL(blob), '_blank'),
        error: () => this.toastr.error('No se pudo generar el comprobante', 'Error')
      });
    } else {
      this.pagoService.descargarComprobante(abono.idPago).subscribe({
        next: (blob) => window.open(URL.createObjectURL(blob), '_blank'),
        error: () => this.toastr.error('No se pudo generar el comprobante', 'Error')
      });
    }
  }

  get tituloLista(): string {
    if (this.tipoLista === 'pendientes') return 'Letras Pendientes de Pago';
    if (this.tipoLista === 'parciales') return 'Letras con Pago a Cuenta (PARCIAL)';
    return 'Letras Pagadas';
  }

  // Contador de letras parciales para mostrar en la pestaña pendientes
  get cantidadParciales(): number {
    return this.letrasParciales.length;
  }

  get listaFiltrada(): LetraCambioConSeleccion[] {
    let lista: LetraCambioConSeleccion[];
    if (this.tipoLista === 'pendientes') {
      lista = this.letrasPendientes as LetraCambioConSeleccion[];
    } else if (this.tipoLista === 'parciales') {
      lista = this.letrasParciales as LetraCambioConSeleccion[];
    } else {
      lista = this.letrasPagadas as LetraCambioConSeleccion[];
    }
    const termino = this.filtroNumeroLetra.trim();
    if (!termino) return lista;

    const terminoNum = parseInt(termino, 10);
    return lista.filter(l => {
      const raw = (l.numeroLetra ?? '').split('/')[0].trim();
      const num = parseInt(raw, 10);
      if (!isNaN(terminoNum) && !isNaN(num)) {
        return num === terminoNum;
      }
      return raw.toLowerCase() === termino.toLowerCase();
    });
  }

  onFiltroChange(): void {
    this.currentPage = 1;
    this.aplicarPaginacion();
  }

  aplicarPaginacion(): void {
    const listaActual = this.listaFiltrada;
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

  getTitleBotonPagar(letra: LetraCambio): string {
    if (letra.estadoLetra === 'VENCIDO') {
      return 'Letra vencida — se calculará mora';
    }
    if (letra.estadoLetra === 'PARCIAL') {
      const simbolo = this.contratoEncontrado?.moneda === 'PEN' ? 'S/.' : '$';
      const saldo = letra.saldoPendiente != null
        ? Number(letra.saldoPendiente).toFixed(2)
        : '0.00';
      return `Completar pago — saldo pendiente: ${simbolo} ${saldo}`;
    }
    return 'Registrar pago';
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

  // ── MODAL BÚSQUEDA ALTERNATIVA DE CONTRATOS ──────────────────────────────────

  /** Abre el modal y resetea su estado */
  abrirModalBusqueda(): void {
    this.mostrarModalBusqueda = true;
    this.terminoBusquedaModal = '';
    this.idContratoModal = '';
    this.resultadosModal = [];
    this.buscandoModal = false;
    this.modosBusquedaModal = 'nombre';
    setTimeout(() => this.inputBusquedaNombre?.nativeElement?.focus(), 50);
  }

  /** Cambia el modo de búsqueda y enfoca el input correspondiente */
  cambiarModoBusqueda(modo: 'nombre' | 'id'): void {
    this.modosBusquedaModal = modo;
    this.resultadosModal = [];
    setTimeout(() => {
      const input = modo === 'nombre' ? this.inputBusquedaNombre : this.inputBusquedaId;
      input?.nativeElement?.focus();
    }, 50);
  }

  /** Cierra el modal */
  cerrarModalBusqueda(): void {
    this.mostrarModalBusqueda = false;
    this.terminoBusquedaModal = '';
    this.idContratoModal = '';
    this.resultadosModal = [];
  }

  /** Ejecuta la búsqueda según el modo activo (nombre o ID) */
  buscarEnModal(): void {
    if (this.modosBusquedaModal === 'nombre') {
      const termino = this.terminoBusquedaModal.trim();
      if (!termino || termino.length < 2) {
        this.toastr.warning('Ingrese al menos 2 caracteres para buscar', 'Atención');
        return;
      }
      this.buscandoModal = true;
      this.resultadosModal = [];
      this.contratoService.buscarPorNombreCliente(termino).subscribe({
        next: (contratos) => {
          this.resultadosModal = contratos;
          this.buscandoModal = false;
          if (contratos.length === 0) {
            this.toastr.info('No se encontraron contratos con ese nombre', 'Sin resultados');
          }
        },
        error: () => {
          this.toastr.error('Error al buscar contratos', 'Error');
          this.buscandoModal = false;
        }
      });
    } else {
      const id = parseInt(this.idContratoModal.trim(), 10);
      if (!id || isNaN(id)) {
        this.toastr.warning('Ingrese un ID de contrato válido', 'Atención');
        return;
      }
      this.buscandoModal = true;
      this.resultadosModal = [];
      this.contratoService.obtenerContratoPorId(id).subscribe({
        next: (contrato) => {
          this.resultadosModal = contrato ? [contrato] : [];
          this.buscandoModal = false;
          if (!contrato) {
            this.toastr.info('No se encontró ningún contrato con ese ID', 'Sin resultados');
          }
        },
        error: () => {
          this.toastr.info('No se encontró ningún contrato con ese ID', 'Sin resultados');
          this.buscandoModal = false;
        }
      });
    }
  }

  /** Selecciona un contrato del modal, rellena los campos del formulario y ejecuta la búsqueda */
  seleccionarContratoDesdeModal(contrato: ContratoResponseDTO): void {
    const lote = contrato.lotes?.[0];
    if (!lote) {
      this.toastr.warning('El contrato no tiene lote asociado', 'Aviso');
      return;
    }

    // Buscar el programa por nombre en la lista cargada
    const programa = this.programas.find(p => p.nombrePrograma === lote.nombrePrograma);
    if (!programa || !programa.idPrograma) {
      this.toastr.warning('No se pudo identificar el programa del contrato', 'Aviso');
      return;
    }

    // Rellenar los campos del formulario principal
    this.programaSeleccionado = programa.idPrograma;
    this.manzanaBusqueda = lote.manzana;
    this.numeroLoteBusqueda = lote.numeroLote;

    // Cerrar modal y ejecutar búsqueda automáticamente
    this.cerrarModalBusqueda();
    this.buscarContrato();
  }

  /** Devuelve el nombre completo del cliente principal del contrato */
  getNombreCliente(contrato: ContratoResponseDTO): string {
    if (!contrato.clientes || contrato.clientes.length === 0) return '—';
    const c = contrato.clientes[0];
    return `${c.nombre} ${c.apellidos}`;
  }

  /** Devuelve área del lote del contrato */
  getAreaLote(contrato: ContratoResponseDTO): string {
    const lote = contrato.lotes?.[0];
    return lote?.area != null ? `${lote.area} m²` : '—';
  }

  /** Permite buscar con Enter en los inputs del modal */
  onKeyEnterModal(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      this.buscarEnModal();
    }
  }

  // ── ANULACIÓN DE PAGO INICIAL ────────────────────────────────────────────────

  anularPagoInicial(): void {
    const idContrato = this.contratoEncontrado?.idContrato;
    const pagoInicial: PagoInicialResponseDTO | undefined = this.contratoEncontrado?.pagoInicial;

    if (!idContrato || !pagoInicial) return;

    Swal.fire({
      title: '¿Anular pago inicial?',
      html: `
        <p style="margin-bottom:12px">Esta acción es <strong>irreversible</strong>. El pago quedará marcado como anulado.</p>
        <textarea id="motivo-anulacion-inicial" class="swal2-textarea"
          placeholder="Motivo de anulación (obligatorio)..."
          rows="3" style="width:100%;resize:vertical"></textarea>`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, anular',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#dc3545',
      preConfirm: () => {
        const motivo = (document.getElementById('motivo-anulacion-inicial') as HTMLTextAreaElement)?.value?.trim();
        if (!motivo) {
          Swal.showValidationMessage('El motivo es obligatorio');
          return false;
        }
        return motivo;
      }
    }).then(result => {
      if (!result.isConfirmed || !result.value) return;
      this.anulandoPagoInicial = true;
      this.contratoService.anularPagoInicial(idContrato, result.value).subscribe({
        next: (pagoAnulado) => {
          this.anulandoPagoInicial = false;
          // Actualizar el pagoInicial en el contrato local sin recargar todo
          this.contratoEncontrado = {
            ...this.contratoEncontrado,
            pagoInicial: pagoAnulado
          };
          this.toastr.success('Pago inicial anulado correctamente', 'Éxito');
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.anulandoPagoInicial = false;
          const msg = err?.error?.message || 'No se pudo anular el pago inicial';
          this.toastr.error(msg, 'Error');
        }
      });
    });
  }
}