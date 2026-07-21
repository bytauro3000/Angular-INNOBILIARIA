import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterOutlet } from '@angular/router';
import { jwtDecode } from 'jwt-decode';
import { TokenService } from '../../auth/token.service';
import { LogoutService } from '../../auth/logout.service';

@Component({
  selector: 'app-vendedor-menu',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterOutlet],
  templateUrl: './vendedor-menu.html',
  styleUrls: ['./vendedor-menu.scss']
})
export class VendedorMenuComponent implements OnInit {

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
        this.usuarioLogueado = {
          nombre: decodedToken.nombre,
          apellidos: decodedToken.apellidos
        };
      } catch (error) {
        this.usuarioLogueado = null;
      }
    }
  }

  onLogout(): void {
    this.logoutService.logout();
  }
}