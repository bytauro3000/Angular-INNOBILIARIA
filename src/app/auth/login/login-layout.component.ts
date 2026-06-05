import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { LoginComponent } from './login.component';

@Component({
  selector: 'app-login-layout',
  standalone: true,
  imports: [CommonModule, RouterLink, LoginComponent],
  templateUrl: './login-layout.component.html',
  styleUrls: ['./login-layout.component.scss']
})
export class LoginLayoutComponent {

  readonly anioActual = new Date().getFullYear();
  readonly telefonoLimpio = '51987891788';
  readonly whatsappUrl = `https://wa.me/${this.telefonoLimpio}?text=${encodeURIComponent('Hola, necesito ayuda con el acceso al sistema.')}`;

  // Logo optimizado para Cloudinary
  readonly logoBranding = 'https://res.cloudinary.com/dlgqaifrk/image/upload/f_auto,q_auto,w_280/v1773725974/logogrande_rfvxhu.png';
  readonly logoMobile = 'https://res.cloudinary.com/dlgqaifrk/image/upload/f_auto,q_auto,w_160/v1773725974/logogrande_rfvxhu.png';
}
