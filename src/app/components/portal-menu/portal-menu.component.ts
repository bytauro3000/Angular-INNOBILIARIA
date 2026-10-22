import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { jwtDecode } from 'jwt-decode';
import { EmpresaService } from '../../services/empresa.service';
import { EmpresaPublic } from '../../models/empresa.model';
import { TokenService } from '../../auth/token.service';
import { ThemeService } from '../../services/theme.service';
import { environment } from '../../../environments/environment';

/**
 * Layout del PORTAL DEL CLIENTE: header de marca + navegación de solo lectura
 * + router-outlet para resumen / letras / datos.
 */
@Component({
  selector: 'app-portal-menu',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './portal-menu.html',
  styleUrls: ['./portal-menu.scss']
})
export class PortalMenuComponent implements OnInit {

  empresaData: EmpresaPublic | null = null;
  isMerruic = environment.apiUrl.includes('ms-gateway-latest');
  nombreCliente = '';
  menuAbierto = false;

  constructor(
    private empresaService: EmpresaService,
    private tokenService: TokenService,
    private themeService: ThemeService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.empresaService.obtenerEmpresa().subscribe({
      next: (e) => this.empresaData = e,
      error: () => {}
    });
    this.leerNombreDelToken();
  }

  private leerNombreDelToken(): void {
    const token = this.tokenService.getToken();
    if (!token) return;
    try {
      const decoded: { nombre?: string; apellidos?: string } = jwtDecode(token);
      this.nombreCliente = [decoded.nombre, decoded.apellidos].filter(Boolean).join(' ').trim();
    } catch {
      this.nombreCliente = '';
    }
  }

  toggleTema(): void {
    this.themeService.toggle();
  }

  cerrarSesion(): void {
    this.tokenService.removeToken();
    this.router.navigate(['/portal/login']);
  }

  get nombreEmpresa(): string {
    return this.empresaData?.nombreComercial || (this.isMerruic ? 'MERRUIC' : 'Inmobiliaria Ivan');
  }

  get logoBranding(): string {
    const ivanFallback = 'https://res.cloudinary.com/dlgqaifrk/image/upload/f_auto,q_auto,w_200/v1773725974/logogrande_rfvxhu.png';
    const merruicFallback = 'https://res.cloudinary.com/dlgqaifrk/image/upload/f_auto,q_auto/v1785274320/ChatGPT%20Image%2028%20jul%202026%2C%2003_48_23%20p.m._1785274320104.png';
    return this.empresaData?.logoSmallUrl || this.empresaData?.logoUrl || (this.isMerruic ? merruicFallback : ivanFallback);
  }
}
