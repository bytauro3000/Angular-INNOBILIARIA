import { Component, ViewChild, OnInit, OnDestroy, AfterViewInit, ElementRef, ChangeDetectorRef, HostListener } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Subject, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil, switchMap } from 'rxjs/operators';
import { ContratoService } from '../../services/contrato.service';
import { ProgramaService } from '../../services/programa.service';
import { ContratoResponseDTO } from '../../dto/contratoreponse.dto';
import { Programa } from '../../models/programa.model';
import { TipoContrato } from '../../enums/tipocontrato.enum';
import { EstadoContrato } from '../../enums/Estadocontrato.enum';
import { ToastrService } from 'ngx-toastr';
import { InscripcionServiciosInsertarComponent } from '../inscripcion-servicios-insertar/inscripcion-servicios-insertar.component';
import { LetrasCambioService } from '../../services/letracambio.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-contrato-listar',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    DatePipe,
    InscripcionServiciosInsertarComponent
  ],
  templateUrl: './contrato-listar.html',
  styleUrls: ['./contrato-listar.scss'],
})
export class ContratoListarComponent implements OnInit, OnDestroy, AfterViewInit {

  @ViewChild('modalInscripcion') modalInscripcion!: InscripcionServiciosInsertarComponent;

  contratos: ContratoResponseDTO[] = [];
  contratosFiltrados: ContratoResponseDTO[] = [];
  paginatedContratos: ContratoResponseDTO[] = [];

  // 3 pestañas de búsqueda
  tipoBusqueda: 'ID' | 'LOTE' | 'CLIENTE' = 'ID';

  // Búsqueda por ID
  terminoBusqueda: string = '';

  // Búsqueda por Lote
  programas: Programa[] = [];
  programaSeleccionado: number | null = null;
  manzanaBusqueda: string = '';
  numeroLoteBusqueda: string = '';

  // Búsqueda por Cliente
  nombreClienteBusqueda: string = '';
  buscandoCliente: boolean = false;

   pageSize: number = 6;
  currentPage: number = 1;
  totalPages: number = 0;

  @ViewChild('tableBody') tableBody!: ElementRef<HTMLElement>;
  private readonly ROW_HEIGHT_PX = 60;
  private readonly PAGINATION_RESERVE_PX = 80;

  TipoContrato = TipoContrato;
  EstadoContrato = EstadoContrato;

  isCargando: boolean = false;
  dropdownEstadoAbierto: number | null = null;

  /** Mapa idContrato → true/false indicando si ya tiene letras generadas en BD */
  letrasExistenMap: Map<number, boolean> = new Map();
  dropdownPos: { top: number; left: number } = { top: 0, left: 0 };

  // ─── DEBOUNCE: Subject que recibe cada tecla y espera 400ms ──────────
  private clienteSearch$ = new Subject<string>();
  // Subject para cancelar todas las suscripciones al destruir el componente
  private destroy$ = new Subject<void>();

  constructor(
    private contratoService: ContratoService,
    private programaService: ProgramaService,
    private toastr: ToastrService,
    private cdr: ChangeDetectorRef,
    private router: Router,
    private letrasService: LetrasCambioService
  ) { }

  ngOnInit(): void {
    this.cargarContratos();
    this.cargarProgramas();

    // switchMap cancela la petición HTTP anterior cuando llega un nuevo valor
    // — resuelve la race condition: si borras el texto mientras carga,
    //   la respuesta tardía queda descartada y se muestra la lista completa
    this.clienteSearch$.pipe(
      debounceTime(400),
      distinctUntilChanged(),
      switchMap(termino => {
        if (!termino || termino.length < 2) {
          // Campo vacío o muy corto: cancelar petición pendiente y mostrar lista completa
          this.buscandoCliente = false;
          this.contratosFiltrados = [...this.contratos];
          this.currentPage = 1;
          this.aplicarPaginacion();
          return of(null); // emite null para no romper el pipe, switchMap cancela la anterior
        }
        this.buscandoCliente = true;
        return this.contratoService.buscarPorNombreCliente(termino);
      }),
      takeUntil(this.destroy$)
    ).subscribe({
      next: (data) => {
        if (data === null) return; // resultado del campo vacío — ya se procesó arriba
        this.buscandoCliente = false;
        this.contratosFiltrados = data;
        this.currentPage = 1;
        this.aplicarPaginacion();
        this.cdr.markForCheck();
      },
      error: () => {
        this.buscandoCliente = false;
        this.toastr.error('Error al buscar por cliente', 'Error');
      }
    });
  }

