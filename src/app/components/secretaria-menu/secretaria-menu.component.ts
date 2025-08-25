// src/app/secretaria/secretaria-menu/secretaria-menu.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterOutlet } from '@angular/router';
import { TokenService } from '../../services/token.service';
import { jwtDecode } from 'jwt-decode';
import { LogoutService } from '../../auth/logout.service';
@Component({
  selector: 'app-secretaria-menu',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterOutlet],
  templateUrl: './secretaria-menu.html',
  styleUrls: ['./secretaria-menu.scss']
})
export class SecretariaMenuComponent implements OnInit {

  usuarioLogueado: any;

  // ✅ Inyecta el LogoutService en el constructor
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

  // ✅ Método para manejar el cierre de sesión
  onLogout(): void {
    this.logoutService.logout().subscribe({
      next: () => {
        this.logoutService.clearSessionAndRedirect();
        console.log('Sesión cerrada correctamente en el backend.');
      },
      error: (err) => {
        console.error('Error al cerrar sesión en el backend:', err);
        // Aunque haya un error, siempre limpia la sesión del frontend
        this.logoutService.clearSessionAndRedirect();
      }
    });
  }
}