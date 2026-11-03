import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { VendedorService } from '../../services/vendedor.service';
import { ComisionVendedorService } from '../../services/comision-vendedor.service';
import { Vendedor } from '../../models/vendedor.model';
import { FilaPagoVendedor, ReportePagosVendedorDTO } from '../../dto/comision-vendedor.dto';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-reporte-pagos-vendedores',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reporte-pagos-vendedores.html',
  styleUrls: ['./reporte-pagos-vendedores.scss']
})
export class ReportePagosVendedoresComponent implements OnInit {

  vendedores: Vendedor[] = [];
  vendedoresFiltrados: Vendedor[] = [];
  filtroVendedor: string = '';
  vendedorSeleccionado: Vendedor | null = null;
  mostrarVendedores: boolean = false;

  /** Filtro 2: tipo de pago (primer adelanto o cuotas mensuales). */
  filtroTipo: string = 'TODOS';
  readonly tiposPago = [
    { valor: 'TODOS', etiqueta: 'Todos', icono: 'fa-list' },
    { valor: 'ADELANTO', etiqueta: 'Primer Adelanto', icono: 'fa-hand-holding-usd' },
    { valor: 'MENSUAL', etiqueta: 'Cuotas (10%)', icono: 'fa-calendar-check' }
  ];

  reporte: ReportePagosVendedorDTO | null = null;
  cargando: boolean = false;
  descargando: boolean = false;

  constructor(
    private vendedorService: VendedorService,
    private comisionService: ComisionVendedorService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.vendedorService.listarVendedores().subscribe({
      next: (data) => {
        this.vendedores = data;
        this.vendedoresFiltrados = [...data];
        this.buscar();
      },
      error: () => {
        this.toastr.error('Error al cargar vendedores', 'Error');
        this.buscar();
      }
    });
  }

  // ── Filtro 1: vendedor por nombre ────────────────────────────────────

  filtrarVendedores(): void {
    const f = this.filtroVendedor.toLowerCase().trim();
    this.vendedoresFiltrados = this.vendedores.filter(v =>
      `${v.nombre} ${v.apellidos}`.toLowerCase().includes(f) || (v.dni || '').includes(f)
    );
    this.mostrarVendedores = true;
  }

  seleccionarVendedor(v: Vendedor): void {
    this.vendedorSeleccionado = v;
    this.filtroVendedor = `${v.nombre} ${v.apellidos}`;
    this.mostrarVendedores = false;
    this.buscar();
  }

  limpiarSeleccion(): void {
    this.vendedorSeleccionado = null;
    this.filtroVendedor = '';
    this.mostrarVendedores = false;
    this.buscar();
  }

  // ── Filtro 2: tipo de pago ───────────────────────────────────────────

  setFiltroTipo(tipo: string): void {
    if (this.filtroTipo === tipo) return;
    this.filtroTipo = tipo;
    this.buscar();
  }

  limpiarFiltros(): void {
    this.vendedorSeleccionado = null;
    this.filtroVendedor = '';
    this.filtroTipo = 'TODOS';
    this.buscar();
  }

  // ── Carga del reporte ────────────────────────────────────────────────

  buscar(): void {
    this.cargando = true;
    const idVendedor = this.vendedorSeleccionado?.idVendedor ?? null;
    this.comisionService.reportePagos(idVendedor, this.filtroTipo).subscribe({
      next: (data) => {
        this.reporte = data;
        this.cargando = false;
      },
      error: () => {
        this.reporte = null;
        this.cargando = false;
        this.toastr.error('Error al cargar el reporte de pagos', 'Error');
      }
    });
  }

  descargarPdf(): void {
    if (this.descargando) return;
    this.descargando = true;
    const idVendedor = this.vendedorSeleccionado?.idVendedor ?? null;
    const nombre = this.vendedorSeleccionado
      ? `${this.vendedorSeleccionado.nombre} ${this.vendedorSeleccionado.apellidos}`.trim()
      : 'TODOS';

    this.comisionService.descargarReportePagosPdf(idVendedor, this.filtroTipo).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `REPORTE DE PAGOS (${this.sanitizarNombre(nombre)}).pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        this.descargando = false;
        this.toastr.success('Reporte descargado correctamente', 'Éxito');
      },
      error: () => {
        this.toastr.error('No se pudo generar el reporte', 'Error');
        this.descargando = false;
      }
    });
  }

  // ── Helpers de vista ─────────────────────────────────────────────────

  get filas(): FilaPagoVendedor[] {
    return this.reporte?.pagos ?? [];
  }

  moneda(m: string | null | undefined): string {
    return m === 'PEN' ? 'S/.' : '$';
  }

  etiquetaTipo(tipo: string | null | undefined): string {
    if (tipo === 'ADELANTO') return 'Adelanto';
    if (tipo === 'MENSUAL') return 'Cuota';
    return tipo || '—';
  }

  claseTipo(tipo: string | null | undefined): string {
    return tipo === 'ADELANTO' ? 'badge-adelanto' : 'badge-cuota';
  }

  get totalColumnas(): number {
    return this.reporte?.todosVendedores ? 10 : 9;
  }

  private sanitizarNombre(nombre: string): string {
    return nombre
      .replace(/[\\/:*?"<>|]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .toUpperCase();
  }

  onClickFuera(event: Event): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.custom-select-container')) {
      this.mostrarVendedores = false;
    }
  }
}
