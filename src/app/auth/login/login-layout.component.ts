import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { LoginComponent } from './login.component';
import { EmpresaService } from '../../services/empresa.service';
import { EmpresaPublic } from '../../models/empresa.model';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-login-layout',
  standalone: true,
  imports: [CommonModule, RouterLink, LoginComponent],
  templateUrl: './login-layout.component.html',
  styleUrls: ['./login-layout.component.scss']
})
export class LoginLayoutComponent implements OnInit {

  readonly anioActual = new Date().getFullYear();
  empresaData: EmpresaPublic | null = null;
  isMerruic = environment.apiUrl.includes('ms-gateway-latest');

  constructor(private empresaService: EmpresaService) {}

  ngOnInit(): void {
    this.empresaService.obtenerEmpresa().subscribe(e => this.empresaData = e);
  }

  get telefonoLimpio(): string {
    return this.empresaData?.whatsapp?.replace(/[^\d]/g, '') || '51987891788';
  }

  get whatsappUrl(): string {
    const num = this.telefonoLimpio;
    return `https://wa.me/${num}?text=${encodeURIComponent('Hola, necesito ayuda con el acceso al sistema.')}`;
  }

  get logoBranding(): string {
    return this.empresaData?.logoSmallUrl || this.empresaData?.logoUrl || 'https://res.cloudinary.com/dlgqaifrk/image/upload/f_auto,q_auto,w_280/v1773725974/logogrande_rfvxhu.png';
  }

  get logoMobile(): string {
    return this.empresaData?.logoSmallUrl || this.empresaData?.logoUrl || 'https://res.cloudinary.com/dlgqaifrk/image/upload/f_auto,q_auto,w_160/v1773725974/logogrande_rfvxhu.png';
  }
}
