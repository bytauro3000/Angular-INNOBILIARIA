import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

// ✅ Interfaces
import { LoginRequest } from './interfaces/login-request';
import { LoginResponse } from './interfaces/login-response';
import { environment } from '../../environments/environment'; // Importamos el environment para usar la URL base

@Injectable({
  providedIn: 'root'
})
export class LoginService {
  private readonly URL_AUTH = `${environment.apiUrl}/api/auth/login`;
  constructor(private http: HttpClient) { }

  login(credentials: LoginRequest): Observable<LoginResponse> {
    // 👇 Importante: aquí no mandamos el token en el login
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });1

    return this.http.post<LoginResponse>(this.URL_AUTH, credentials, { headers });
  }
}

export type { LoginRequest, LoginResponse };
