import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CuentasPorCobrarService } from '../../services/cuentas-por-cobrar.service';
import { CuentasPorCobrarDTO, GrupoProgramaDTO, FilaCuentaDTO } from '../../dto/cuentas-por-cobrar.dto';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-cuentas-por-cobrar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './cuentas-por-cobrar.html',
  styleUrls: ['./cuentas-por-cobrar.scss']
})
export class CuentasPorCobrarComponent implements OnInit {

  data: CuentasPorCobrarDTO | null = null;
  cargando = true;
  /** Programas expandidos (por defecto el primero). */
  expandidos: Set<string> = new Set();
  /** Término de búsqueda local (filtra cliente / MZ / LT en la tabla). */
  filtro: string = '';

  constructor(
    private cuentasService: CuentasPorCobrarService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.cargando = true;
    this.cuentasService.obtenerCuentasPorCobrar().subscribe({
      next: (data) => {
        this.data = data;
        this.cargando = false;
        // Por defecto expandir el primer programa
        if (data.programas.length > 0) {
          this.expandidos = new Set([data.programas[0].nombrePrograma]);
        } else {
          this.expandidos = new Set();
        }
      },
      error: () => {
        this.toastr.error('Error al cargar cuentas por cobrar', 'Error');
        this.cargando = false;
      }
    });
  }

  togglePrograma(programa: GrupoProgramaDTO): void {
    if (this.expandidos.has(programa.nombrePrograma)) {
      this.expandidos.delete(programa.nombrePrograma);
    } else {
      this.expandidos.add(programa.nombrePrograma);
    }
  }

  estaExpandido(nombrePrograma: string): boolean {
    return this.expandidos.has(nombrePrograma);
  }

  /**
   * Al escribir en el buscador, expande automáticamente los programas que tienen
   * coincidencias y pliega los que no. Si el campo queda vacío, restaura el
   * estado por defecto (solo el primer programa expandido).
   */
  onFiltroChange(): void {
    if (!this.data || this.data.programas.length === 0) return;

    const termino = this.filtro.trim().toLowerCase();
    if (!termino) {
      this.expandidos = new Set([this.data.programas[0].nombrePrograma]);
      return;
    }

    const nuevos = new Set<string>();
    for (const programa of this.data.programas) {
      if (this.contratosFiltrados(programa).length > 0) {
        nuevos.add(programa.nombrePrograma);
      }
    }
    this.expandidos = nuevos;
  }

  /** Contratos del programa filtrados por el término de búsqueda (client-side). */
  contratosFiltrados(programa: GrupoProgramaDTO): FilaCuentaDTO[] {
    const termino = this.filtro.trim().toLowerCase();
    if (!termino) return programa.contratos;
    return programa.contratos.filter(f => this.filaCoincide(f, termino));
  }

  /** Indica si una fila coincide con el término (cliente / MZ / LT / programa). */
  private filaCoincide(f: FilaCuentaDTO, termino: string): boolean {
    const cliente = (f.nombreCliente || '').toLowerCase();
    const mz = (f.manzanas || []).join(' ').toLowerCase();
    const lt = (f.numeroLotes || []).join(' ').toLowerCase();
    const programaNombre = (f.nombrePrograma || '').toLowerCase();
    return cliente.includes(termino) || mz.includes(termino) || lt.includes(termino) || programaNombre.includes(termino);
  }

  get totalContratos(): number {
    if (!this.data) return 0;
    return this.data.programas.reduce((sum, p) => sum + p.contratos.length, 0);
  }

  get totalLetras(): number {
    if (!this.data) return 0;
    return this.data.programas.reduce((sum, p) =>
      sum + p.contratos.reduce((s, f) => s + f.cantidadLetras, 0), 0);
  }

  /** Porcentaje ya pagado del contrato (verde en la barra de avance). */
  pctPagado(fila: FilaCuentaDTO): number {
    const total = (fila.montoPagado || 0) + (fila.montoPorCobrar || 0);
    if (total <= 0) return 0;
    return Math.min(100, Math.round(((fila.montoPagado || 0) / total) * 100));
  }

  /** Porcentaje pendiente de pago (rojo en la barra de avance). */
  pctPendiente(fila: FilaCuentaDTO): number {
    return Math.max(0, 100 - this.pctPagado(fila));
  }

  simbolo(moneda: string): string {
    return moneda === 'PEN' ? 'S/' : '$';
  }

  formatFecha(fecha: any): string {
    if (!fecha) return '—';
    if (Array.isArray(fecha) && fecha.length >= 3) {
      const [y, m, d] = fecha;
      return `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y}`;
    }
    const s = String(fecha);
    const match = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) return `${match[3]}/${match[2]}/${match[1]}`;
    return s;
  }
}