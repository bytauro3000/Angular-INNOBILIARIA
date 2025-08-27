// src/app/soporte/soporte-menu/soporte-menu.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterOutlet } from '@angular/router';
import { jwtDecode } from 'jwt-decode';
import { TokenService } from '../../auth/token.service';
import { LogoutService } from '../../auth/logout.service';

@Component({
  selector: 'app-soporte-menu',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterOutlet],
  templateUrl: './soporte-menu.html',
  styleUrls: ['./soporte-menu.scss']
})
export class SoporteMenuComponent implements OnInit {

  usuarioLogueado: any;

  constructor(
    private tokenService: TokenService,
    private logoutService: LogoutService
  ) { }

  ngOnInit(): void {
    const token = this.tokenService.getToken();

    if (token) {
      try {
        const decodedToken: any = jwtDecode(token);
        
        console.log('Token decodificado:', decodedToken);
        
        this.usuarioLogueado = {
          nombre: decodedToken.nombre,
          apellidos: decodedToken.apellidos
        };
      } catch (error) {
        console.error('Error decodificando el token:', error);
        this.usuarioLogueado = null;
      }
    }
  }

  onLogout(): void {
    this.logoutService.logout().subscribe({
      next: () => {
        this.logoutService.clearSessionAndRedirect();
        console.log('Sesión cerrada correctamente en el backend.');
      },
      error: (err) => {
        console.error('Error al cerrar sesión en el backend:', err);
        this.logoutService.clearSessionAndRedirect();
      }
    });
  }
}