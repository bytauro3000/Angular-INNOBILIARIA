import { Component, OnInit, AfterViewInit, ViewChild, ElementRef, HostListener, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InscripcionService } from '../../services/inscripcion.service';
import { InscripcionResumenDTO } from '../../dto/InscripcionResumen.dto';
import { PendienteInscripcionDTO } from '../../dto/PendienteInscripcion.dto';
import { InscripcionServicioDTO } from '../../dto/InscripcionServicio.dto';
import { EstadoInscripcion } from '../../enums/estadoinscripcion.enum';
import { TipoServicios } from '../../enums/tiposervicio';
import { InscripcionServiciosInsertarComponent } from '../inscripcion-servicios-insertar/inscripcion-servicios-insertar.component';
import { ToastrService } from 'ngx-toastr';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-inscripcion-listar',
  standalone: true,
  imports: [CommonModule, FormsModule, InscripcionServiciosInsertarComponent],
  templateUrl: './inscripcion-listar.html',
  styleUrls: ['./inscripcion-listar.scss']
})
export class InscripcionListarComponent implements OnInit, AfterViewInit {

  @ViewChild('modalInscripcion') modalInscripcion!: InscripcionServiciosInsertarComponent;
  @ViewChild('tableBody') tableBody!: ElementRef<HTMLElement>;

  private readonly ROW_HEIGHT_PX         = 48;
  private readonly PAGINATION_RESERVE_PX = 80;

  contratos: InscripcionResumenDTO[]          = [];
  contratosFiltrados: InscripcionResumenDTO[] = [];
  contratosPagina: InscripcionResumenDTO[]    = [];

  terminoBusqueda: string = '';
  filtroServicio: 'TODOS' | 'SIN_SERVICIO' | 'PARCIAL' | 'COMPLETO' = 'TODOS';
  isCargando: boolean = false;

  pageSize: number    = 7;
  currentPage: number = 1;
  totalPages: number  = 0;

  /** Controla el mini-modal de selección cuando hay múltiples pendientes */
  mostrarSelectorPendiente: boolean = false;
  selectorContrato?: InscripcionResumenDTO;

  TipoServicios = TipoServicios;

  constructor(
    private inscripcionService: InscripcionService,
    private toastr: ToastrService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.cargarContratos();
  }

  ngAfterViewInit(): void {
    setTimeout(() => this.calcularPageSize(), 0);
  }

  @HostListener('window:resize')
  onResize(): void {
    this.calcularPageSize();
  }

  calcularPageSize(): void {
    if (!this.tableBody?.nativeElement) return;
    const tbodyTop  = this.tableBody.nativeElement.getBoundingClientRect().top;
    const available = window.innerHeight - tbodyTop - this.PAGINATION_RESERVE_PX;
    const nuevaPageSize = Math.max(3, Math.floor(available / this.ROW_HEIGHT_PX));
    if (nuevaPageSize !== this.pageSize) {
      this.pageSize    = nuevaPageSize;
      this.currentPage = 1;
      this.aplicarPaginacion();
    }
  }

  cargarContratos(): void {
    this.isCargando = true;
    this.inscripcionService.listarResumen().subscribe({
      next: (data) => {
        this.contratos          = data;
        this.contratosFiltrados = [...data];
        this.currentPage        = 1;
        this.aplicarPaginacion();
        this.isCargando = false;
        this.cdr.markForCheck();
        setTimeout(() => this.calcularPageSize(), 0);
      },
      error: () => {
        this.isCargando = false;
        this.toastr.error('Error al cargar los contratos.', 'Error');
      }
    });
  }

  aplicarFiltros(): void {
    let resultado = [...this.contratos];

    if (this.terminoBusqueda.trim()) {
      const t = this.terminoBusqueda.toLowerCase();
      resultado = resultado.filter(c =>
        c.idContrato.toString().includes(t) ||
        c.nombreCliente.toLowerCase().includes(t)
      );
    }

    switch (this.filtroServicio) {
      case 'SIN_SERVICIO': resultado = resultado.filter(c => !c.tieneLuz && !c.tieneAgua); break;
      case 'PARCIAL':      resultado = resultado.filter(c => (c.tieneLuz || c.tieneAgua) && !(c.tieneLuz && c.tieneAgua)); break;
      case 'COMPLETO':     resultado = resultado.filter(c => c.tieneLuz && c.tieneAgua); break;
    }

    this.contratosFiltrados = resultado;
    this.currentPage        = 1;
    this.aplicarPaginacion();
  }

