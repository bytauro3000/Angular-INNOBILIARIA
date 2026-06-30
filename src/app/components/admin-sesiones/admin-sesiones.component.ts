import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminSesionesService, SesionResumenDTO } from '../../services/admin-sesiones.service';

@Component({
  selector: 'app-admin-sesiones',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-sesiones.html',
  styleUrls: ['./admin-sesiones.scss']
})
export class AdminSesionesComponent implements OnInit, OnDestroy {
  private readonly sesionesService = inject(AdminSesionesService);

  resumen?: SesionResumenDTO;
  cargando = true;
  error = false;
  private pollingId: ReturnType<typeof setInterval> | null = null;

  ngOnInit(): void {
    this.cargar();
    this.pollingId = setInterval(() => this.cargar(), 30000);
  }

  ngOnDestroy(): void {
    if (this.pollingId) {
      clearInterval(this.pollingId);
    }
  }

  cargar(): void {
    this.sesionesService.obtenerResumen().subscribe({
      next: (data) => {
        this.resumen = data;
        this.cargando = false;
        this.error = false;
      },
      error: () => {
        this.error = true;
        this.cargando = false;
      }
    });
  }

  trackBySesionId(_: number, s: any): number {
    return s.sesionId;
  }

  formatearFecha(fecha: string): string {
    return new Date(fecha).toLocaleString('es-PE');
  }

  tiempoDesde(fecha: string): string {
    const diff = Date.now() - new Date(fecha).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Ahora';
    if (mins < 60) return `Hace ${mins} min`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `Hace ${hrs}h ${mins % 60}m`;
    return `Hace ${Math.floor(hrs / 24)}d`;
  }

  get saludo(): string {
    const h = new Date().getHours();
    if (h < 12) return 'Buenos días';
    if (h < 18) return 'Buenas tardes';
    return 'Buenas noches';
  }
}
