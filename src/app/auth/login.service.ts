// src/app/auth/login/login.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

// ✅ Las interfaces que ya creaste en tu carpeta 'interfaces'
import { LoginRequest } from './interfaces/login-request';
import { LoginResponse } from './interfaces/login-response';

@Injectable({
  providedIn: 'root'
})
export class LoginService {
  private apiUrl = 'http://localhost:8080/api/auth/login';

  constructor(private http: HttpClient) { }

  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(this.apiUrl, credentials);
  }
}
// ✅ EXPORTA las interfaces para que otros módulos puedan acceder a ellas desde este servicio
export type { LoginRequest, LoginResponse };