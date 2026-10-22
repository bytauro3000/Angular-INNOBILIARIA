import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { LoginResponse } from './interfaces/login-response';

/** Respuesta de /api/public/portal/config (pública, sin login). */
export interface PortalConfig {
  googleClientId: string | null;
}

/**
 * Login del PORTAL DEL CLIENTE con Google Identity Services.
 * El ID token de Google se verifica en el backend (/api/auth/google),
 * que emite el JWT propio del portal (ROLE_CLIENTE, 12 h).
 */
@Injectable({ providedIn: 'root' })
export class PortalAuthService {

  private readonly API = environment.apiUrl;

  constructor(private http: HttpClient) {}

  /** Config pública del portal (Google Client ID configurado en el backend). */
  obtenerConfig(): Observable<PortalConfig> {
    return this.http.get<PortalConfig>(`${this.API}/api/public/portal/config`);
  }

  /** Intercambia el credential de Google por el JWT del portal. */
  loginConGoogle(credential: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.API}/api/auth/google`, { credential });
  }
}
