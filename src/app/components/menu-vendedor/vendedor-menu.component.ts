import { Component, OnInit, HostListener } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { jwtDecode } from 'jwt-decode';
import { TokenService } from '../../auth/token.service';
import { LogoutService } from '../../auth/logout.service';

@Component({
  selector: 'app-vendedor-menu',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './vendedor-menu.html',
  styleUrls: ['./vendedor-menu.scss']
})
export class VendedorMenuComponent implements OnInit {

  sidebarColapsado = false;
  mobileAbierto = false;
  isMobile = false;
  usuarioLogueado: any;

  private readonly STORAGE_KEY = 'vendedor-sidebar-colapsado';

  constructor(
    private tokenService: TokenService,
    private logoutService: LogoutService
  ) {}

  ngOnInit(): void {
    const guardado = localStorage.getItem(this.STORAGE_KEY);
    this.sidebarColapsado = guardado === 'true';
    this.checkViewport();

    const token = this.tokenService.getToken();
    if (token) {
      try {
        const decodedToken: any = jwtDecode(token);
        this.usuarioLogueado = {
          nombre: decodedToken.nombre,
          apellidos: decodedToken.apellidos
        };
      } catch {
        this.usuarioLogueado = null;
      }
    }
  }

  @HostListener('window:resize')
  onResize(): void {
    this.checkViewport();
  }

  private checkViewport(): void {
    this.isMobile = window.innerWidth <= 768;
    if (this.isMobile) {
      this.mobileAbierto = false;
    }
  }

  toggleSidebar(): void {
    if (this.isMobile) {
      this.mobileAbierto = !this.mobileAbierto;
    } else {
      this.sidebarColapsado = !this.sidebarColapsado;
      localStorage.setItem(this.STORAGE_KEY, String(this.sidebarColapsado));
    }
  }

  cerrarSidebarMovil(): void {
    if (this.isMobile) {
      this.mobileAbierto = false;
    }
  }

  cerrarSesion(): void {
    this.logoutService.logout();
  }
}