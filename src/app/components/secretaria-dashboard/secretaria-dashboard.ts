import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { DashboardService } from '../../services/dashboard.service';
import { DashboardData } from '../../models/dashboard.model';
import { ChartConfiguration, ChartData } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';

@Component({
  selector: 'app-secretaria-dashboard',
  standalone: true,
  imports: [CommonModule, BaseChartDirective, RouterModule],
  templateUrl: './secretaria-dashboard.html',
  styleUrls: ['./secretaria-dashboard.scss'],
})
export class SecretariaDashboard implements OnInit {
  // Totales para las tarjetas
  totalLotes: number = 0;
  totalParceleros: number = 0;
  totalVendedores: number = 0;
  totalProgramas: number = 0;
  totalClientes: number = 0;

  // CONFIGURACIÓN PARA BARRAS (Inventario)
  public barChartOptions: ChartConfiguration<'bar'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    elements: {
      bar: { borderRadius: 8 } 
    },
    scales: {
      x: { stacked: true, grid: { display: false } },
      y: { 
        stacked: true, 
        beginAtZero: true,
        grid: { color: 'rgba(0,0,0,0.04)' },
        ticks: { precision: 0, stepSize: 1 }
      }
    },
    plugins: {
      legend: { 
        position: 'bottom', 
        labels: { usePointStyle: true, pointStyle: 'circle', padding: 25 } 
      }
    }
  };

  // CONFIGURACIÓN PARA DONA (Contratos)
  public doughnutOptions: ChartConfiguration<'doughnut'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '70%', 
    plugins: {
      legend: { 
        position: 'bottom', 
        labels: { usePointStyle: true, pointStyle: 'circle', padding: 20 } 
      }
    }
  };

  // Datos de los gráficos
  public barChartData: ChartData<'bar'> = {
    labels: [],
    datasets: [
      { data: [], label: 'Disponible', backgroundColor: '#2ecc71' },
      { data: [], label: 'Separado', backgroundColor: '#f1c40f' },
      { data: [], label: 'Vendido', backgroundColor: '#e74c3c' }
    ]
  };

  public contractChartData: ChartData<'doughnut'> = {
    labels: ['Contado', 'Financiado'],
    datasets: [{ data: [], backgroundColor: ['#3498db', '#9b59b6'], hoverOffset: 15 }]
  };

  constructor(private dashboardService: DashboardService, private router: Router) { }

  ngOnInit(): void {
    this.cargarDatos();
  }

  irARuta(ruta: string): void {
    this.router.navigate([ruta]);
  }

  cargarDatos(): void {
    this.dashboardService.getTotales().subscribe({
      next: (data: DashboardData) => {
        this.totalLotes = data.lotes;
        this.totalParceleros = data.parceleros;
        this.totalVendedores = data.vendedores;
        this.totalProgramas = data.programas;
        this.totalClientes = data.clientes;

        // Procesar Gráfico de Lotes
        const nombres = Object.keys(data.graficoLotes);
        this.barChartData = {
          labels: nombres,
          datasets: [
            { data: nombres.map(p => data.graficoLotes[p].Disponible || 0), label: 'Disponible', backgroundColor: '#2ecc71' },
            { data: nombres.map(p => data.graficoLotes[p].Separado || 0), label: 'Separado', backgroundColor: '#f1c40f' },
            { data: nombres.map(p => data.graficoLotes[p].Vendido || 0), label: 'Vendido', backgroundColor: '#e74c3c' }
          ]
        };

        // Procesar Gráfico de Contratos (Dona)
        const totalContado = Object.values(data.graficoContratos).reduce((acc, curr) => acc + (curr.CONTADO || 0), 0);
        const totalFinanciado = Object.values(data.graficoContratos).reduce((acc, curr) => acc + (curr.FINANCIADO || 0), 0);

        this.contractChartData = {
          labels: ['Contado', 'Financiado'],
          datasets: [{ data: [totalContado, totalFinanciado], backgroundColor: ['#3498db', '#9b59b6'] }]
        };
      },
      error: (err) => console.error('Error al cargar dashboard:', err)
    });
  }
}