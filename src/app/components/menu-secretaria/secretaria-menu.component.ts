import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterOutlet, Router } from '@angular/router';
import { TokenService } from '../../auth/token.service';
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
    isMenuOpen: boolean = false;
    isClientesSubmenuOpen: boolean = false;
    isContratoSubmenuOpen: boolean = false;
    isServiciosBasicosSubmenuOpen: boolean = false;
    isUserDropdownOpen: boolean = false;

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
                    apellidos: decodedToken.apellidos,
                    email: decodedToken.sub || decodedToken.email
                };
            } catch (error) {
                console.error('Error decodificando el token:', error);
                this.usuarioLogueado = null;
            }
        }
    }

    getFirstName(fullName: string): string {
        return fullName ? fullName.trim().split(' ')[0] : '';
    }

    getAvatarColor(name: string): string {
        if (!name) return '#ff9800';
        const colors = [
            '#9c27b0', '#673ab7', '#3f51b5', '#2196f3', '#009688',
            '#4caf50', '#ff9800', '#e91e63', '#f44336'
        ];
        let hash = 0;
        for (let i = 0; i < name.length; i++) {
            hash = name.charCodeAt(i) + ((hash << 5) - hash);
        }
        let index = Math.abs(hash) % colors.length;
        return colors[index];
    }

    toggleMobileMenu() {
        this.isMenuOpen = !this.isMenuOpen;
    }

    toggleClientesSubmenu() {
        this.isUserDropdownOpen = false;
        this.isContratoSubmenuOpen = false;
        this.isServiciosBasicosSubmenuOpen = false;
        this.isClientesSubmenuOpen = !this.isClientesSubmenuOpen;
    }

    toggleContratoSubmenu() {
        this.isUserDropdownOpen = false;
        this.isClientesSubmenuOpen = false;
        this.isServiciosBasicosSubmenuOpen = false;
        this.isContratoSubmenuOpen = !this.isContratoSubmenuOpen;
    }

    toggleServiciosBasicosSubmenu() {
        this.isUserDropdownOpen = false;
        this.isClientesSubmenuOpen = false;
        this.isContratoSubmenuOpen = false;
        this.isServiciosBasicosSubmenuOpen = !this.isServiciosBasicosSubmenuOpen;
    }

    toggleUserDropdown(event: Event) {
        event.stopPropagation();
        this.isClientesSubmenuOpen = false;
        this.isContratoSubmenuOpen = false;
        this.isServiciosBasicosSubmenuOpen = false;
        this.isUserDropdownOpen = !this.isUserDropdownOpen;
    }

    @HostListener('document:click', ['$event'])
    onClick(event: Event) {
        const target = event.target as HTMLElement;
        if (!target.closest('.has-submenu') && !target.closest('.menu-toggle') && !target.closest('.user-avatar-initial')) {
            this.isClientesSubmenuOpen = false;
            this.isContratoSubmenuOpen = false;
            this.isServiciosBasicosSubmenuOpen = false;
            this.isUserDropdownOpen = false;
        }
    }

    closeMenu() {
        this.isMenuOpen = false;
        this.isClientesSubmenuOpen = false;
        this.isContratoSubmenuOpen = false;
        this.isServiciosBasicosSubmenuOpen = false;
        this.isUserDropdownOpen = false;
    }

    onLogout(): void {
        this.logoutService.logout();
    }
}