import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class TokenService {
  private readonly TOKEN_KEY = 'jwtToken'; // Única clave oficial

  setToken(token: string): void {
    // Limpiamos CUALQUIER variante para evitar los dos tokens de tu imagen
    localStorage.removeItem('jwt_token'); 
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  removeToken(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem('jwt_token'); // Limpieza preventiva
  }
}