import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardService } from '../../services/dashboard.service';
import { DashboardData } from '../../models/dashboard.model';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';

@Component({
  selector: 'app-secretaria-dashboard',
  standalone: true,
  imports: [CommonModule, BaseChartDirective],
  templateUrl: './secretaria-dashboard.html',
  styleUrls: ['./secretaria-dashboard.scss'],
})
export class SecretariaDashboard implements OnInit {

  totalLotes: number = 0;
  totalParceleros: number = 0;
  totalVendedores: number = 0;
  totalProgramas: number = 0;
  totalClientes: number = 0;

  // ✅ Configuración corregida para evitar decimales en el eje Y
  public barChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: { stacked: true, grid: { display: false } },
      y: { 
        stacked: true, 
        beginAtZero: true,
        ticks: {
          precision: 0, // 👈 Fuerza a no mostrar decimales
          stepSize: 1   // 👈 Asegura que el salto sea de 1 en 1
        }
      }
    },
    plugins: {
      legend: { display: true, position: 'bottom', labels: { usePointStyle: true, padding: 20 } },
      tooltip: { enabled: true }
    }
  };

  public barChartType: ChartType = 'bar';
  
  public barChartData: ChartData<'bar'> = {
    labels: [],
    datasets: [
      { data: [], label: 'Disponible', backgroundColor: '#2ecc71' },
      { data: [], label: 'Separado', backgroundColor: '#f1c40f' },
      { data: [], label: 'Vendido', backgroundColor: '#e74c3c' }
    ]
  };

  public contractChartData: ChartData<'bar'> = {
    labels: [],
    datasets: [
      { data: [], label: 'Contado', backgroundColor: '#3498db' },
      { data: [], label: 'Financiado', backgroundColor: '#9b59b6' }
    ]
  };

  constructor(private dashboardService: DashboardService) { }

  ngOnInit(): void {
    this.cargarDatos();
  }

  cargarDatos() {
    this.dashboardService.getTotales().subscribe({
      next: (data: DashboardData) => {
        this.totalLotes = data.lotes;
        this.totalParceleros = data.parceleros;
        this.totalVendedores = data.vendedores;
        this.totalProgramas = data.programas;
        this.totalClientes = data.clientes;

        const programasLotes = Object.keys(data.graficoLotes);
        this.barChartData = {
          labels: programasLotes,
          datasets: [
            { data: programasLotes.map(p => data.graficoLotes[p].Disponible || 0), label: 'Disponible', backgroundColor: '#2ecc71' },
            { data: programasLotes.map(p => data.graficoLotes[p].Separado || 0), label: 'Separado', backgroundColor: '#f1c40f' },
            { data: programasLotes.map(p => data.graficoLotes[p].Vendido || 0), label: 'Vendido', backgroundColor: '#e74c3c' }
          ]
        };

        const programasContratos = Object.keys(data.graficoContratos);
        this.contractChartData = {
          labels: programasContratos,
          datasets: [
            { data: programasContratos.map(p => data.graficoContratos[p].CONTADO || 0), label: 'Contado', backgroundColor: '#3498db' },
            { data: programasContratos.map(p => data.graficoContratos[p].FINANCIADO || 0), label: 'Financiado', backgroundColor: '#9b59b6' }
          ]
        };
      }
    });
  }
}