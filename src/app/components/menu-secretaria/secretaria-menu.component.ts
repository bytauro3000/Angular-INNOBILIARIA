import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterOutlet, Router } from '@angular/router';
import { TokenService } from '../../auth/token.service';
import { jwtDecode } from 'jwt-decode';
import { LogoutService } from '../../auth/logout.service';

type SubmenuKey = 'clientes' | 'contrato' | 'lotes' | 'servicios' | 'reportes';

@Component({
  selector: 'app-secretaria-menu',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterOutlet],
  templateUrl: './secretaria-menu.html',
  styleUrls: ['./secretaria-menu.scss']
})
export class SecretariaMenuComponent implements OnInit, OnDestroy {

    usuarioLogueado: any;
    isMenuOpen: boolean = false;
    isClientesSubmenuOpen: boolean = false;
    isContratoSubmenuOpen: boolean = false;
    isServiciosBasicosSubmenuOpen: boolean = false;
    isLotesSubmenuOpen: boolean = false;
    isReportesSubmenuOpen: boolean = false;
    isUserDropdownOpen: boolean = false;

    /** true si el dispositivo tiene puntero fino (mouse/trackpad) → usar hover */
    hasHoverSupport: boolean = false;
    private hoverCloseTimeout: any = null;

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

        this.hasHoverSupport = typeof window !== 'undefined'
            && window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    }

    ngOnDestroy(): void {
        if (this.hoverCloseTimeout) {
            clearTimeout(this.hoverCloseTimeout);
            this.hoverCloseTimeout = null;
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
        if (this.hasHoverSupport) return;
        this.isUserDropdownOpen = false;
        this.isContratoSubmenuOpen = false;
        this.isServiciosBasicosSubmenuOpen = false;
        this.isLotesSubmenuOpen = false;
        this.isReportesSubmenuOpen = false;
        this.isClientesSubmenuOpen = !this.isClientesSubmenuOpen;
    }

    toggleContratoSubmenu() {
        if (this.hasHoverSupport) return;
        this.isUserDropdownOpen = false;
        this.isClientesSubmenuOpen = false;
        this.isServiciosBasicosSubmenuOpen = false;
        this.isLotesSubmenuOpen = false;
        this.isReportesSubmenuOpen = false;
        this.isContratoSubmenuOpen = !this.isContratoSubmenuOpen;
    }

    toggleServiciosBasicosSubmenu() {
        if (this.hasHoverSupport) return;
        this.isUserDropdownOpen = false;
        this.isClientesSubmenuOpen = false;
        this.isContratoSubmenuOpen = false;
        this.isLotesSubmenuOpen = false;
        this.isReportesSubmenuOpen = false;
        this.isServiciosBasicosSubmenuOpen = !this.isServiciosBasicosSubmenuOpen;
    }

    toggleLotesSubmenu() {
        if (this.hasHoverSupport) return;
        this.isUserDropdownOpen = false;
        this.isClientesSubmenuOpen = false;
        this.isContratoSubmenuOpen = false;
        this.isServiciosBasicosSubmenuOpen = false;
        this.isReportesSubmenuOpen = false;
        this.isLotesSubmenuOpen = !this.isLotesSubmenuOpen;
    }

    toggleReportesSubmenu() {
        if (this.hasHoverSupport) return;
        this.isUserDropdownOpen = false;
        this.isClientesSubmenuOpen = false;
        this.isContratoSubmenuOpen = false;
        this.isServiciosBasicosSubmenuOpen = false;
        this.isLotesSubmenuOpen = false;
        this.isReportesSubmenuOpen = !this.isReportesSubmenuOpen;
    }

    /** Hover: abre el submenú y cierra los demás */
    onSubmenuEnter(submenu: SubmenuKey) {
        if (!this.hasHoverSupport) return;
        if (this.hoverCloseTimeout) {
            clearTimeout(this.hoverCloseTimeout);
            this.hoverCloseTimeout = null;
        }
        this.isClientesSubmenuOpen = false;
        this.isContratoSubmenuOpen = false;
        this.isServiciosBasicosSubmenuOpen = false;
        this.isLotesSubmenuOpen = false;
        this.isReportesSubmenuOpen = false;
        if (submenu === 'clientes') this.isClientesSubmenuOpen = true;
        else if (submenu === 'contrato') this.isContratoSubmenuOpen = true;
        else if (submenu === 'lotes') this.isLotesSubmenuOpen = true;
        else if (submenu === 'servicios') this.isServiciosBasicosSubmenuOpen = true;
        else if (submenu === 'reportes') this.isReportesSubmenuOpen = true;
    }

    /** Hover: programa el cierre para dar tiempo a entrar al submenú */
    onSubmenuLeave(submenu: SubmenuKey) {
        if (!this.hasHoverSupport) return;
        this.hoverCloseTimeout = setTimeout(() => {
            if (submenu === 'clientes') this.isClientesSubmenuOpen = false;
            else if (submenu === 'contrato') this.isContratoSubmenuOpen = false;
            else if (submenu === 'lotes') this.isLotesSubmenuOpen = false;
            else if (submenu === 'servicios') this.isServiciosBasicosSubmenuOpen = false;
            else if (submenu === 'reportes') this.isReportesSubmenuOpen = false;
            this.hoverCloseTimeout = null;
        }, 150);
    }

    /** Hover sobre el submenú abierto: cancela el cierre programado */
    onSubmenuContentEnter() {
        if (!this.hasHoverSupport) return;
        if (this.hoverCloseTimeout) {
            clearTimeout(this.hoverCloseTimeout);
            this.hoverCloseTimeout = null;
        }
    }

    toggleUserDropdown(event: Event) {
        event.stopPropagation();
        this.isClientesSubmenuOpen = false;
        this.isContratoSubmenuOpen = false;
        this.isServiciosBasicosSubmenuOpen = false;
        this.isLotesSubmenuOpen = false;
        this.isReportesSubmenuOpen = false;
        this.isUserDropdownOpen = !this.isUserDropdownOpen;
    }

    @HostListener('document:click', ['$event'])
    onClick(event: Event) {
        const target = event.target as HTMLElement;
        if (!target.closest('.has-submenu') && !target.closest('.menu-toggle') && !target.closest('.user-avatar-initial')) {
            this.isClientesSubmenuOpen = false;
            this.isContratoSubmenuOpen = false;
            this.isServiciosBasicosSubmenuOpen = false;
            this.isLotesSubmenuOpen = false;
            this.isReportesSubmenuOpen = false;
            this.isUserDropdownOpen = false;
        }
    }

    closeMenu() {
        this.isMenuOpen = false;
        this.isClientesSubmenuOpen = false;
        this.isContratoSubmenuOpen = false;
        this.isServiciosBasicosSubmenuOpen = false;
        this.isLotesSubmenuOpen = false;
        this.isReportesSubmenuOpen = false;
        this.isUserDropdownOpen = false;
    }

    onLogout(): void {
        this.logoutService.logout();
    }
}