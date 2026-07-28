import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { EmpresaService } from '../../services/empresa.service';
import { EmpresaPublic } from '../../models/empresa.model';
import { TokenService } from '../../auth/token.service';
import { LogoutService } from '../../auth/logout.service';
import { jwtDecode } from 'jwt-decode';

@Component({
  selector: 'app-seleccion-menu',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './seleccion-menu.component.html',
  styleUrls: ['./seleccion-menu.component.scss']
})
export class SeleccionMenuComponent implements OnInit {
  empresaData: EmpresaPublic | null = null;
  usuarioNombre: string = '';

  constructor(
    private router: Router,
    private empresaService: EmpresaService,
    private tokenService: TokenService,
    private logoutService: LogoutService
  ) {}

  ngOnInit(): void {
    this.empresaService.obtenerEmpresa().subscribe(e => this.empresaData = e);
    const token = this.tokenService.getToken();
    if (token) {
      try {
        const decoded: any = jwtDecode(token);
        this.usuarioNombre = decoded.nombre || '';
      } catch {}
    }
  }

  irASecretaria(): void {
    this.router.navigate(['/secretaria-menu']);
  }

  irASoporte(): void {
    this.router.navigate(['/soporte-menu']);
  }

  cerrarSesion(): void {
    this.logoutService.logout();
  }
}
