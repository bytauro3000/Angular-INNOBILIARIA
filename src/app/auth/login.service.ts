import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

// ✅ Interfaces
import { LoginRequest } from './interfaces/login-request';
import { LoginResponse } from './interfaces/login-response';

@Injectable({
  providedIn: 'root'
})
export class LoginService {
  private apiUrl = 'http://localhost:8081/api/auth/login';

  constructor(private http: HttpClient) { }

  login(credentials: LoginRequest): Observable<LoginResponse> {
    // 👇 Importante: aquí no mandamos el token en el login
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });1

    return this.http.post<LoginResponse>(this.apiUrl, credentials, { headers });
  }
}

export type { LoginRequest, LoginResponse };
