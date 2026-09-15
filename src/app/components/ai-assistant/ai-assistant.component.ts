import { Component, signal, ElementRef, ViewChild, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AiAssistantService } from '../../services/ai-assistant.service';

interface ChatMessage {
  tipo: 'usuario' | 'asistente';
  texto: string;
  fecha: Date;
  rutas?: { label: string; ruta: string }[];
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

  private readonly rutaLabels: Record<string, string> = {
    '/secretaria-menu/clientes': 'Ir a Clientes',
    '/secretaria-menu/contratos': 'Ir a Contratos',
    '/secretaria-menu/pagoletras': 'Ir a Pagos de Letras',
    '/secretaria-menu/separaciones': 'Ir a Separaciones',
    '/secretaria-menu/programas': 'Ir a Programas',
    '/secretaria-menu/vendedores': 'Ir a Vendedores',
    '/secretaria-menu/lotes': 'Ir a Lotes',
    '/secretaria-menu/parceleros': 'Ir a Parceleros',
    '/secretaria-menu/servicios-basicos/inscripciones': 'Ir a Inscripciones',
    '/secretaria-menu/servicios-basicos/inscripciones/pagos': 'Ir a Pagos de Inscripciones',
    '/secretaria-menu/servicios-basicos': 'Ir a Lectura de Medidor',
    '/secretaria-menu/servicios-basicos/listar': 'Ir a Recibos',
    '/secretaria-menu/reporte-ingresos': 'Ir a Reporte de Ingresos',
    '/secretaria-menu/reporte-egresos': 'Ir a Reporte de Egresos',
    '/secretaria-menu/reporte-caja': 'Ir a Reporte de Caja',
    '/secretaria-menu/historial-moras': 'Ir a Historial de Moras',
    '/secretaria-menu/contratos/reporte-mora': 'Ir a Gestion y Cobranza',
    '/secretaria-menu/letras-vencidas': 'Ir a Letras Vencidas',
    '/secretaria-menu/cuentas-por-cobrar': 'Ir a Cuentas por Cobrar',
    '/secretaria-menu/lotes/reporte': 'Ir a Lista de Lotes',
    '/secretaria-menu/mensajeria': 'Ir a Mensajeria',
    '/secretaria-menu/agenda': 'Ir a Agenda',
  };

  quickActions: QuickAction[] = [
    { label: 'Registrar cliente', icon: 'fa-user-plus', pregunta: 'Como registro un cliente?' },
    { label: 'Crear contrato', icon: 'fa-file-contract', pregunta: 'Como creo un contrato?' },
    { label: 'Registrar pago', icon: 'fa-money-bill-wave', pregunta: 'Como registro un pago de letra?' },
    { label: 'Generar letras', icon: 'fa-file-invoice-dollar', pregunta: 'Como genero letras de cambio?' },
    { label: 'Descargar comprobante', icon: 'fa-download', pregunta: 'Como descargo un comprobante?' },
    { label: 'Ver reportes', icon: 'fa-chart-bar', pregunta: 'Que reportes puedo ver?' },
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
        texto: 'Hola! Soy tu asistente virtual. En que puedo ayudarte? Puedes preguntarme como usar el sistema o elegir una de las opciones rapidas.',
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
        const { textoLimpio, rutas } = this.parsearRespuesta(response.respuesta);
        this.mensajes.push({
          tipo: 'asistente',
          texto: textoLimpio,
          fecha: new Date(),
          rutas: rutas.length > 0 ? rutas : undefined
        });
        this.cargando.set(false);
        this.shouldScroll = true;
      },
      error: () => {
        this.mensajes.push({
          tipo: 'asistente',
          texto: 'Lo siento, ocurrio un error al procesar tu pregunta. Intenta de nuevo.',
          fecha: new Date()
        });
        this.cargando.set(false);
        this.shouldScroll = true;
      }
    });
  }

  irARuta(ruta: string): void {
    this.router.navigate([ruta]);
  }

  onKeyPress(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.enviarMensaje();
    }
  }

  private parsearRespuesta(respuesta: string): { textoLimpio: string; rutas: { label: string; ruta: string }[] } {
    const rutas: { label: string; ruta: string }[] = [];
    const regex = /\[IR\](\/[^\s\]]+)/g;
    let match;

    while ((match = regex.exec(respuesta)) !== null) {
      const ruta = match[1];
      const label = this.rutaLabels[ruta] || `Ir a ${ruta.split('/').pop()}`;
      if (!rutas.find(r => r.ruta === ruta)) {
        rutas.push({ label, ruta });
      }
    }

    const textoLimpio = respuesta.replace(/\[IR\]\/[^\s\]]+/g, '').trim();

    return { textoLimpio, rutas };
  }

  private scrollToBottom(): void {
    if (this.messagesContainer) {
      const el = this.messagesContainer.nativeElement;
      el.scrollTop = el.scrollHeight;
    }
  }
}
