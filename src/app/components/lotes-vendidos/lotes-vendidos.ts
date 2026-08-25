import { Component, OnInit, ElementRef, ViewChild } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Observable } from 'rxjs';

import { ContratoService, LotesVendidosResponseDTO, ProgramaVendidoDTO, LoteVendidoDTO } from '../../services/contrato.service';
import { VendedorService } from '../../services/vendedor.service';
import { Vendedor } from '../../models/vendedor.model';
import { TokenService } from '../../auth/token.service';

interface VendedorConVentas {
  idVendedor: number;
  nombre: string;
  dni: string;
}

@Component({
  selector: 'app-lotes-vendidos',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, CurrencyPipe, DatePipe],
  templateUrl: './lotes-vendidos.html',
  styleUrl: './lotes-vendidos.scss',
})
export class LotesVendidosComponent implements OnInit {

  // 'vendedor' → solo sus ventas (JWT). 'secretaria' → todas, con filtro por vendedor.
  modo: 'vendedor' | 'secretaria' = 'vendedor';

  programas: ProgramaVendidoDTO[] = [];
  totalGeneral = 0;
  cantidadLotes = 0;
  cargando = false;
  error = '';
  sinVendedorAsociado = false;

  // Select autocompletar (solo en modo secretaria)
  vendedoresConVentas: VendedorConVentas[] = [];
  vendedoresFiltrados: VendedorConVentas[] = [];
  filtroVendedor = '';
  mostrarVendedores = false;
  vendedorSeleccionado: VendedorConVentas | null = null;

  @ViewChild('vendedorBusquedaContainer') vendedorBusquedaContainer!: ElementRef;

  private todasLasRespuestas: LotesVendidosResponseDTO | null = null;

  constructor(
    private contratoService: ContratoService,
    private vendedorService: VendedorService,
    private tokenService: TokenService,
    private route: ActivatedRoute,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.modo = (this.route.snapshot.data['modo'] === 'secretaria') ? 'secretaria' : 'vendedor';
    this.cargarDatos();
  }

  cargarDatos(): void {
    this.cargando = true;
    this.error = '';
    this.sinVendedorAsociado = false;

    // En modo vendedor, si la cuenta no está vinculada a ningún vendedor, no se
    // consulta nada: la vista queda vacía con un aviso.
    if (this.modo === 'vendedor') {
      const idVendedor = this.tokenService.getIdVendedor();
      if (idVendedor == null) {
        this.cargando = false;
        this.sinVendedorAsociado = true;
        this.programas = [];
        this.totalGeneral = 0;
        this.cantidadLotes = 0;
        return;
      }
      this.consultar(this.contratoService.listarLotesVendidos(idVendedor));
      return;
    }

    this.consultar(this.contratoService.listarLotesVendidos());
  }

  private consultar(obs: Observable<LotesVendidosResponseDTO>): void {
    obs.subscribe({
      next: (data) => {
        this.cargando = false;
        this.todasLasRespuestas = data;
        this.programas = data.programas.map(p => ({ ...p, lotes: this.ordenarLotes(p.lotes) }));
        this.totalGeneral = data.totalGeneral;
        this.cantidadLotes = data.cantidadLotes;
        if (this.modo === 'secretaria') this.construirVendedoresConVentas();
      },
      error: (err) => {
        this.cargando = false;
        this.error = 'No se pudieron cargar los lotes vendidos.';
        console.error('Error al cargar ventas:', err);
      },
    });
  }

  /** Ordena por manzana (texto) y luego por número de lote (numérico). */
  private ordenarLotes(lotes: LoteVendidoDTO[]): LoteVendidoDTO[] {
    return [...lotes].sort((a, b) => {
      const mz = a.manzana.localeCompare(b.manzana, undefined, { numeric: true, sensitivity: 'base' });
      if (mz !== 0) return mz;
      return a.numeroLote.localeCompare(b.numeroLote, undefined, { numeric: true, sensitivity: 'base' });
    });
  }

  private construirVendedoresConVentas(): void {
    if (!this.todasLasRespuestas) return;
    const unicos = new Map<number, VendedorConVentas>();
    for (const programa of this.todasLasRespuestas.programas) {
      for (const lote of programa.lotes) {
        if (lote.idVendedor != null && !unicos.has(lote.idVendedor)) {
          unicos.set(lote.idVendedor, {
            idVendedor: lote.idVendedor,
            nombre: lote.vendedor || '',
            dni: '',
          });
        }
      }
    }
    // Rellenar DNI desde el servicio de vendedores
    this.vendedorService.listarVendedores().subscribe({
      next: (vendedores: Vendedor[]) => {
        for (const v of vendedores) {
          const existente = unicos.get(v.idVendedor!);
          if (existente) existente.dni = v.dni || '';
        }
        this.vendedoresConVentas = Array.from(unicos.values()).sort((a, b) => a.nombre.localeCompare(b.nombre));
        this.vendedoresFiltrados = [...this.vendedoresConVentas];
      },
      error: () => {
        this.vendedoresConVentas = Array.from(unicos.values()).sort((a, b) => a.nombre.localeCompare(b.nombre));
        this.vendedoresFiltrados = [...this.vendedoresConVentas];
      },
    });
  }

  filtrarVendedores(): void {
    const f = this.filtroVendedor.toLowerCase();
    this.vendedoresFiltrados = this.vendedoresConVentas.filter(v =>
      v.nombre.toLowerCase().includes(f) || v.dni.includes(f));
    this.mostrarVendedores = true;
  }

  seleccionarVendedor(v: VendedorConVentas): void {
    this.vendedorSeleccionado = v;
    this.filtroVendedor = v.nombre;
    this.mostrarVendedores = false;
    this.aplicarFiltroVendedor();
  }

  limpiarFiltroVendedor(): void {
    this.vendedorSeleccionado = null;
    this.filtroVendedor = '';
    this.mostrarVendedores = false;
    this.programas = (this.todasLasRespuestas?.programas ?? []).map(p => ({ ...p, lotes: this.ordenarLotes(p.lotes) }));
    this.totalGeneral = this.todasLasRespuestas?.totalGeneral ?? 0;
    this.cantidadLotes = this.todasLasRespuestas?.cantidadLotes ?? 0;
  }

  private aplicarFiltroVendedor(): void {
    if (!this.todasLasRespuestas || !this.vendedorSeleccionado) return;
    const programasFiltrados = this.todasLasRespuestas.programas
      .map(p => ({
        ...p,
        lotes: p.lotes.filter(l => l.idVendedor === this.vendedorSeleccionado!.idVendedor),
      }))
      .filter(p => p.lotes.length > 0)
      .map(p => ({
        ...p,
        totalPrograma: p.lotes.reduce((sum, l) => sum + l.costoVenta, 0),
        cantidadLotes: p.lotes.length,
      }));

    this.programas = programasFiltrados.map(p => ({ ...p, lotes: this.ordenarLotes(p.lotes) }));
    this.totalGeneral = programasFiltrados.reduce((sum, p) => sum + p.totalPrograma, 0);
    this.cantidadLotes = programasFiltrados.reduce((sum, p) => sum + p.cantidadLotes, 0);
  }

  cerrarListaSiClickFuera(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (this.vendedorBusquedaContainer && !this.vendedorBusquedaContainer.nativeElement.contains(target)) {
      this.mostrarVendedores = false;
    }
  }

  irAContrato(idContrato: number): void {
    this.router.navigate(['/secretaria-menu/contratos/editar', idContrato]);
  }
}