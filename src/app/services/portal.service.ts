import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

// ── DTOs del portal (espejo del backend) ─────────────────────────────────────

export interface PortalDatos {
  nombre: string | null;
  apellidos: string | null;
  numDocEnmascarado: string | null;
  celularEnmascarado: string | null;
  telefonoEnmascarado: string | null;
  email: string | null;
  direccion: string | null;
  distrito: string | null;
  provincia: string | null;
  departamento: string | null;
  genero: string | null;
  estadoCivil: string | null;
  tipoCliente: string | null;
}

export interface PortalLetra {
  idLetra: number;
  idContrato: number;
  numeroLetra: string;
  fechaVencimiento: string;
  importe: number;
  saldoPendiente: number;
  estado: 'PENDIENTE' | 'PARCIAL' | 'PAGADA' | 'VENCIDA' | 'ANULADO';
  diasVencida: number;
  moraAcumulada: number;
}

export interface PortalContrato {
  idContrato: number;
  tipoContrato: string | null;
  estadoContrato: string | null;
  moneda: string;
  montoTotal: number;
  saldo: number | null;
  cantidadLetras: number | null;
  lote: string | null;
  letras: PortalLetra[];
  deudaTotal: number;
  deudaInmediata: number;
  moraInmediata: number;
  letrasPagadas: number;
  letrasVencidas: number;
  letrasProximas: number;
}

export interface PortalResumen {
  nombreCliente: string | null;
  contratos: PortalContrato[];
  deudaTotalUsd: number;
  deudaTotalPen: number;
  deudaInmediataUsd: number;
  deudaInmediataPen: number;
  moraInmediataUsd: number;
  moraInmediataPen: number;
  letrasPagadas: number;
  letrasVencidas: number;
  letrasProximas: number;
}

/**
 * API del portal del cliente (solo lectura, ROLE_CLIENTE).
 * La identidad la resuelve el backend desde el JWT; aquí no se mandan ids.
 */
@Injectable({ providedIn: 'root' })
export class PortalService {

  private readonly API = `${environment.apiUrl}/api/portal`;

  constructor(private http: HttpClient) {}

  obtenerMisDatos(): Observable<PortalDatos> {
    return this.http.get<PortalDatos>(`${this.API}/mis-datos`);
  }

  obtenerResumen(): Observable<PortalResumen> {
    return this.http.get<PortalResumen>(`${this.API}/resumen`);
  }

  obtenerLetras(): Observable<PortalContrato[]> {
    return this.http.get<PortalContrato[]>(`${this.API}/letras`);
  }
}
