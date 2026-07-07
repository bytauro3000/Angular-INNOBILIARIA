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

  getRole(): string | null {
    const token = this.getToken();
    if (!token) return null;
    try {
      const decoded: any = jwtDecode(token);
      return decoded.rol || null;
    } catch {
      return null;
    }
  }

  getExpiresAt(): number | null {
    const token = this.getToken();
    if (!token) return null;
    try {
      const decoded: { exp: number } = jwtDecode(token);
      return decoded.exp * 1000;
    } catch {
      return null;
    }
  }

  isTokenExpired(): boolean {
    const exp = this.getExpiresAt();
    return exp == null || exp < Date.now();
  }
}