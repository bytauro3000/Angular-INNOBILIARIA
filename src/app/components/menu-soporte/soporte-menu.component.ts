import { Component, OnInit, HostListener } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { jwtDecode } from 'jwt-decode';
import { TokenService } from '../../auth/token.service';
import { LogoutService } from '../../auth/logout.service';
import { EmpresaService } from '../../services/empresa.service';
import { EmpresaPublic } from '../../models/empresa.model';

@Component({
  selector: 'app-soporte-menu',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './soporte-menu.html',
  styleUrls: ['./soporte-menu.scss']
})
export class SoporteMenuComponent implements OnInit {

  sidebarColapsado = false;
  mobileAbierto = false;
  isMobile = false;
  usuarioLogueado: any;
  empresaData: EmpresaPublic | null = null;

  private readonly STORAGE_KEY = 'soporte-sidebar-colapsado';

  constructor(
    private tokenService: TokenService,
    private logoutService: LogoutService,
    private empresaService: EmpresaService
  ) { }

  ngOnInit(): void {
    this.empresaService.obtenerEmpresa().subscribe(e => this.empresaData = e);

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
