import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { jwtDecode } from 'jwt-decode';
import { TokenService } from '../../auth/token.service';

@Component({
  selector: 'app-mensajeria',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './mensajeria.component.html',
  styleUrl: './mensajeria.component.scss'
})
export class MensajeriaComponent implements OnInit {
  
  /**
   * URL CORREGIDA: Apuntando a tu Gateway en Render.
   * Según tu YAML, las rutas /auth y /public se redirigen al monolito correctamente.
   */
  private readonly GATEWAY_URL = 'https://inmobiliariaivan.onrender.com/api'; 

  usuarioLogueado: any = null; 
  trabajadores: any[] = [];
  mensajes: any[] = [];
  chatSeleccionado: any = null;
  nuevoMensaje: string = '';

  constructor(
    private http: HttpClient, 
    private tokenService: TokenService
  ) {}

  ngOnInit(): void {
    this.cargarDatosSesion();
    this.obtenerUsuarios();
  }

  private cargarDatosSesion() {
    const token = this.tokenService.getToken();
    if (token) {
      try {
        const decoded: any = jwtDecode(token);
        // Usamos decoded.sub porque ahí suele venir el email/usuario en el JWT
        this.usuarioLogueado = { 
          id: decoded.id, 
          nombre: decoded.nombre, 
          email: decoded.sub 
        };
      } catch (e) {
        console.error("Error al decodificar token", e);
      }
    }
  }

  obtenerUsuarios() {
    // Llama a /api/auth/usuarios (Ruta definida en tu YAML para ms-monolito)
    this.http.get<any[]>(`${this.GATEWAY_URL}/auth/usuarios`).subscribe({
      next: (data) => {
        console.log("Lista de usuarios cargada:", data);
        this.trabajadores = data
          .filter(u => {
            // Filtro dinámico: busca el rol 'secretaria' en cualquier parte del objeto
            const infoUsuario = JSON.stringify(u).toLowerCase();
            const esSecretaria = infoUsuario.includes('secretaria');
            // Evita que el usuario logueado se vea a sí mismo en la lista
            const noSoyYo = u.email !== this.usuarioLogueado?.email;
            
            return esSecretaria && noSoyYo;
          })
          .map(u => ({
            ...u,
            iniciales: this.generarIniciales(u.nombre || 'U'),
            online: true
          }));
      },
      error: (err) => {
        console.error("Error de conexión al Gateway (Posible fallo de CORS):", err);
      }
    });
  }

  generarIniciales(nombre: string): string {
    if (!nombre) return '??';
    const partes = nombre.split(' ').filter(n => n.length > 0);
    if (partes.length >= 2) return (partes[0][0] + partes[1][0]).toUpperCase();
    return partes[0][0].toUpperCase();
  }

  seleccionarChat(trabajador: any) {
    this.chatSeleccionado = trabajador;
    // Llama a /api/public/mensajes (Ruta definida en tu YAML)
    this.http.get<any[]>(`${this.GATEWAY_URL}/public/mensajes/${this.usuarioLogueado.id}/${trabajador.id}`)
      .subscribe({
        next: (res) => {
          this.mensajes = res;
          this.autoScroll();
        },
        error: (err) => console.error("Error al obtener historial:", err)
      });
  }

  enviarMensaje() {
    if (!this.nuevoMensaje.trim() || !this.chatSeleccionado) return;
    
    const body = {
      texto: this.nuevoMensaje,
      emisorId: this.usuarioLogueado.id,
      receptorId: this.chatSeleccionado.id,
      fecha: new Date().toISOString()
    };

    // Endpoint POST a /api/public/mensajes
    this.http.post(`${this.GATEWAY_URL}/public/mensajes`, body).subscribe({
      next: (res: any) => {
        this.mensajes.push({
          ...res, 
          hora: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        });
        this.nuevoMensaje = '';
        this.autoScroll();
      },
      error: (err) => console.error("No se pudo enviar el mensaje:", err)
    });
  }

  autoScroll() {
    setTimeout(() => {
      const chat = document.querySelector('.message-history');
      if (chat) chat.scrollTop = chat.scrollHeight;
    }, 100);
  }
}