import { Injectable } from '@angular/core';
import { TokenService } from './token.service';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class LogoutService {
  constructor(private tokenService: TokenService, private router: Router) { }

  logout(): void {
    this.tokenService.removeToken();
    this.router.navigate(['/login']);
  }
}