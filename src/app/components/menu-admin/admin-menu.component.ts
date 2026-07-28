import { Component, OnInit, HostListener } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule, AsyncPipe } from '@angular/common';
import { LogoutService } from '../../auth/logout.service';
import { ThemeService } from '../../services/theme.service';
import { EmpresaService } from '../../services/empresa.service';
import { EmpresaPublic } from '../../models/empresa.model';

@Component({
  selector: 'app-admin-menu',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, AsyncPipe],
  templateUrl: './admin-menu.html',
  styleUrls: ['./admin-menu.scss']
})
export class AdminMenuComponent implements OnInit {

  anulacionesExpandido = false;
  sidebarColapsado = false;
  mobileAbierto = false;
  isMobile = false;
  empresaData: EmpresaPublic | null = null;

  private readonly STORAGE_KEY = 'admin-sidebar-colapsado';

  constructor(
    private logoutService: LogoutService,
    protected themeSvc: ThemeService,
    private empresaService: EmpresaService
  ) { }

  ngOnInit(): void {
    this.empresaService.obtenerEmpresa().subscribe(e => this.empresaData = e);

    const guardado = localStorage.getItem(this.STORAGE_KEY);
    this.sidebarColapsado = guardado === 'true';
    this.checkViewport();
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
      if (this.sidebarColapsado) {
        this.anulacionesExpandido = false;
      }
    }
  }

  toggleAnulaciones(): void {
    if (this.sidebarColapsado) {
      this.sidebarColapsado = false;
      localStorage.setItem(this.STORAGE_KEY, 'false');
    }
    this.anulacionesExpandido = !this.anulacionesExpandido;
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