  // Limpia las suscripciones cuando el componente se destruye
  // (evita memory leaks al navegar a otra pantalla)
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ─── CAMBIO DE PESTAÑA ────────────────────────────────────────────────
  cambiarModoBusqueda(modo: 'ID' | 'LOTE' | 'CLIENTE'): void {
    this.tipoBusqueda = modo;
    this.limpiarBusqueda();
  }

  // ─── CARGA INICIAL ────────────────────────────────────────────────────
  cargarContratos(): void {
    this.isCargando = true;
    this.contratoService.listarContrato().subscribe({
      next: (data) => {
        this.isCargando = false;
        this.contratos = [...data];
        this.filtrarContratos();
        this.cdr.markForCheck();
        // Verificar existencia de letras para contratos FINANCIADOS
        this.verificarLetrasParaContratos(data);
      },
      error: (error) => {
        this.isCargando = false;
        console.error('Error al cargar contratos:', error);
        this.toastr.error('Error al cargar los contratos.', 'Error');
        this.cdr.detectChanges();
      }
    });
  }

  verificarLetrasParaContratos(contratos: ContratoResponseDTO[]): void {
  const financiados = contratos
    .filter(c => c.tipoContrato === 'FINANCIADO' && c.idContrato)
    .map(c => c.idContrato);

  if (financiados.length === 0) return;

  this.letrasService.existenLetrasBatch(financiados).subscribe({
    next: (mapa: { [id: number]: boolean }) => {
      Object.entries(mapa).forEach(([id, existe]) => {
        this.letrasExistenMap.set(Number(id), existe);
      });
      this.cdr.markForCheck();
    },
    error: () => {
      financiados.forEach(id => this.letrasExistenMap.set(id, false));
    }
  });
}
  /** True si el contrato ya tiene letras generadas en BD */
  tieneLetrasGeneradas(idContrato: number): boolean {
    return this.letrasExistenMap.get(idContrato) ?? false;
  }

  cargarProgramas(): void {
    this.programaService.listarProgramas().subscribe({
      next: (data) => { this.programas = data; },
      error: () => { this.toastr.warning('No se pudieron cargar los programas', 'Aviso'); }
    });
  }

  // ─── FILTROS ──────────────────────────────────────────────────────────

  // Filtro por ID (local, instantáneo)
  filtrarContratos(): void {
    if (!this.terminoBusqueda) {
      this.contratosFiltrados = [...this.contratos];
    } else {
      const termino = this.terminoBusqueda.toLowerCase();
      this.contratosFiltrados = this.contratos.filter(c => c.idContrato?.toString().includes(termino));
    }
    this.currentPage = 1;
    this.aplicarPaginacion();
  }

  // Filtro por Lote (local, instantáneo)
  filtrarPorLote(): void {
    let resultado = [...this.contratos];
    if (this.programaSeleccionado) {
      const prog = this.programas.find(p => p.idPrograma === this.programaSeleccionado);
      if (prog) resultado = resultado.filter(c => c.lotes?.some(l => l.nombrePrograma === prog.nombrePrograma));
    }
    if (this.manzanaBusqueda.trim()) {
      const mz = this.manzanaBusqueda.trim().toUpperCase();
      resultado = resultado.filter(c => c.lotes?.some(l => l.manzana?.toUpperCase().includes(mz)));
    }
    if (this.numeroLoteBusqueda.trim()) {
      const lt = this.numeroLoteBusqueda.trim().toUpperCase();
      resultado = resultado.filter(c => c.lotes?.some(l => l.numeroLote?.toUpperCase().includes(lt)));
    }
    this.contratosFiltrados = resultado;
    this.currentPage = 1;
    this.aplicarPaginacion();
    this.cdr.markForCheck();
  }

  // Filtro por Cliente — el input llama aquí, pero el Subject
  // el Subject con switchMap se encarga de la llamada al backend
  filtrarPorCliente(): void {
    this.clienteSearch$.next(this.nombreClienteBusqueda.trim());
  }



  // ─── AUTO-FORMATO NÚMERO DE LOTE (igual que pagoletra-listar) ─────────
  formatearNumeroLote(event: Event): void {
    const input = event.target as HTMLInputElement;
    const raw = input.value.replace(/\D/g, '');

    let resultado = '';
    if (raw.length === 0 || raw === '0') {
      // Vacío o solo "0" (usuario borró el segundo dígito de "07") → limpiar
      resultado = '';
    } else if (raw.length === 1) {
      // Un dígito significativo → prefijarlo con 0: "7" → "07"
      resultado = '0' + raw;
    } else if (raw.length === 2) {
      resultado = raw === '00' ? '' : raw;
    } else {
      const sinCero = raw.replace(/^0+/, '') || '';
      resultado = sinCero.length === 0 ? '' : sinCero.padStart(2, '0').slice(-2);
    }

    this.numeroLoteBusqueda = resultado;
    input.value = resultado;
    this.filtrarPorLote();
  }

