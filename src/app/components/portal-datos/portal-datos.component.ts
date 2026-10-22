import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PortalService, PortalDatos } from '../../services/portal.service';

/** Ficha de datos personales del portal: SOLO LECTURA (DNI/teléfonos enmascarados). */
@Component({
  selector: 'app-portal-datos',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './portal-datos.html',
  styleUrls: ['./portal-datos.scss']
})
export class PortalDatosComponent implements OnInit {

  datos: PortalDatos | null = null;
  cargando = true;
  error: string | null = null;

  constructor(private portalService: PortalService) {}

  ngOnInit(): void {
    this.portalService.obtenerMisDatos().subscribe({
      next: (d) => { this.datos = d; this.cargando = false; },
      error: (err: any) => {
        this.error = err?.error?.message || 'No se pudo cargar sus datos.';
        this.cargando = false;
      }
    });
  }

  get nombreCompleto(): string {
    return [this.datos?.nombre, this.datos?.apellidos].filter(Boolean).join(' ').trim();
  }

  get ubicacion(): string {
    return [this.datos?.distrito, this.datos?.provincia, this.datos?.departamento]
      .filter(Boolean).join(', ');
  }
}
