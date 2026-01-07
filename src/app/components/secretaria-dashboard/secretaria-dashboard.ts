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
  totalLotes: number = 0;
  totalParceleros: number = 0;
  totalVendedores: number = 0;
  totalProgramas: number = 0;
  totalClientes: number = 0;

  public barChartOptions: ChartConfiguration<'bar'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    elements: {
      bar: { borderRadius: 8 } 
    },
    scales: {
      x: { 
        stacked: true, 
        grid: { display: false },
        ticks: {
          autoSkip: false,
          maxRotation: 0,
          minRotation: 0,
          font: { size: 10 } 
        }
      },
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
        labels: { usePointStyle: true, pointStyle: 'circle', padding: 20 } 
      }
    }
  };

  public doughnutOptions: ChartConfiguration<'doughnut'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '70%', 
    plugins: {
      legend: { 
        position: 'bottom', 
        labels: { usePointStyle: true, pointStyle: 'circle', padding: 15 } 
      }
    }
  };

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

  // 🟢 Lógica de limpieza avanzada
  private limpiarNombrePrograma(nombre: string): string {
    if (!nombre) return '';

    let resultado = nombre;

    // 1. Eliminar prefijos comunes (Case Insensitive)
    const prefijos = [/Programa de Viv\. /i, /Programa de /i, /Asoc\. /i];
    prefijos.forEach(prefijo => {
      resultado = resultado.replace(prefijo, '');
    });

    // 2. Ahora que quitamos el inicio, buscamos el " de " que indica la ubicación
    // Ejemplo: "Los Claveles de Huacoy" -> buscamos el " de " después de "Los Claveles"
    if (resultado.toLowerCase().includes(' de ')) {
      // Dividimos y tomamos la primera parte
      resultado = resultado.split(/ de /i)[0];
    }

    return resultado.trim();
  }

  cargarDatos(): void {
    this.dashboardService.getTotales().subscribe({
      next: (data: DashboardData) => {
        this.totalLotes = data.lotes;
        this.totalParceleros = data.parceleros;
        this.totalVendedores = data.vendedores;
        this.totalProgramas = data.programas;
        this.totalClientes = data.clientes;

        const nombresOriginales = Object.keys(data.graficoLotes);
        
        // 🟢 Aplicamos la nueva limpieza avanzada
        const nombresLimpios = nombresOriginales.map(n => this.limpiarNombrePrograma(n));

        this.barChartData = {
          labels: nombresLimpios,
          datasets: [
            { data: nombresOriginales.map(p => data.graficoLotes[p].Disponible || 0), label: 'Disponible', backgroundColor: '#2ecc71' },
            { data: nombresOriginales.map(p => data.graficoLotes[p].Separado || 0), label: 'Separado', backgroundColor: '#f1c40f' },
            { data: nombresOriginales.map(p => data.graficoLotes[p].Vendido || 0), label: 'Vendido', backgroundColor: '#e74c3c' }
          ]
        };

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