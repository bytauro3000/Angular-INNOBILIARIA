import { Component, signal, ElementRef, ViewChild, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AiAssistantService } from '../../services/ai-assistant.service';

interface ChatMessage {
  tipo: 'usuario' | 'asistente';
  texto: string;
  fecha: Date;
}

interface QuickAction {
  label: string;
  icon: string;
  pregunta: string;
}

@Component({
  selector: 'app-ai-assistant',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ai-assistant.component.html',
  styleUrls: ['./ai-assistant.component.scss']
})
export class AiAssistantComponent implements AfterViewChecked {

  abierto = signal(false);
  cargando = signal(false);
  mensaje = '';
  mensajes: ChatMessage[] = [];

  @ViewChild('messagesContainer') private messagesContainer!: ElementRef;

  private shouldScroll = false;

  quickActions: QuickAction[] = [
    { label: 'Registrar cliente', icon: 'fa-user-plus', pregunta: '¿Cómo registro un cliente?' },
    { label: 'Crear contrato', icon: 'fa-file-contract', pregunta: '¿Cómo creo un contrato?' },
    { label: 'Registrar pago', icon: 'fa-money-bill-wave', pregunta: '¿Cómo registro un pago de letra?' },
    { label: 'Descargar comprobante', icon: 'fa-download', pregunta: '¿Cómo descargo un comprobante?' },
    { label: 'Ver reportes', icon: 'fa-chart-bar', pregunta: '¿Qué reportes puedo ver?' },
  ];

  constructor(
    private aiService: AiAssistantService,
    private router: Router
  ) {}

  ngAfterViewChecked(): void {
    if (this.shouldScroll) {
      this.scrollToBottom();
      this.shouldScroll = false;
    }
  }

  toggle(): void {
    this.abierto.update(v => !v);
    if (this.abierto() && this.mensajes.length === 0) {
      this.mensajes.push({
        tipo: 'asistente',
        texto: '¡Hola! Soy tu asistente virtual. ¿En qué puedo ayudarte? Puedes preguntarme cómo usar el sistema o elegir una de las opciones rápidas.',
        fecha: new Date()
      });
    }
  }

  enviarMensaje(texto?: string): void {
    const textoAEnviar = texto || this.mensaje.trim();
    if (!textoAEnviar || this.cargando()) return;

    this.mensajes.push({
      tipo: 'usuario',
      texto: textoAEnviar,
      fecha: new Date()
    });

    this.mensaje = '';
    this.cargando.set(true);
    this.shouldScroll = true;

    this.aiService.consultar(textoAEnviar).subscribe({
      next: (response) => {
        this.mensajes.push({
          tipo: 'asistente',
          texto: response.respuesta,
          fecha: new Date()
        });
        this.cargando.set(false);
        this.shouldScroll = true;
      },
      error: () => {
        this.mensajes.push({
          tipo: 'asistente',
          texto: 'Lo siento, ocurrió un error al procesar tu pregunta. Intenta de nuevo.',
          fecha: new Date()
        });
        this.cargando.set(false);
        this.shouldScroll = true;
      }
    });
  }

  onKeyPress(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.enviarMensaje();
    }
  }

  private scrollToBottom(): void {
    if (this.messagesContainer) {
      const el = this.messagesContainer.nativeElement;
      el.scrollTop = el.scrollHeight;
    }
  }
}
