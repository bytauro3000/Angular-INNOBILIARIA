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
                // 🟢 CORRECCIÓN: Guardamos el email (sub) para filtrar el chat
                this.usuarioLogueado = {
                    id: decodedToken.id,
                    nombre: decodedToken.nombre,
                    apellidos: decodedToken.apellidos,
                    email: decodedToken.sub 
                };
            } catch (error) {
                console.error('Error decodificando el token:', error);
            }
        }
    }

    ngAfterViewInit(): void {
        this.iniciarChatbotWatson();
    }
    
    private iniciarChatbotWatson(): void {
        if (typeof window !== 'undefined') {
            (window as any).watsonAssistantChatOptions = {
                integrationID: "5a403860-67f9-4209-9e46-0f398360d94f", 
                region: "au-syd", 
                serviceInstanceID: "2e434f7d-6653-4ff7-a72e-02261f84c63d",
                onLoad: async (instance: any) => { await instance.render(); }
            };
            setTimeout(() => {
                const t = document.createElement('script');
                t.src = "https://web-chat.global.assistant.watson.appdomain.cloud/versions/" + ((window as any).watsonAssistantChatOptions.clientVersion || 'latest') + "/WatsonAssistantChatEntry.js";
                document.head.appendChild(t);
            });
        }
    }

    toggleMobileMenu() { this.isMenuOpen = !this.isMenuOpen; }
    toggleClientesSubmenu() { this.isContratoSubmenuOpen = false; this.isClientesSubmenuOpen = !this.isClientesSubmenuOpen; }
    toggleContratoSubmenu() { this.isClientesSubmenuOpen = false; this.isContratoSubmenuOpen = !this.isContratoSubmenuOpen; }

    @HostListener('document:click', ['$event'])
    onClick(event: Event) {
        const target = event.target as HTMLElement;
        if (!target.closest('.has-submenu') && !target.closest('.menu-toggle')) {
            this.isClientesSubmenuOpen = false;
            this.isContratoSubmenuOpen = false;
        }
    }

    closeMenu() {
        this.isMenuOpen = false;
        this.isClientesSubmenuOpen = false;
        this.isContratoSubmenuOpen = false;
    }

    onLogout(): void {
        this.logoutService.logout().subscribe({
            next: () => this.logoutService.clearSessionAndRedirect(),
            error: () => this.logoutService.clearSessionAndRedirect()
        });
    }
}