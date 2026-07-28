import { Injectable, OnDestroy } from '@angular/core';
import { Client, IMessage } from '@stomp/stompjs';
import { Subject, Observable } from 'rxjs';
import { Mensaje } from '../models/mensajeria.models';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class WebSocketService implements OnDestroy {
  private client: Client;
  private mensajesSubject = new Subject<Mensaje>();
  private connectedSubject = new Subject<boolean>();
  private emailUsuario = '';

  mensajes$: Observable<Mensaje> = this.mensajesSubject.asObservable();
  connected$: Observable<boolean> = this.connectedSubject.asObservable();

  constructor() {
    this.client = new Client();
    this.client.brokerURL = `${environment.wsUrl}/chat-ws`;
    this.client.reconnectDelay = 5000;
    this.client.heartbeatIncoming = 10000;
    this.client.heartbeatOutgoing = 10000;
  }

  conectar(email: string): void {
    if (this.client.active || !email) return;
    this.emailUsuario = email;

    this.client.onConnect = () => {
      this.connectedSubject.next(true);
      this.client.subscribe(`/usuario/${this.emailUsuario}/privado/mensajes`, (message: IMessage) => {
        try {
          const mensaje: Mensaje = JSON.parse(message.body);
          this.mensajesSubject.next(mensaje);
        } catch {
          console.error('Error al parsear mensaje WebSocket');
        }
      });
    };

    this.client.onDisconnect = () => this.connectedSubject.next(false);
    this.client.onStompError = () => this.connectedSubject.next(false);
    this.client.activate();
  }

  desconectar(): void {
    if (this.client.active) {
      this.client.deactivate();
    }
  }

  enviarMensaje(remitenteId: number, destinatariosIds: number[], contenido: string): void {
    if (!this.client.connected) return;
    this.client.publish({
      destination: '/backend/enviar',
      body: JSON.stringify({ remitenteId, destinatariosIds, contenido })
    });
  }

  estaConectado(): boolean {
    return this.client.connected;
  }

  ngOnDestroy(): void {
    this.desconectar();
  }
}