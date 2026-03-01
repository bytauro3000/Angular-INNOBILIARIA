import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { jwtDecode } from 'jwt-decode';
import { TokenService } from '../../auth/token.service';
import { MensajeriaService } from '../../services/mensajeria.service';

@Component({
  selector: 'app-mensajeria',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './mensajeria.component.html',
  styleUrls: ['./mensajeria.component.scss']
})
export class MensajeriaComponent implements OnInit {
  
  usuarioLogueado: any = null; 
  trabajadores: any[] = [];
  mensajes: any[] = [];
  chatSeleccionado: any = null;
  nuevoMensaje: string = '';

  constructor(
    private mensajeriaService: MensajeriaService,
    private tokenService: TokenService
  ) {}

  ngOnInit(): void {
    this.cargarDatosSesion();
    this.obtenerUsuarios();
  }

  private cargarDatosSesion() {
  const token = this.tokenService.getToken();
  console.log('Token desde servicio:', token); // 👈 Esto mostrará el token o null
  if (token) {
    try {
      const decoded: any = jwtDecode(token);
      console.log('Token decodificado:', decoded); // 👈 Verás la estructura
      this.usuarioLogueado = { 
        id: decoded.id,        // Ajusta según lo que veas
        nombre: decoded.nombre || decoded.sub, 
        email: decoded.sub 
      };
    } catch (e) {
      console.error("Error al decodificar token", e);
    }
  } else {
    console.warn("No hay token almacenado");
  }
}

  obtenerUsuarios() {
    this.mensajeriaService.obtenerUsuarios().subscribe({
      next: (data) => {
        console.log('Usuarios recibidos:', data);
        this.trabajadores = data
          .filter(u => {
            // Filtra por rol exacto (asumiendo que viene como 'secretaria' o 'ROLE_SECRETARIA')
            const esSecretaria = u.rol?.toLowerCase().includes('secretaria');
            const noSoyYo = u.email !== this.usuarioLogueado?.email;
            return esSecretaria && noSoyYo;
          })
          .map(u => ({
            ...u,
            iniciales: this.generarIniciales(u.nombres || 'U'),
            online: true
          }));
      },
      error: (err) => console.error("Error al cargar usuarios:", err)
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
    this.mensajeriaService.obtenerHistorial(this.usuarioLogueado.id, trabajador.id)
      .subscribe({
        next: (res) => {
          // Mapear los mensajes para que tengan el campo 'texto'
          this.mensajes = res.map(m => ({
            ...m,
            texto: m.contenido,        // Asumiendo que el backend usa 'contenido'
            hora: this.formatearHora(m.fechaEnvio) // Formatea la fecha si existe
          }));
          this.autoScroll();
        },
        error: (err) => console.error("Error al obtener historial:", err)
      });
  }

  enviarMensaje() {
    if (!this.nuevoMensaje.trim() || !this.chatSeleccionado) return;
    
    const body = {
      contenido: this.nuevoMensaje,
      remitenteId: this.usuarioLogueado.id,
      destinatariosIds: [this.chatSeleccionado.id]
    };

    this.mensajeriaService.enviarMensaje(body).subscribe({
      next: (res: any) => {
        this.mensajes.push({
          ...res,
          texto: res.contenido,
          hora: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        });
        this.nuevoMensaje = '';
        this.autoScroll();
      },
      error: (err) => console.error("No se pudo enviar el mensaje:", err)
    });
  }

  private formatearHora(fecha: string): string {
    if (!fecha) return '';
    const d = new Date(fecha);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  autoScroll() {
    setTimeout(() => {
      const chat = document.querySelector('.message-history');
      if (chat) chat.scrollTop = chat.scrollHeight;
    }, 100);
  }
}