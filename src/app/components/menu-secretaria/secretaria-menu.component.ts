import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterOutlet, Router } from '@angular/router';
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
  
  isClientesSubmenuOpen: boolean = false;
  isProveedoresSubmenuOpen: boolean = false;

  constructor(
    private tokenService: TokenService,
    private logoutService: LogoutService,
    private router: Router
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
        console.error('Error decodificando el token:', error);
        this.usuarioLogueado = null;
      }
    }
  }

  toggleClientesSubmenu() {
    this.isProveedoresSubmenuOpen = false;
    this.isClientesSubmenuOpen = !this.isClientesSubmenuOpen;
  }

  toggleProveedoresSubmenu() {
    this.isClientesSubmenuOpen = false;
    this.isProveedoresSubmenuOpen = !this.isProveedoresSubmenuOpen;
  }

  @HostListener('document:click', ['$event'])
  onClick(event: Event) {
    const target = event.target as HTMLElement;
    if (!target.closest('.has-submenu')) {
      this.isClientesSubmenuOpen = false;
      this.isProveedoresSubmenuOpen = false;
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