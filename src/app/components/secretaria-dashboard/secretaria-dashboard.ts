import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { DashboardService } from '../../services/dashboard.service';
import { DashboardData } from '../../models/dashboard.model';
import { IngresoDiarioDTO } from '../../dto/ingresodiario.dto';
import { IngresoMensualDTO } from '../../dto/ingresomensual.dto';
import { ChartConfiguration, ChartData } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import { TipoCambioService } from '../../services/tipo-cambio.service';

@Component({
  selector: 'app-secretaria-dashboard',
  standalone: true,
  imports: [CommonModule, BaseChartDirective, RouterModule],
  templateUrl: './secretaria-dashboard.html',
  styleUrls: ['./secretaria-dashboard.scss'],
})
export class SecretariaDashboard implements OnInit {

  // ── Totales generales ──────────────────────────────────────────────────────
  totalLotes: number = 0;
  totalParceleros: number = 0;
  totalVendedores: number = 0;
  totalProgramas: number = 0;
  totalClientes: number = 0;
  totalContratos: number = 0;

  // ── Tipo de cambio ─────────────────────────────────────────────────────────
  tcCompra: number = 0;
  tcVenta: number = 0;
  tcCargando: boolean = true;
  mostrarModalTC: boolean = false;

  today: Date = new Date();

  // ── Ingresos diarios ───────────────────────────────────────────────────────
  ingresos: IngresoDiarioDTO | null = null;
  ingresosCargando: boolean = true;
  ingresosError: boolean = false;

  // ── Ingresos mensuales ─────────────────────────────────────────────────────
  ingresosMensuales: IngresoMensualDTO[] = [];
  ingresosMensualesCargando: boolean = true;