  limpiarBusqueda(): void {
    this.programaSeleccionado = null;
    this.manzanaBusqueda = '';
    this.numeroLoteBusqueda = '';
    this.terminoBusqueda = '';
    this.nombreClienteBusqueda = '';
    this.contratosFiltrados = [...this.contratos];
    this.currentPage = 1;
    this.aplicarPaginacion();
  }

  // ─── GESTIÓN DE ESTADO ───────────────────────────────────────────────
  getEstadoConfig(estado: EstadoContrato | string): { label: string; icon: string; cssClass: string } {
    switch (estado) {
      case EstadoContrato.ACTIVO:         return { label: 'Activo',         icon: 'bi-check-circle-fill',         cssClass: 'badge-activo' };
      case EstadoContrato.MORA:           return { label: 'En Mora',        icon: 'bi-exclamation-triangle-fill', cssClass: 'badge-mora' };
      case EstadoContrato.CARTA_NOTARIAL: return { label: 'Carta Notarial', icon: 'bi-envelope-exclamation-fill', cssClass: 'badge-carta' };
      case EstadoContrato.EN_RESOLUCION:  return { label: 'En Resolución',  icon: 'bi-hourglass-split',           cssClass: 'badge-resolucion' };
      case EstadoContrato.RESUELTO:       return { label: 'Resuelto',       icon: 'bi-x-circle-fill',             cssClass: 'badge-resuelto' };
      case EstadoContrato.CANCELADO:      return { label: 'Cancelado',      icon: 'bi-trophy-fill',               cssClass: 'badge-cancelado' };
      case EstadoContrato.RENUNCIA:       return { label: 'Renuncia',       icon: 'bi-door-open-fill',            cssClass: 'badge-renuncia' };
      case EstadoContrato.TRANSFERIDO:    return { label: 'Transferido',    icon: 'bi-arrow-left-right',          cssClass: 'badge-transferido' };
      default:                            return { label: 'Activo',         icon: 'bi-check-circle-fill',         cssClass: 'badge-activo' };
    }
  }

  getTransicionesDisponibles(contrato: ContratoResponseDTO): { estado: EstadoContrato | 'RENUNCIA_ACTION' | 'TRANSFERENCIA_ACTION'; label: string }[] {
    const estado = contrato.estadoContrato;
    switch (estado) {
      case EstadoContrato.ACTIVO:
      case EstadoContrato.MORA: {
        const opciones: any[] = [{ estado: 'RENUNCIA_ACTION', label: '🚪 Registrar Renuncia' }];
        if (contrato.tipoContrato === 'FINANCIADO') opciones.push({ estado: 'TRANSFERENCIA_ACTION', label: '🔄 Transferir a otro cliente' });
        if (estado === EstadoContrato.MORA) opciones.unshift({ estado: EstadoContrato.CARTA_NOTARIAL, label: '📄 Enviar Carta Notarial' });
        return opciones;
      }
      case EstadoContrato.CARTA_NOTARIAL:
        return [
          { estado: EstadoContrato.EN_RESOLUCION, label: '⚖️ Iniciar Resolución' },
          { estado: EstadoContrato.ACTIVO,        label: '↩ Reactivar (pagó deuda)' }
        ];
      case EstadoContrato.EN_RESOLUCION:
        return [{ estado: EstadoContrato.RESUELTO, label: '🏁 Marcar como Resuelto' }];
      default:
        return [];
    }
  }

  toggleDropdownEstado(idContrato: number, event: Event): void {
    event.stopPropagation();
    if (this.dropdownEstadoAbierto === idContrato) {
      this.dropdownEstadoAbierto = null;
      return;
    }
    // Calcular posición del botón para anclar el menú con position:fixed
    const btn = event.currentTarget as HTMLElement;
    const rect = btn.getBoundingClientRect();
    this.dropdownPos = {
      top: rect.bottom + 6,
      left: rect.right - 210  // alineado a la derecha del botón, 210px = min-width del menú
    };
    this.dropdownEstadoAbierto = idContrato;
  }

 // ✅ DESPUÉS
  ngAfterViewInit(): void {
    setTimeout(() => this.calcularPageSize(), 0);
  }

