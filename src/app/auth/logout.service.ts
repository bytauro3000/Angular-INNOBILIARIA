import { Injectable } from '@angular/core';
import { TokenService } from './token.service';
import { Router } from '@angular/router';
import { LoginService } from './login.service';

@Injectable({
  providedIn: 'root'
})
export class LogoutService {
  constructor(
    private tokenService: TokenService,
    private router: Router,
    private loginService: LoginService
  ) { }

  logout(): void {
    const refreshToken = this.tokenService.getRefreshToken();
    if (refreshToken) {
      this.loginService.logout(refreshToken).subscribe({
        error: () => {}
      });
    }
    this.tokenService.removeToken();
    this.router.navigate(['/login']);
  }
}