  aplicarPaginacion(): void {
    this.totalPages = Math.ceil(this.contratosFiltrados.length / this.pageSize);
    const start     = (this.currentPage - 1) * this.pageSize;
    this.contratosPagina = this.contratosFiltrados.slice(start, start + this.pageSize);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.aplicarPaginacion();
    }
  }

  previousPage(): void { if (this.currentPage > 1) this.goToPage(this.currentPage - 1); }
  nextPage(): void     { if (this.currentPage < this.totalPages) this.goToPage(this.currentPage + 1); }

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
      if (current <= 3)         end   = 4;
      if (current >= total - 2) start = total - 3;
      for (let i = start; i <= end; i++) pages.push(i);
      if (current < total - 2) pages.push('...');
      pages.push(total);
    }
    return pages;
  }

  limpiarFiltros(): void {
    this.terminoBusqueda = '';
    this.filtroServicio  = 'TODOS';
    this.currentPage     = 1;
    this.aplicarFiltros();
  }

  abrirModalInscripcion(contrato: InscripcionResumenDTO): void {
    const tienePendLuz  = contrato.tienePendienteLuz  && !!contrato.pendienteLuz;
    const tienePendAgua = contrato.tienePendienteAgua && !!contrato.pendienteAgua;

    const puedeCriarLuz  = !contrato.tieneLuz;
    const puedeCriarAgua = !contrato.tieneAgua;

    const hayMasDeUnaOpcion =
      (tienePendLuz && tienePendAgua) ||
      (tienePendLuz  && puedeCriarAgua) ||
      (tienePendAgua && puedeCriarLuz);

    if (!tienePendLuz && !tienePendAgua) {
      // Sin pendientes → Paso 1 normal, pasando qué servicios ya están inscritos
      this.modalInscripcion.abrirModal(
        contrato.idContrato,
        undefined,
        { tieneLuz: contrato.tieneLuz, tieneAgua: contrato.tieneAgua }
      );
      return;
    }

    if (hayMasDeUnaOpcion) {
      // Mostrar selector para que el usuario decida
      this.selectorContrato         = contrato;
      this.mostrarSelectorPendiente = true;
      return;
    }

    // Solo una opción: ir directo al Paso 2 del pendiente que existe
    if (tienePendLuz) {
      this.abrirAbonoPendiente(contrato.idContrato, TipoServicios.LUZ, contrato.pendienteLuz!);
    } else {
      this.abrirAbonoPendiente(contrato.idContrato, TipoServicios.AGUA, contrato.pendienteAgua!);
    }
  }

  /** Llamado desde el selector: el usuario elige abonar al pendiente */
  elegirAbonoPendiente(tipo: TipoServicios): void {
    if (!this.selectorContrato) return;
    const pendiente = tipo === TipoServicios.LUZ
      ? this.selectorContrato.pendienteLuz!
      : this.selectorContrato.pendienteAgua!;

    this.mostrarSelectorPendiente = false;
    this.abrirAbonoPendiente(this.selectorContrato.idContrato, tipo, pendiente);
    this.selectorContrato = undefined;
  }

  /** Llamado desde el selector: el usuario elige crear una nueva inscripción */
  elegirNuevaInscripcion(): void {
    if (!this.selectorContrato) return;
    const c = this.selectorContrato;
    this.mostrarSelectorPendiente = false;
    this.selectorContrato = undefined;
    this.modalInscripcion.abrirModal(
      c.idContrato,
      undefined,
      { tieneLuz: c.tieneLuz, tieneAgua: c.tieneAgua }
    );
  }

  cerrarSelectorPendiente(): void {
    this.mostrarSelectorPendiente = false;
    this.selectorContrato = undefined;
  }

  private abrirAbonoPendiente(
    idContrato: number,
    tipo: TipoServicios,
    pendiente: PendienteInscripcionDTO
  ): void {
    this.modalInscripcion.abrirModal(idContrato, {
      idInscripcion:  pendiente.idInscripcion,
      tipoServicio:   tipo,
      montoTotal:     pendiente.montoTotal,
      montoAcumulado: pendiente.montoAcumulado
    });
  }

  onInscripcionCreada(): void {
    this.cargarContratos();
  }

  onInscripcionExitosa(): void {
    this.cargarContratos();
  }

  eliminarInscripcion(contrato: InscripcionResumenDTO): void {
    const serviciosTexto = [
      contrato.tieneLuz  ? 'LUZ ⚡'  : null,
      contrato.tieneAgua ? 'AGUA 💧' : null
    ].filter(Boolean).join(' / ');

    Swal.fire({
      title: '¿Eliminar inscripción?',
      html: `
        <p style="margin-bottom:12px">Contrato <strong>#${contrato.idContrato}</strong> — ${contrato.nombreCliente}</p>
        <p style="margin-bottom:16px;color:#64748b;font-size:0.9rem">Servicios inscritos: <strong>${serviciosTexto}</strong></p>
        <label style="font-size:0.85rem;font-weight:600;color:#334155;display:block;text-align:left;margin-bottom:6px">
          ID de inscripción a eliminar
          <span style="font-size:0.78rem;font-weight:400;color:#94a3b8">(revísalo en el listado de pagos)</span>
        </label>
        <input id="swal-id-inscripcion" type="number" min="1"
          class="swal2-input" style="margin:0;width:100%"
          placeholder="Ej: 12">
      `,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#adb5bd',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      preConfirm: () => {
        const valor = (document.getElementById('swal-id-inscripcion') as HTMLInputElement)?.value;
        const id    = parseInt(valor, 10);
        if (!valor || isNaN(id) || id <= 0) {
          Swal.showValidationMessage('Ingresa un ID de inscripción válido');
          return false;
        }
        return id;
      }
    }).then(result => {
      if (!result.isConfirmed || !result.value) return;
      const idInscripcion = result.value as number;
      this.inscripcionService.eliminarInscripcion(idInscripcion).subscribe({
        next: () => {
          this.toastr.success('Inscripción eliminada correctamente.', 'Éxito');
          this.cargarContratos();
        },
        error: (err) => {
          this.toastr.error(
            err.error?.message || err.error || 'No se pudo eliminar la inscripción.',
            'Error'
          );
        }
      });
    });
  }

  getEstadoServicio(c: InscripcionResumenDTO): 'completo' | 'parcial' | 'ninguno' {
    if (c.tieneLuz && c.tieneAgua) return 'completo';
    if (c.tieneLuz || c.tieneAgua) return 'parcial';
    return 'ninguno';
  }

  getLotesTexto(c: InscripcionResumenDTO): string {
    if (!c.manzana && !c.numeroLote) return '—';
    return `Mz. ${c.manzana} - Lt. ${c.numeroLote}`;
  }

  getClientesTexto(c: InscripcionResumenDTO): string {
    return c.nombreCliente || '—';
  }

  /**
   * Hay opción de "Inscribir nuevo servicio" solo si existe al menos un servicio
   * que NO está inscrito (tieneLuz/tieneAgua = false) Y tampoco tiene adelanto
   * pendiente (tienePendienteLuz/tienePendienteAgua = false).
   * Si ambos servicios ya tienen adelanto pendiente o están completos, no se muestra.
   */
  puedeCriarNuevoServicio(c?: InscripcionResumenDTO): boolean {
    if (!c) return false;
    const luzDisponible  = !c.tieneLuz  && !c.tienePendienteLuz;
    const aguaDisponible = !c.tieneAgua && !c.tienePendienteAgua;
    return luzDisponible || aguaDisponible;
  }

  /** Devuelve un tooltip descriptivo de los adelantos pendientes */
  getTooltipAdelanto(c: InscripcionResumenDTO): string {
    const partes: string[] = [];
    if (c.tienePendienteLuz  && c.pendienteLuz)
      partes.push(`⚡ LUZ: adelanto pendiente S/ ${(c.pendienteLuz.montoTotal - c.pendienteLuz.montoAcumulado).toFixed(2)}`);
    if (c.tienePendienteAgua && c.pendienteAgua)
      partes.push(`💧 AGUA: adelanto pendiente S/ ${(c.pendienteAgua.montoTotal - c.pendienteAgua.montoAcumulado).toFixed(2)}`);
    return partes.join('\n');
  }

  /** true si el contrato tiene al menos un adelanto pendiente de pago */
  tieneAdelantoPendiente(c: InscripcionResumenDTO): boolean {
    return (c.tienePendienteLuz && !!c.pendienteLuz) ||
           (c.tienePendienteAgua && !!c.pendienteAgua);
  }
}