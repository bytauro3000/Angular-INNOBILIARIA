import { Injectable } from '@angular/core';
import { jwtDecode } from 'jwt-decode';

@Injectable({
  providedIn: 'root'
})
export class TokenService {
  private readonly TOKEN_KEY = 'jwtToken';

  setToken(token: string): void {
    localStorage.removeItem('jwt_token');
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  removeToken(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem('jwt_token');
  }

  // Devuelve true si el token no existe o ya expiró.
  // Usa el campo "exp" del JWT (Unix timestamp en segundos).
  isTokenExpired(): boolean {
    const token = this.getToken();
    if (!token) return true;

    try {
      const decoded: { exp: number } = jwtDecode(token);
      const ahora = Math.floor(Date.now() / 1000); // segundos actuales
      return decoded.exp < ahora;
    } catch {
      // Token malformado → tratarlo como expirado
      return true;
    }
  }
}