import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { EmpresaService } from '../../services/empresa.service';
import { EmpresaPublic } from '../../models/empresa.model';
import { PortalAuthService } from '../../auth/portal-auth.service';
import { TokenService } from '../../auth/token.service';
import { ThemeService } from '../../services/theme.service';
import { environment } from '../../../environments/environment';

declare const google: any;

/**
 * Login del PORTAL DEL CLIENTE con Google.
 * Flujo: config pública del backend → Google Identity Services (botón) →
 * credential → POST /api/auth/google → JWT (ROLE_CLIENTE) → /portal.
 */
@Component({
  selector: 'app-portal-login',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './portal-login.html',
  styleUrls: ['./portal-login.scss']
})
export class PortalLoginComponent implements OnInit, OnDestroy {

  @ViewChild('botonGoogle', { static: false }) botonGoogle?: ElementRef<HTMLDivElement>;

  empresaData: EmpresaPublic | null = null;
  isMerruic = environment.apiUrl.includes('ms-gateway-latest');
  cargando = true;
  error: string | null = null;

  private reintentosTimer?: ReturnType<typeof setInterval>;

  constructor(
    private empresaService: EmpresaService,
    private portalAuth: PortalAuthService,
    private tokenService: TokenService,
    private tema: ThemeService,
    private toastr: ToastrService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.empresaService.obtenerEmpresa().subscribe({
      next: (e) => this.empresaData = e,
      error: () => {}
    });

    // Ya es cliente y su token sigue vigente → al portal directo
    if (this.tokenService.getRole() === 'ROLE_CLIENTE' && !this.tokenService.isTokenExpired()) {
      this.router.navigate(['/portal']);
      return;
    }

    // El login siempre arranca en modo claro (la preferencia oscura se reactiva dentro del portal)
    this.tema.claro();

    this.portalAuth.obtenerConfig().subscribe({
      next: (config) => {
        if (!config.googleClientId) {
          this.cargando = false;
          this.error = 'El portal aún no está configurado. Consulte con la inmobiliaria.';
          return;
        }
        this.inicializarGoogle(config.googleClientId);
      },
      error: () => {
        this.cargando = false;
        this.error = 'No se pudo conectar con el servidor. Intente más tarde.';
      }
    });
  }

  ngOnDestroy(): void {
    if (this.reintentosTimer) clearInterval(this.reintentosTimer);
  }

  /** Espera (hasta ~6 s) a que el script de GIS cargue y renderiza el botón. */
  private inicializarGoogle(clientId: string): void {
    let intentos = 0;
    this.reintentosTimer = setInterval(() => {
      intentos++;
      const listo = typeof google !== 'undefined' && google?.accounts?.id;
      if (listo) {
        clearInterval(this.reintentosTimer);
        google.accounts.id.initialize({
          client_id: clientId,
          auto_select: false,
          callback: (respuesta: { credential: string }) => this.onCredential(respuesta.credential)
        });
        this.cargando = false;
        // El contenedor está tras un *ngIf: renderizar recién cuando Angular lo pinte
        this.renderizarBotonGoogle();
      } else if (intentos >= 20) {
        clearInterval(this.reintentosTimer);
        this.cargando = false;
        this.error = 'No se pudo cargar el acceso con Google. Recargue la página.';
      }
    }, 300);
  }

  /** Renderiza el botón de Google cuando su contenedor ya existe en el DOM. */
  private renderizarBotonGoogle(intentos = 0): void {
    const contenedor = this.botonGoogle?.nativeElement;
    if (contenedor) {
      const ancho = contenedor.clientWidth > 0
        ? Math.min(320, contenedor.clientWidth)
        : 320;
      google.accounts.id.renderButton(contenedor, {
        theme: 'outline',
        size: 'large',
        width: ancho,
        text: 'continue_with'
      });
      return;
    }
    if (intentos < 15) {
      setTimeout(() => this.renderizarBotonGoogle(intentos + 1), 150);
    } else {
      this.error = 'No se pudo mostrar el botón de Google. Recargue la página.';
    }
  }

  private onCredential(credential: string): void {
    this.cargando = true;
    this.error = null;
    this.portalAuth.loginConGoogle(credential).subscribe({
      next: (respuesta) => {
        this.tokenService.setToken(respuesta.token);
        this.cargando = false;
        this.router.navigate(['/portal']);
      },
      error: (err: any) => {
        this.cargando = false;
        const mensaje: string = err?.error?.message || 'No se pudo iniciar sesión. Intente de nuevo.';
        this.error = mensaje.toLowerCase().includes('no registrado')
          ? `${mensaje} Si esa no es su cuenta, vuelva a pulsar el botón de Google y elija "Usar otra cuenta".`
          : mensaje;
        this.deshabilitarAutoIngreso();
        this.toastr.warning(this.error, 'Portal del cliente');
      }
    });
  }

  /**
   * Tras un fallo (p. ej. correo no registrado), desactiva el ingreso automático
   * para que la próxima pulsación muestre el selector de cuentas de Google.
   */
  private deshabilitarAutoIngreso(): void {
    try {
      if (typeof google !== 'undefined' && google?.accounts?.id?.disableAutoSelect) {
        google.accounts.id.disableAutoSelect();
      }
    } catch {
      // GIS aún no cargado; sin efecto
    }
  }

  get nombreEmpresa(): string {
    return this.empresaData?.nombreComercial || (this.isMerruic ? 'MERRUIC' : 'Inmobiliaria Ivan');
  }

  get logoBranding(): string {
    const ivanFallback = 'https://res.cloudinary.com/dlgqaifrk/image/upload/f_auto,q_auto,w_280/v1773725974/logogrande_rfvxhu.png';
    const merruicFallback = 'https://res.cloudinary.com/dlgqaifrk/image/upload/f_auto,q_auto/v1785274320/ChatGPT%20Image%2028%20jul%202026%2C%2003_48_23%20p.m._1785274320104.png';
    return this.empresaData?.logoSmallUrl || this.empresaData?.logoUrl || (this.isMerruic ? merruicFallback : ivanFallback);
  }

  get anioActual(): number {
    return new Date().getFullYear();
  }
}