  @HostListener('window:scroll')
  @HostListener('window:resize')
  onWindowEvent(): void {
    this.dropdownEstadoAbierto = null;
    this.calcularPageSize();
  }

  calcularPageSize(): void {
    if (!this.tableBody?.nativeElement) return;
    const tbodyTop = this.tableBody.nativeElement.getBoundingClientRect().top;
    const available = window.innerHeight - tbodyTop - this.PAGINATION_RESERVE_PX;
    const nuevaPageSize = Math.max(3, Math.floor(available / this.ROW_HEIGHT_PX));
    if (nuevaPageSize !== this.pageSize) {
      this.pageSize = nuevaPageSize;
      this.currentPage = 1;
      this.aplicarPaginacion();
    }
  }
  cerrarDropdowns(): void { this.dropdownEstadoAbierto = null; }

  ejecutarTransicion(contrato: ContratoResponseDTO, accion: EstadoContrato | string): void {
    if (accion === 'RENUNCIA_ACTION') this.confirmarRenuncia(contrato);
    else if (accion === 'TRANSFERENCIA_ACTION') this.confirmarTransferencia(contrato);
    else this.cambiarEstado(contrato, accion as EstadoContrato);
  }

  confirmarRenuncia(contrato: ContratoResponseDTO): void {
    this.dropdownEstadoAbierto = null;
    Swal.fire({
      title: '¿Registrar Renuncia?',
      html: `El cliente del contrato <strong>#${contrato.idContrato}</strong> renuncia voluntariamente.<br>
             <small style="color:#dc3545; margin-top:6px; display:block">⚠️ El/los lotes volverán a estado Disponible inmediatamente.</small>`,
      icon: 'warning', showCancelButton: true,
      confirmButtonColor: '#dc3545', cancelButtonColor: '#adb5bd',
      confirmButtonText: 'Sí, registrar renuncia', cancelButtonText: 'Cancelar'
    }).then(result => {
      if (result.isConfirmed) {
        this.contratoService.registrarRenuncia(contrato.idContrato).subscribe({
          next: (actualizado) => {
            const idx = this.contratos.findIndex(c => c.idContrato === contrato.idContrato);
            if (idx !== -1) this.contratos[idx] = actualizado;
            this.filtrarContratos();
            this.toastr.success('Renuncia registrada. Lote liberado.', 'Éxito');
            this.cdr.markForCheck();
          },
          error: (err) => { this.toastr.error(err?.error?.message || 'Error al registrar renuncia.', 'Error'); }
        });
      }
    });
  }

  confirmarTransferencia(contrato: ContratoResponseDTO): void {
    this.dropdownEstadoAbierto = null;
    Swal.fire({
      title: '¿Transferir contrato?',
      html: `Se calculará el monto pagado del contrato <strong>#${contrato.idContrato}</strong> y se pre-llenará el formulario de nuevo contrato para el cliente receptor.<br>
             <small style="color:#0353a4; margin-top:6px; display:block">El lote continuará como Vendido hasta que el nuevo contrato esté registrado.</small>`,
      icon: 'question', showCancelButton: true,
      confirmButtonColor: '#023e8a', cancelButtonColor: '#adb5bd',
      confirmButtonText: 'Sí, continuar', cancelButtonText: 'Cancelar'
    }).then(result => {
      if (result.isConfirmed) {
        this.contratoService.registrarTransferencia(contrato.idContrato).subscribe({
          next: (datos) => {
            this.toastr.info('Redirigiendo al formulario de nuevo contrato...', 'Transferencia');
            const idx = this.contratos.findIndex(c => c.idContrato === contrato.idContrato);
            if (idx !== -1) this.contratos[idx].estadoContrato = EstadoContrato.TRANSFERIDO;
            this.filtrarContratos();
            this.cdr.markForCheck();
            this.router.navigate(['/secretaria-menu/contratos/registrar'], {
              queryParams: {
                transferencia: '1', idContratoOrigen: datos.idContratoOriginal,
                montoTotal: datos.montoTotal, inicial: datos.montoPagado,
                saldo: datos.saldoPendiente, cantidadLetras: datos.letrasRestantes,
                idVendedor: datos.idVendedor, idLotes: datos.idLotes.join(',')
              }
            });
          },
          error: (err) => { this.toastr.error(err?.error?.message || 'Error al procesar transferencia.', 'Error'); }
        });
      }
    });
  }

