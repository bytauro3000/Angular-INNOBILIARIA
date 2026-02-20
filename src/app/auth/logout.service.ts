// src/app/services/logout.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { TokenService } from './token.service';
import { Router } from '@angular/router';
import { Observable, of, tap, catchError } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class LogoutService {

  private apiUrl = `${environment.apiUrl}/api/auth/logout`;

  constructor(
    private http: HttpClient,
    private tokenService: TokenService,
    private router: Router
  ) { }

  /**
   * Ejecuta el logout en el servidor y limpia la sesión localmente
   */
  logout(): Observable<any> {
    const token = this.tokenService.getToken();

    if (!token) {
      this.clearSessionAndRedirect();
      return of(null);
    }

    // Usamos 'tap' para que, si la petición sale bien, limpie la sesión automáticamente
    return this.http.post(this.apiUrl, { token }, { responseType: 'text' as 'json' }).pipe(
      tap(() => this.clearSessionAndRedirect()),
      catchError((error) => {
        console.error('Error en logout global:', error);
        // Aunque falle el servidor (ej: token ya expirado), limpiamos localmente por seguridad
        this.clearSessionAndRedirect();
        return of(null);
      })
    );
  }

  clearSessionAndRedirect(): void {
    this.tokenService.removeToken();
    // Aquí puedes limpiar otros elementos si usas localStorage directamente
    // localStorage.removeItem('user_data'); 
    this.router.navigate(['/login']);
  }
}