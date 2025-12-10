import { Component, OnInit, AfterViewInit, HostListener } from '@angular/core'; // ✅ Importa AfterViewInit
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
export class SecretariaMenuComponent implements OnInit, AfterViewInit { // ✅ Implementa AfterViewInit

    usuarioLogueado: any;
    
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

    // ✅ NUEVO HOOK: Se ejecuta después de que el componente y su vista están cargados.
    ngAfterViewInit(): void {
        this.iniciarChatbotWatson();
    }
    
    // ✅ Función para inyectar el script del chatbot
    private iniciarChatbotWatson(): void {
        // 1. Define las opciones de configuración global (watsonAssistantChatOptions)
        if (typeof window !== 'undefined') {
            (window as any).watsonAssistantChatOptions = {
                integrationID: "5a403860-67f9-4209-9e46-0f398360d94f", 
                region: "au-syd", 
                serviceInstanceID: "2e434f7d-6653-4ff7-a72e-02261f84c63d",
                onLoad: async (instance: any) => { 
                    await instance.render(); 
                }
            };
        }

        // 2. Inyecta el script de carga de Watson en el <head>
        // Esto es la traducción del bloque <script> original.
        setTimeout(function(){
            const t=document.createElement('script');
            t.src="https://web-chat.global.assistant.watson.appdomain.cloud/versions/" + ((window as any).watsonAssistantChatOptions.clientVersion || 'latest') + "/WatsonAssistantChatEntry.js";
            document.head.appendChild(t);
        });
    }

    toggleClientesSubmenu() {
        this.isContratoSubmenuOpen = false;
        this.isClientesSubmenuOpen = !this.isClientesSubmenuOpen;
    }

    toggleContratoSubmenu() {
        this.isClientesSubmenuOpen = false;
        this.isContratoSubmenuOpen = !this.isContratoSubmenuOpen;
    }

    @HostListener('document:click', ['$event'])
    onClick(event: Event) {
        const target = event.target as HTMLElement;
        if (!target.closest('.has-submenu')) {
            this.isClientesSubmenuOpen = false;
            this.isContratoSubmenuOpen = false;
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