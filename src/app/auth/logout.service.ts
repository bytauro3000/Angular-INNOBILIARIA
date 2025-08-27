// src/app/services/logout.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { TokenService } from './token.service';
import { Router } from '@angular/router';
import { Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LogoutService {
  private apiUrl = 'http://localhost:8080/api/auth/logout';

  constructor(
    private http: HttpClient,
    private tokenService: TokenService,
    private router: Router
  ) { }

  logout(): Observable<any> {
    const token = this.tokenService.getToken();
    if (token) {
      // ✅ Agregado: { responseType: 'text' as 'json' } para evitar el error de parsing
      // El 'as 'json'' es una solución temporal para un bug de tipado en Angular
      return this.http.post(this.apiUrl, { token }, { responseType: 'text' as 'json' });
    }
    
    return of(null);
  }

  clearSessionAndRedirect(): void {
    this.tokenService.removeToken();
    this.router.navigate(['/login']);
  }
}