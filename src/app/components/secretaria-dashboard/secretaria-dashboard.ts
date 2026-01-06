import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common'; // Necesario para componentes Standalone
import { DashboardService, DashboardData } from '../../services/dashboard.service';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts'; // 👈 Importación esencial

@Component({
  selector: 'app-secretaria-dashboard',
  standalone: true, // 👈 Define que es un componente independiente
  imports: [
    CommonModule, 
    BaseChartDirective // 👈 Habilita el uso de <canvas baseChart>
  ],
  templateUrl: './secretaria-dashboard.html',
  styleUrls: ['./secretaria-dashboard.css']
})
export class SecretariaDashboard implements OnInit {

  // Variables para las tarjetas
  totalLotes: number = 0;
  totalParceleros: number = 0;
  totalVendedores: number = 0;
  totalProgramas: number = 0;
  totalClientes: number = 0;

  // Configuración del Gráfico de Barras Apiladas
  public barChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false, // Permite controlar el tamaño desde el CSS
    scales: {
      x: { 
        stacked: true, // Apila las barras en el eje X
        grid: { display: false }
      },
      y: { 
        stacked: true, // Apila las barras en el eje Y
        beginAtZero: true 
      }
    },
    plugins: {
      legend: { 
        display: true, 
        position: 'bottom',
        labels: { usePointStyle: true, padding: 20 }
      },
      tooltip: { enabled: true }
    }
  };

  public barChartType: ChartType = 'bar';
  
  public barChartData: ChartData<'bar'> = {
    labels: [],
    datasets: [
      { data: [], label: 'Disponible', backgroundColor: '#2ecc71', hoverBackgroundColor: '#27ae60' },
      { data: [], label: 'Separado', backgroundColor: '#f1c40f', hoverBackgroundColor: '#f39c12' },
      { data: [], label: 'Vendido', backgroundColor: '#e74c3c', hoverBackgroundColor: '#c0392b' }
    ]
  };

  constructor(private dashboardService: DashboardService) { }

  ngOnInit(): void {
    this.cargarDatos();
  }

  cargarDatos() {
    this.dashboardService.getTotales().subscribe({
      next: (data: DashboardData) => {
        // Asignar totales a las tarjetas
        this.totalLotes = data.lotes;
        this.totalParceleros = data.parceleros;
        this.totalVendedores = data.vendedores;
        this.totalProgramas = data.programas;
        this.totalClientes = data.clientes;

        // Procesar datos para el gráfico de barras apiladas
        const nombresProgramas = Object.keys(data.graficoLotes);
        this.barChartData.labels = nombresProgramas;

        // Mapeo de datos por estado para cada programa
        this.barChartData.datasets[0].data = nombresProgramas.map(p => data.graficoLotes[p].Disponible || 0);
        this.barChartData.datasets[1].data = nombresProgramas.map(p => data.graficoLotes[p].Separado || 0);
        this.barChartData.datasets[2].data = nombresProgramas.map(p => data.graficoLotes[p].Vendido || 0);
      },
      error: (err) => {
        console.error('Error al cargar datos del dashboard:', err);
      }
    });
  }
}