  cambiarEstado(contrato: ContratoResponseDTO, nuevoEstado: EstadoContrato): void {
    this.dropdownEstadoAbierto = null;
    const config = this.getEstadoConfig(nuevoEstado);
    const textoExtra = nuevoEstado === EstadoContrato.RESUELTO
      ? '<br><small style="color:#dc3545; margin-top:6px; display:block">⚠️ El/los lotes volverán a estado Disponible.</small>' : '';
    Swal.fire({
      title: '¿Confirmar cambio de estado?',
      html: `Contrato <strong>#${contrato.idContrato}</strong> pasará a:<br>
             <span style="font-size:1.1rem;font-weight:600;margin-top:8px;display:block">${config.label}</span>${textoExtra}`,
      icon: 'question', showCancelButton: true,
      confirmButtonColor: '#023e8a', cancelButtonColor: '#adb5bd',
      confirmButtonText: 'Sí, confirmar', cancelButtonText: 'Cancelar'
    }).then(result => {
      if (result.isConfirmed) {
        this.contratoService.cambiarEstado(contrato.idContrato, nuevoEstado).subscribe({
          next: (actualizado) => {
            const idx = this.contratos.findIndex(c => c.idContrato === contrato.idContrato);
            if (idx !== -1) this.contratos[idx] = actualizado;
            this.filtrarContratos();
            this.toastr.success(`Estado actualizado a: ${config.label}`, 'Éxito');
            this.cdr.markForCheck();
          },
          error: (err) => { this.toastr.error(err?.error?.message || 'No se pudo cambiar el estado.', 'Error'); }
        });
      }
    });
  }

  // ─── IMPRESIÓN ───────────────────────────────────────────────────────
  imprimirContrato(contrato: ContratoResponseDTO): void {
    if (contrato.tipoContrato === 'FINANCIADO' && (!contrato.letras || contrato.letras.length === 0)) {
      this.toastr.warning('Primero debe generar las letras de cambio.', 'Atención');
      return;
    }
    this.toastr.info('Generando documento...', 'Espere');
    this.contratoService.imprimirContratoPdf(contrato.idContrato).subscribe({
      next: (blob: Blob) => {
        const listaLotes = contrato.lotes;
        let nombreBase = listaLotes.length === 1
          ? `MZ. ${listaLotes[0].manzana} LT. ${listaLotes[0].numeroLote}`
          : listaLotes.every(l => l.manzana === listaLotes[0].manzana)
            ? `MZ. ${listaLotes[0].manzana} LT. ${listaLotes.map(l => l.numeroLote).join(' y ')}`
            : listaLotes.map(l => `MZ. ${l.manzana} LT. ${l.numeroLote}`).join(' y ');
        const tipo = contrato.tipoContrato.charAt(0).toUpperCase() + contrato.tipoContrato.slice(1).toLowerCase();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${nombreBase} - ${tipo}.pdf`;
        link.click();
        window.URL.revokeObjectURL(url);
        this.toastr.success('Contrato descargado con éxito', 'Éxito');
      },
      error: () => { this.toastr.error('No se pudo obtener el PDF.', 'Error'); }
    });
  }

  // ─── PAGINACIÓN ──────────────────────────────────────────────────────
  aplicarPaginacion(): void {
    this.totalPages = Math.ceil(this.contratosFiltrados.length / this.pageSize);
    const startIndex = (this.currentPage - 1) * this.pageSize;
    this.paginatedContratos = this.contratosFiltrados.slice(startIndex, startIndex + this.pageSize);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.aplicarPaginacion();
      this.cdr.detectChanges();
    }
  }

  previousPage(): void { if (this.currentPage > 1) this.goToPage(this.currentPage - 1); }
  nextPage(): void { if (this.currentPage < this.totalPages) this.goToPage(this.currentPage + 1); }
  getPagesArray(): number[] { return Array.from({ length: this.totalPages }, (_, i) => i + 1); }

  // ─── MODAL / ELIMINAR ────────────────────────────────────────────────
  abrirModalInscripcion(id: number): void { this.modalInscripcion.abrirModal(id); }
  onInscripcionExitosa(): void { this.cargarContratos(); }

  eliminarContrato(id: number): void {
    Swal.fire({
      title: '¿Estás seguro?', text: '¡No podrás revertir esto!', icon: 'warning',
      showCancelButton: true, confirmButtonColor: '#3085d6', cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, eliminar', cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.contratoService.eliminarContrato(id).subscribe({
          next: () => { this.toastr.success('Contrato eliminado exitosamente', 'Éxito'); this.cargarContratos(); },
          error: () => { this.toastr.error('Error al eliminar el contrato', 'Error'); }
        });
      }
    });
  }

  trackById(index: number, contrato: ContratoResponseDTO): number { return contrato.idContrato!; }
}