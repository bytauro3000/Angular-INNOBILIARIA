import { Component, OnInit, OnDestroy, ViewChild, ElementRef, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { jwtDecode } from 'jwt-decode';
import { Subscription } from 'rxjs';
import { TokenService } from '../../auth/token.service';
import { MensajeriaService } from '../../services/mensajeria.service';
import { WebSocketService } from '../../services/websocket.service';
import { NotificationSoundService } from '../../services/notification-sound.service';
import { UsuarioChat, Mensaje, MensajeDTO } from '../../models/mensajeria.models';

@Component({
  selector: 'app-mensajeria',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './mensajeria.component.html',
  styleUrls: ['./mensajeria.component.scss']
})
export class MensajeriaComponent implements OnInit, OnDestroy {
  @ViewChild('messageContainer') messageContainer!: ElementRef;

  usuarioLogueado: { id: number; email: string; nombre: string; apellidos: string } | null = null;
  contactos: UsuarioChat[] = [];
  contactosFiltrados: UsuarioChat[] = [];
  mensajes: Mensaje[] = [];
  chatSeleccionado: UsuarioChat | null = null;
  nuevoMensaje = '';
  busqueda = '';
  conectado = false;
  cargandoHistorial = false;

  private subs: Subscription[] = [];
  private mensajesMap = new Map<number, Mensaje[]>();

  constructor(
    private mensajeriaService: MensajeriaService,
    private tokenService: TokenService,
    private wsService: WebSocketService,
    private soundService: NotificationSoundService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.cargarSesion();
    this.conectarWebSocket();
    this.cargarContactos();

    this.subs.push(
      this.wsService.mensajes$.subscribe(mensaje => this.onMensajeRecibido(mensaje))
    );

    this.subs.push(
      this.wsService.connected$.subscribe(conectado => {
        this.conectado = conectado;
      })
    );
  }

  ngOnDestroy(): void {
    this.subs.forEach(s => s.unsubscribe());
    this.wsService.desconectar();
  }

  private cargarSesion(): void {
    const token = this.tokenService.getToken();
    if (token) {
      try {
        const decoded: any = jwtDecode(token);
        this.usuarioLogueado = {
          id: decoded.id,
          email: decoded.sub || '',
          nombre: decoded.nombre || '',
          apellidos: decoded.apellidos || ''
        };
      } catch {
        console.error('Error al decodificar token');
      }
    }
  }

  private conectarWebSocket(): void {
    if (this.usuarioLogueado?.email) {
      this.wsService.conectar(this.usuarioLogueado.email);
    }
  }

  private cargarContactos(): void {
    this.mensajeriaService.obtenerUsuarios().subscribe({
      next: (usuarios) => {
        console.log('Usuarios recibidos:', usuarios);
        const userId = this.usuarioLogueado?.id;
        console.log('Mi ID:', userId);
        this.contactos = usuarios
          .filter(u => u.id !== userId)
          .map(u => ({
            ...u,
            iniciales: this.generarIniciales(u.nombres, u.apellidos),
            online: false,
            noLeidos: 0
          }));
        this.aplicarFiltro();
      },
      error: (err) => {
        console.error('Error al cargar contactos:', err);
      }
    });
  }

  private generarIniciales(nombres: string, apellidos: string): string {
    const n = (nombres || ' ').trim().charAt(0).toUpperCase();
    const a = (apellidos || ' ').trim().charAt(0).toUpperCase();
    return n + a;
  }

  private aplicarFiltro(): void {
    if (!this.busqueda.trim()) {
      this.contactosFiltrados = [...this.contactos];
    } else {
      const q = this.busqueda.toLowerCase().trim();
      this.contactosFiltrados = this.contactos.filter(c =>
        `${c.nombres} ${c.apellidos}`.toLowerCase().includes(q) ||
        c.rol?.toLowerCase().includes(q)
      );
    }
  }

  onBusquedaChange(): void {
    this.aplicarFiltro();
  }

  seleccionarChat(contacto: UsuarioChat): void {
    if (this.chatSeleccionado?.id === contacto.id) return;
    this.chatSeleccionado = contacto;
    this.mensajes = [];
    this.cargandoHistorial = true;
    contacto.noLeidos = 0;

    const userId = this.usuarioLogueado!.id;
    this.mensajeriaService.obtenerHistorial(userId, contacto.id).subscribe({
      next: (historial) => {
        this.mensajes = historial;
        this.mensajesMap.set(contacto.id, historial);
        this.cargandoHistorial = false;
        this.autoScroll();
      },
      error: () => {
        this.cargandoHistorial = false;
      }
    });
  }

  enviarMensaje(): void {
    if (!this.nuevoMensaje.trim() || !this.chatSeleccionado || !this.usuarioLogueado) return;

    const contenido = this.nuevoMensaje.trim();
    const remitenteId = this.usuarioLogueado.id;
    const destinatarioId = this.chatSeleccionado.id;

    if (this.conectado) {
      this.wsService.enviarMensaje(remitenteId, [destinatarioId], contenido);
    } else {
      const body: MensajeDTO = { remitenteId, destinatariosIds: [destinatarioId], contenido };
      this.mensajeriaService.enviarMensaje(body).subscribe();
    }

    const msgTemp: Mensaje = {
      id: Date.now(),
      remitenteId,
      destinatarioId,
      contenido,
      fecha: new Date().toISOString(),
      estado: 'ENVIADO'
    };
    this.mensajes.push(msgTemp);
    this.nuevoMensaje = '';
    this.autoScroll();
  }

  private onMensajeRecibido(mensaje: Mensaje): void {
    const userId = this.usuarioLogueado?.id;

    if (mensaje.destinatarioId === userId || mensaje.remitenteId === userId) {
      const otroId = mensaje.remitenteId === userId ? mensaje.destinatarioId : mensaje.remitenteId;

      if (this.chatSeleccionado?.id === otroId) {
        const existe = this.mensajes.find(m => m.id === mensaje.id);
        if (!existe) {
          this.mensajes.push(mensaje);
          this.autoScroll();
        }
      } else {
        const contacto = this.contactos.find(c => c.id === otroId);
        if (contacto) {
          contacto.noLeidos = (contacto.noLeidos || 0) + 1;
          contacto.ultimoMsj = mensaje.contenido;
          contacto.ultimaFecha = mensaje.fecha;
        }
      }

      if (mensaje.remitenteId !== userId) {
        this.soundService.playMessageReceived();
      }
    }
  }

  formatearFecha(fecha: string): string {
    if (!fecha) return '';
    const d = new Date(fecha);
    const hoy = new Date();
    const diff = hoy.getTime() - d.getTime();
    const dias = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (dias === 0) {
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (dias === 1) {
      return 'Ayer';
    } else if (dias < 7) {
      const diasSemana = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
      return diasSemana[d.getDay()];
    } else {
      return d.toLocaleDateString([], { day: '2-digit', month: '2-digit' });
    }
  }

  getAvatarColor(nombre: string): string {
    if (!nombre) return '#0F766E';
    const colors = ['#0F766E', '#14B8A6', '#0369A1', '#7C3AED', '#D97706', '#DC2626', '#0891B2', '#4F46E5', '#9333EA'];
    let hash = 0;
    for (let i = 0; i < nombre.length; i++) hash = nombre.charCodeAt(i) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
  }

  formatearHoraMensaje(fecha: string): string {
    if (!fecha) return '';
    const d = new Date(fecha);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  obtenerRolLabel(rol: string): string {
    if (!rol) return 'Usuario';
    const mapa: Record<string, string> = {
      'ADMINISTRADOR': 'Admin',
      'SECRETARIA': 'Secretaría',
      'VENDEDOR': 'Vendedor',
      'SOPORTE': 'Soporte'
    };
    return mapa[rol.toUpperCase()] || rol;
  }

  private autoScroll(): void {
    setTimeout(() => {
      if (this.messageContainer) {
        this.messageContainer.nativeElement.scrollTop = this.messageContainer.nativeElement.scrollHeight;
      }
    }, 50);
  }
}