  // ── Gráficos ───────────────────────────────────────────────────────────────
  public barChartOptions: ChartConfiguration<'bar'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    elements: { bar: { borderRadius: 8 } },
    scales: {
      x: {
        stacked: true,
        grid: { display: false },
        ticks: { autoSkip: false, maxRotation: 0, minRotation: 0, font: { size: 10 } }
      },
      y: {
        stacked: true,
        beginAtZero: true,
        grid: { color: 'rgba(0,0,0,0.04)' },
        ticks: { precision: 0, stepSize: 1 }
      }
    },
    plugins: {
      legend: { position: 'bottom', labels: { usePointStyle: true, pointStyle: 'circle', padding: 20 } }
    }
  };

  public doughnutOptions: ChartConfiguration<'doughnut'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '70%',
    plugins: {
      legend: { position: 'bottom', labels: { usePointStyle: true, pointStyle: 'circle', padding: 15 } }
    }
  };

  public barChartData: ChartData<'bar'> = {
    labels: [],
    datasets: [
      { data: [], label: 'Disponible', backgroundColor: '#2ecc71' },
      { data: [], label: 'Separado',   backgroundColor: '#f1c40f' },
      { data: [], label: 'Vendido',    backgroundColor: '#e74c3c' }
    ]
  };

  public contractChartData: ChartData<'doughnut'> = {
    labels: ['Contado', 'Financiado'],
    datasets: [{ data: [], backgroundColor: ['#3498db', '#9b59b6'], hoverOffset: 15 }]
  };

  // ── Gráfico de Ingresos Mensuales — Comprobante ──────────────────────────
  public comprobanteChartOptions: ChartConfiguration<'line'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    elements: { line: { tension: 0.3 }, point: { radius: 3, hoverRadius: 5 } },
    scales: {
      x: { grid: { display: false }, ticks: { font: { size: 10 } } },
      y: {
        beginAtZero: true,
        grid: { color: 'rgba(0,0,0,0.04)' },
        ticks: { callback: (value) => '$ ' + value.toLocaleString('en-US') }
      }
    },
    plugins: {
      legend: { position: 'bottom', labels: { usePointStyle: true, pointStyle: 'circle', padding: 15, font: { size: 11 } } },
      tooltip: {
        callbacks: {
          beforeBody: (items) => {
            const idx = items[0].dataIndex;
            const datasets = items[0].chart.data.datasets;
            const total = datasets.reduce((sum, ds) => sum + (ds.data[idx] as number), 0);
            return 'Total del mes: $ ' + total.toLocaleString('en-US', { minimumFractionDigits: 2 });
          },
          label: (ctx) => {
            const idx = ctx.dataIndex;
            const datasets = ctx.chart.data.datasets;
            const total = datasets.reduce((sum, ds) => sum + (ds.data[idx] as number), 0);
            const pct = total > 0 ? ((ctx.raw as number) / total * 100) : 0;
            return ctx.dataset.label + ': $ ' + Number(ctx.raw).toLocaleString('en-US', { minimumFractionDigits: 2 }) + '  (' + pct.toFixed(0) + '%)';
          }
        }
      }
    }
  };

  public comprobanteChartData: ChartData<'line'> = {
    labels: [],
    datasets: [
      { data: [], label: 'Boleta', borderColor: '#3b82f6', backgroundColor: 'rgba(59, 130, 246, 0.15)', fill: true, tension: 0.3 },
      { data: [], label: 'Recibo', borderColor: '#f59e0b', backgroundColor: 'rgba(245, 158, 11, 0.15)', fill: true, tension: 0.3 }
    ]
  };

  // ── Gráfico de Ingresos Mensuales — Medio de Pago ─────────────────────────
  public medioPagoChartOptions: ChartConfiguration<'line'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    elements: { line: { tension: 0.3 }, point: { radius: 3, hoverRadius: 5 } },
    scales: {
      x: { grid: { display: false }, ticks: { font: { size: 10 } } },
      y: {
        beginAtZero: true,
        grid: { color: 'rgba(0,0,0,0.04)' },
        ticks: { callback: (value) => '$ ' + value.toLocaleString('en-US') }
      }
    },
    plugins: {
      legend: { position: 'bottom', labels: { usePointStyle: true, pointStyle: 'circle', padding: 15, font: { size: 11 } } },
      tooltip: {
        callbacks: {
          beforeBody: (items) => {
            const idx = items[0].dataIndex;
            const datasets = items[0].chart.data.datasets;
            const total = datasets.reduce((sum, ds) => sum + (ds.data[idx] as number), 0);
            return 'Total del mes: $ ' + total.toLocaleString('en-US', { minimumFractionDigits: 2 });
          },
          label: (ctx) => {
            const idx = ctx.dataIndex;
            const datasets = ctx.chart.data.datasets;
            const total = datasets.reduce((sum, ds) => sum + (ds.data[idx] as number), 0);
            const pct = total > 0 ? ((ctx.raw as number) / total * 100) : 0;
            return ctx.dataset.label + ': $ ' + Number(ctx.raw).toLocaleString('en-US', { minimumFractionDigits: 2 }) + '  (' + pct.toFixed(0) + '%)';
          }
        }
      }
    }
  };

  public medioPagoChartData: ChartData<'line'> = {
    labels: [],
    datasets: [
      { data: [], label: 'Efectivo', borderColor: '#10b981', backgroundColor: 'rgba(16, 185, 129, 0.15)', fill: true, tension: 0.3 },
      { data: [], label: 'Bancario', borderColor: '#8b5cf6', backgroundColor: 'rgba(139, 92, 246, 0.15)', fill: true, tension: 0.3 }
    ]
  };

  // ── Último mes disponible para resumen ────────────────────────────────────
  get ultimoMes(): IngresoMensualDTO | null {
    return this.ingresosMensuales.length > 0
      ? this.ingresosMensuales[this.ingresosMensuales.length - 1]
      : null;
  }

  constructor(
    private dashboardService: DashboardService,
    private router: Router,
    private tipoCambioService: TipoCambioService
  ) { }

  ngOnInit(): void {
    this.cargarDatos();
    this.cargarTipoCambio();
    this.cargarIngresosDiarios();
    this.cargarIngresosPorMes();
  }

  // ── Tipo de cambio ─────────────────────────────────────────────────────────

  cargarTipoCambio(): void {
    this.tcCargando = true;
    this.tipoCambioService.obtenerTipoCambio().subscribe({
      next: (tc) => {
        this.tcCompra   = tc.compra;
        this.tcVenta    = tc.venta;
        this.tcCargando = false;
      },
      error: () => {
        this.tcCompra   = 0;
        this.tcVenta    = 0;
        this.tcCargando = false;
      }
    });
  }

  abrirModalTC(): void  { this.mostrarModalTC = true; }
  cerrarModalTC(): void { this.mostrarModalTC = false; }

  // ── Ingresos diarios ───────────────────────────────────────────────────────

  cargarIngresosDiarios(): void {
    this.ingresosCargando = true;
    this.ingresosError    = false;
    this.dashboardService.getIngresosDiarios().subscribe({
      next: (data) => {
        this.ingresos         = data;
        this.ingresosCargando = false;
      },
      error: () => {
        this.ingresosError    = true;
        this.ingresosCargando = false;
      }
    });
  }

  // ── Ingresos mensuales ─────────────────────────────────────────────────────

  cargarIngresosPorMes(): void {
    this.ingresosMensualesCargando = true;
    this.dashboardService.getIngresosPorMes().subscribe({
      next: (data) => {
        this.ingresosMensuales = data;
        this.ingresosMensualesCargando = false;

        const labels = data.map(d => d.etiqueta);

        this.comprobanteChartData = {
          labels,
          datasets: [
            { data: data.map(d => d.totalBoleta), label: 'Boleta', borderColor: '#3b82f6', backgroundColor: 'rgba(59, 130, 246, 0.15)', fill: true, tension: 0.3 },
            { data: data.map(d => d.totalRecibo), label: 'Recibo', borderColor: '#f59e0b', backgroundColor: 'rgba(245, 158, 11, 0.15)', fill: true, tension: 0.3 }
          ]
        };

        this.medioPagoChartData = {
          labels,
          datasets: [
            { data: data.map(d => d.totalEfectivo), label: 'Efectivo', borderColor: '#10b981', backgroundColor: 'rgba(16, 185, 129, 0.15)', fill: true, tension: 0.3 },
            { data: data.map(d => d.totalBancario), label: 'Bancario', borderColor: '#8b5cf6', backgroundColor: 'rgba(139, 92, 246, 0.15)', fill: true, tension: 0.3 }
          ]
        };
      },
      error: () => {
        this.ingresosMensualesCargando = false;
      }
    });
  }

  /** Formatea un número como moneda USD con 2 decimales */
  formatearDolares(valor: number | undefined | null): string {
    if (valor == null) return '$ 0.00';
    return '$ ' + valor.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  // ── Navegación ─────────────────────────────────────────────────────────────

  irARuta(ruta: string): void {
    this.router.navigate([ruta]);
  }

  // ── Dashboard totales ──────────────────────────────────────────────────────

  private limpiarNombrePrograma(nombre: string): string {
    if (!nombre) return '';
    let resultado = nombre;
    const prefijos = [/Programa de Viv\. /i, /Programa de /i, /Asoc\. /i];
    prefijos.forEach(prefijo => { resultado = resultado.replace(prefijo, ''); });
    if (resultado.toLowerCase().includes(' de ')) {
      resultado = resultado.split(/ de /i)[0];
    }
    return resultado.trim();
  }

  cargarDatos(): void {
    this.dashboardService.getTotales().subscribe({
      next: (data: DashboardData) => {
        this.totalLotes      = data.lotes;
        this.totalParceleros = data.parceleros;
        this.totalVendedores = data.vendedores;
        this.totalProgramas  = data.programas;
        this.totalClientes   = data.clientes;
        this.totalContratos  = Object.values(data.graficoContratos).reduce(
          (acc, curr) => acc + (curr.CONTADO || 0) + (curr.FINANCIADO || 0), 0
        );

        const nombresOriginales = Object.keys(data.graficoLotes);
        const nombresLimpios    = nombresOriginales.map(n => this.limpiarNombrePrograma(n));

        this.barChartData = {
          labels: nombresLimpios,
          datasets: [
            { data: nombresOriginales.map(p => data.graficoLotes[p].Disponible || 0), label: 'Disponible', backgroundColor: '#2ecc71' },
            { data: nombresOriginales.map(p => data.graficoLotes[p].Separado   || 0), label: 'Separado',   backgroundColor: '#f1c40f' },
            { data: nombresOriginales.map(p => data.graficoLotes[p].Vendido    || 0), label: 'Vendido',    backgroundColor: '#e74c3c' }
          ]
        };

        const totalContado    = Object.values(data.graficoContratos).reduce((acc, curr) => acc + (curr.CONTADO    || 0), 0);
        const totalFinanciado = Object.values(data.graficoContratos).reduce((acc, curr) => acc + (curr.FINANCIADO || 0), 0);

        this.contractChartData = {
          labels: ['Contado', 'Financiado'],
          datasets: [{ data: [totalContado, totalFinanciado], backgroundColor: ['#3498db', '#9b59b6'], hoverOffset: 15 }]
        };
      },
      error: (err) => console.error('Error al cargar dashboard:', err)
    });
  }
}