import { Component, OnInit, AfterViewInit, HostListener } from '@angular/core';
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
export class SecretariaMenuComponent implements OnInit, AfterViewInit {

    usuarioLogueado: any;
    isMenuOpen: boolean = false;
    isClientesSubmenuOpen: boolean = false;
    isContratoSubmenuOpen: boolean = false;
    isServiciosBasicosSubmenuOpen: boolean = false; // <-- NUEVA VARIABLE
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

    ngAfterViewInit(): void {
        this.iniciarChatbotWatson();
    }

    // Retorna solo la primera palabra del nombre
    getFirstName(fullName: string): string {
        return fullName ? fullName.trim().split(' ')[0] : '';
    }

    // Asigna un color fijo segun el nombre para el avatar
   getAvatarColor(name: string): string {
        if (!name) return '#ff9800'; // Naranja por defecto si falla el nombre
        
        const colors = [
            '#9c27b0', // Morado
            '#673ab7', // Indigo
            '#3f51b5', // Azul oscuro
            '#2196f3', // Azul claro
            '#009688', // Verde azulado
            '#4caf50', // Verde
            '#ff9800', // Naranja
            '#e91e63', // Rosa
            '#f44336'  // Rojo
        ];
        
        let hash = 0;
        for (let i = 0; i < name.length; i++) {
            // Operacion de bit a bit segura para generar un hash estable
            hash = name.charCodeAt(i) + ((hash << 5) - hash);
        }
        
        // Se fuerza un valor absoluto para evitar indices negativos en el array
        let index = Math.abs(hash) % colors.length;
        return colors[index];
    }
    private iniciarChatbotWatson(): void {
        if (typeof window !== 'undefined') {
            (window as any).watsonAssistantChatOptions = {
                integrationID: "5a403860-67f9-4209-9e46-0f398360d94f", 
                region: "au-syd", 
                serviceInstanceID: "2e434f7d-6653-4ff7-a72e-02261f84c63d",
                onLoad: async (instance: any) => { await instance.render(); }
            };
        }
        setTimeout(function(){
            const t=document.createElement('script');
            t.src="https://web-chat.global.assistant.watson.appdomain.cloud/versions/" + ((window as any).watsonAssistantChatOptions.clientVersion || 'latest') + "/WatsonAssistantChatEntry.js";
            document.head.appendChild(t);
        });
    }

    toggleMobileMenu() {
        this.isMenuOpen = !this.isMenuOpen;
    }

    toggleClientesSubmenu() {
        this.isUserDropdownOpen = false;
        this.isContratoSubmenuOpen = false;
        this.isServiciosBasicosSubmenuOpen = false; // <-- Cerrar servicios básicos
        this.isClientesSubmenuOpen = !this.isClientesSubmenuOpen;
    }

    toggleContratoSubmenu() {
        this.isUserDropdownOpen = false;
        this.isClientesSubmenuOpen = false;
        this.isServiciosBasicosSubmenuOpen = false; // <-- Cerrar servicios básicos
        this.isContratoSubmenuOpen = !this.isContratoSubmenuOpen;
    }

    toggleServiciosBasicosSubmenu() { // <-- NUEVO MÉTODO
        this.isUserDropdownOpen = false;
        this.isClientesSubmenuOpen = false;
        this.isContratoSubmenuOpen = false;
        this.isServiciosBasicosSubmenuOpen = !this.isServiciosBasicosSubmenuOpen;
    }

    toggleUserDropdown(event: Event) {
        event.stopPropagation();
        this.isClientesSubmenuOpen = false;
        this.isContratoSubmenuOpen = false;
        this.isServiciosBasicosSubmenuOpen = false; // <-- Cerrar servicios básicos
        this.isUserDropdownOpen = !this.isUserDropdownOpen;
    }

    @HostListener('document:click', ['$event'])
    onClick(event: Event) {
        const target = event.target as HTMLElement;
        if (!target.closest('.has-submenu') && !target.closest('.menu-toggle') && !target.closest('.user-avatar-initial')) {
            this.isClientesSubmenuOpen = false;
            this.isContratoSubmenuOpen = false;
            this.isServiciosBasicosSubmenuOpen = false; // <-- Cerrar servicios básicos
            this.isUserDropdownOpen = false;
        }
    }

    closeMenu() {
        this.isMenuOpen = false;
        this.isClientesSubmenuOpen = false;
        this.isContratoSubmenuOpen = false;
        this.isServiciosBasicosSubmenuOpen = false; // <-- Cerrar servicios básicos
        this.isUserDropdownOpen = false;
    }

    onLogout(): void {
        this.logoutService.logout();
    }
}