import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DashboardService } from '../../services/dashboard.service';
import { DashboardData } from '../../models/dashboard.model';
import { IngresoDiarioDTO } from '../../dto/ingresodiario.dto';
import { obtenerFechaPeru } from '../../utils/fecha-peru';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-dashboard.html',
  styleUrls: ['./admin-dashboard.scss']
})
export class AdminDashboardComponent implements OnInit {

  totales?: DashboardData;
  ingresos?: IngresoDiarioDTO;
  cargandoTotales = true;
  cargandoIngresos = true;

  fechaSeleccionada: string = obtenerFechaPeru();
  horaActual: string = '';

  kpiCards: { key: keyof DashboardData; label: string; icon: string; color: string; }[] = [
    { key: 'clientes',    label: 'Clientes',    icon: 'fa-users',          color: 'blue'   },
    { key: 'lotes',       label: 'Lotes',       icon: 'fa-map-marked-alt', color: 'green'  },
    { key: 'vendedores',  label: 'Vendedores',  icon: 'fa-user-tie',       color: 'orange' },
    { key: 'programas',   label: 'Programas',   icon: 'fa-city',           color: 'cyan'   },
    { key: 'parceleros',  label: 'Parceleros',  icon: 'fa-hard-hat',       color: 'purple' }
  ];

  ingresosCards: { key: string; label: string; icon: string; color: string; }[] = [
    { key: 'totalPagoLetras',              label: 'Pagos Letras',    icon: 'fa-file-invoice-dollar', color: 'blue'   },
    { key: 'totalPagoMoras',               label: 'Pagos Moras',     icon: 'fa-exclamation-triangle',color: 'red'    },
    { key: 'totalPagoIniciales',           label: 'Pagos Iniciales', icon: 'fa-hand-holding-usd',    color: 'green'  },
    { key: 'totalInscripcionesServicios',  label: 'Servicios',       icon: 'fa-bolt',                color: 'cyan'   }
  ];

  constructor(private dashboardService: DashboardService) {}

  ngOnInit(): void {
    this.actualizarHora();
    setInterval(() => this.actualizarHora(), 60000);
    this.cargarTotales();
    this.cargarIngresosDiarios();
  }

  cargarTotales(): void {
    this.cargandoTotales = true;
    this.dashboardService.getTotales().subscribe({
      next: (data) => { this.totales = data; this.cargandoTotales = false; },
      error: () => { this.cargandoTotales = false; }
    });
  }

  cargarIngresosDiarios(): void {
    this.cargandoIngresos = true;
    this.dashboardService.getIngresosDiarios(this.fechaSeleccionada).subscribe({
      next: (data) => { this.ingresos = data; this.cargandoIngresos = false; },
      error: () => { this.cargandoIngresos = false; }
    });
  }

  onFechaChange(): void {
    this.cargarIngresosDiarios();
  }

  refrescar(): void {
    this.cargarTotales();
    this.cargarIngresosDiarios();
  }

  private actualizarHora(): void {
    this.horaActual = new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
  }

  get saludo(): string {
    const h = new Date().getHours();
    if (h < 12) return 'Buenos días';
    if (h < 18) return 'Buenas tardes';
    return 'Buenas noches';
  }

  getGraficoLotesKeys(): string[] {
    return this.totales ? Object.keys(this.totales.graficoLotes) : [];
  }

  getGraficoContratosKeys(): string[] {
    return this.totales ? Object.keys(this.totales.graficoContratos) : [];
  }

  getTotalLotesPrograma(programa: string): number {
    if (!this.totales) return 0;
    const g = this.totales.graficoLotes[programa];
    return (g.Disponible || 0) + (g.Separado || 0) + (g.Vendido || 0);
  }

  getTotalContratosPrograma(programa: string): number {
    if (!this.totales) return 0;
    const g = this.totales.graficoContratos[programa];
    return (g.CONTADO || 0) + (g.FINANCIADO || 0);
  }

  getPorcentaje(valor: number, total: number): number {
    return total > 0 ? Math.round((valor / total) * 100) : 0;
  }

  getPorcentajeIngreso(campo: string): number {
    if (!this.ingresos) return 0;
    const total = this.ingresos.totalGeneral || 0;
    const valor = (this.ingresos as any)[campo] || 0;
    return total > 0 ? Math.round((valor / total) * 100) : 0;
  }

  getCantidad(campo: string): number {
    if (!this.ingresos) return 0;
    const map: Record<string, string> = {
      'totalPagoLetras': 'cantidadPagoLetras',
      'totalPagoMoras': 'cantidadPagoMoras',
      'totalPagoIniciales': 'cantidadPagoIniciales',
      'totalInscripcionesServicios': 'cantidadInscripcionesServicios'
    };
    return (this.ingresos as any)[map[campo]] || 0;
  }

  getMonto(campo: string): number {
    if (!this.ingresos) return 0;
    return (this.ingresos as any)[campo] || 0;
  }

  getTotalRegistros(): number {
    if (!this.ingresos) return 0;
    return (this.ingresos.cantidadPagoLetras || 0)
         + (this.ingresos.cantidadPagoMoras || 0)
         + (this.ingresos.cantidadPagoIniciales || 0)
         + (this.ingresos.cantidadInscripcionesServicios || 0);
  }
}
