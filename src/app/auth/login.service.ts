import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { LoginRequest } from './interfaces/login-request';
import { LoginResponse } from './interfaces/login-response';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class LoginService {

  private readonly URL_AUTH = `${environment.apiUrl}/api/auth/login`;

  constructor(private http: HttpClient) { }

  login(credentials: LoginRequest): Observable<LoginResponse> {

    return this.http.post<LoginResponse>(this.URL_AUTH, credentials);
  }
}

export type { LoginRequest, LoginResponse };