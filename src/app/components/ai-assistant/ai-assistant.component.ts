import { Component, signal, ElementRef, ViewChild, AfterViewChecked, OnDestroy } from '@angular/core';
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
export class AiAssistantComponent implements AfterViewChecked, OnDestroy {

  abierto = signal(false);
  cargando = signal(false);
  escuchando = signal(false);
  modoVoz = signal(false);
  hablando = signal(false);
  mensaje = '';
  mensajes: ChatMessage[] = [];

  @ViewChild('messagesContainer') private messagesContainer!: ElementRef;

  private shouldScroll = false;
  private recognition: any = null;
  private speechSupported = false;
  private ttsSupported = false;
  private utterance: any = null;

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
  ) {
    const w = window as any;

    // Speech Recognition (escuchar voz)
    this.speechSupported = !!(w.SpeechRecognition || w.webkitSpeechRecognition);
    if (this.speechSupported) {
      const SpeechRecognition = w.SpeechRecognition || w.webkitSpeechRecognition;
      this.recognition = new SpeechRecognition();
      this.recognition.lang = 'es-PE';
      this.recognition.interimResults = true;
      this.recognition.continuous = false;

      this.recognition.onresult = (event: any) => {
        let textoFinal = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          textoFinal += event.results[i][0].transcript;
        }
        this.mensaje = textoFinal;
        if (event.results[event.results.length - 1].isFinal) {
          this.escuchando.set(false);
          this.enviarMensaje();
        }
      };

      this.recognition.onerror = () => {
        this.escuchando.set(false);
      };

      this.recognition.onend = () => {
        this.escuchando.set(false);
      };
    }

    // Text-to-Speech (hablar respuesta)
    this.ttsSupported = !!w.speechSynthesis;
  }

  ngOnDestroy(): void {
    if (this.recognition) {
      this.recognition.abort();
    }
    if (this.ttsSupported) {
      window.speechSynthesis.cancel();
    }
  }

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
        texto: 'Hola! Soy tu asistente virtual. En que puedo ayudarte? Puedes escribir o usar el microfono para hablar.',
        fecha: new Date()
      });
    }
    if (!this.abierto()) {
      this.detenerTodo();
    }
  }

  // ─── Modo Voz ────────────────────────────────────────
  toggleModoVoz(): void {
    if (!this.speechSupported || !this.ttsSupported) {
      alert('Tu navegador no soporta reconocimiento de voz o sintesis de voz. Usa Chrome o Edge.');
      return;
    }
    if (this.modoVoz()) {
      this.detenerTodo();
    } else {
      this.modoVoz.set(true);
      this.iniciarDictado();
    }
  }

  // ─── Dictado (Speech-to-Text) ────────────────────────
  iniciarDictado(): void {
    if (!this.speechSupported || this.escuchando() || this.hablando() || this.cargando()) return;
    this.mensaje = '';
    try {
      this.recognition.start();
      this.escuchando.set(true);
    } catch (e) {
      // ya esta iniciado
    }
  }

  detenerDictado(): void {
    if (this.recognition) {
      this.recognition.stop();
    }
    this.escuchando.set(false);
  }

  // ─── Text-to-Speech (respuesta en voz alta) ──────────
  hablar(texto: string): void {
    if (!this.ttsSupported) return;

    window.speechSynthesis.cancel();

    // Limpiar texto de caracteres especiales para TTS
    const textoLimpio = texto
      .replace(/[\*_#`]/g, '')
      .replace(/\[IR\]\/[^\s\]]+/g, '')
      .replace(/\n+/g, '. ')
      .trim();

    this.utterance = new SpeechSynthesisUtterance(textoLimpio);
    this.utterance.lang = 'es-PE';
    this.utterance.rate = 1;
    this.utterance.pitch = 1;

    // Elegir voz en español si esta disponible
    const voces = window.speechSynthesis.getVoices();
    const vozES = voces.find(v => v.lang.startsWith('es')) || voces[0];
    if (vozES) {
      this.utterance.voice = vozES;
    }

    this.utterance.onstart = () => {
      this.hablando.set(true);
    };

    this.utterance.onend = () => {
      this.hablando.set(false);
      this.utterance = null;
      // En modo voz, auto-activar microfono despues de hablar
      if (this.modoVoz()) {
        setTimeout(() => this.iniciarDictado(), 300);
      }
    };

    this.utterance.onerror = () => {
      this.hablando.set(false);
      this.utterance = null;
      if (this.modoVoz()) {
        setTimeout(() => this.iniciarDictado(), 300);
      }
    };

    window.speechSynthesis.speak(this.utterance);
  }

  detenerHablar(): void {
    if (this.ttsSupported) {
      window.speechSynthesis.cancel();
    }
    this.hablando.set(false);
    this.utterance = null;
  }

  detenerTodo(): void {
    this.detenerDictado();
    this.detenerHablar();
    this.modoVoz.set(false);
  }

  // ─── Toggle microfono (modo manual) ──────────────────
  toggleDictado(): void {
    if (!this.speechSupported) {
      alert('Tu navegador no soporta reconocimiento de voz. Usa Chrome o Edge.');
      return;
    }
    if (this.escuchando()) {
      this.detenerDictado();
    } else {
      this.iniciarDictado();
    }
  }

  // ─── Enviar mensaje ──────────────────────────────────
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

        // En modo voz, leer la respuesta en voz alta
        if (this.modoVoz()) {
          this.hablar(textoLimpio);
        }
      },
      error: () => {
        const errorMsg = 'Lo siento, ocurrio un error al procesar tu pregunta. Intenta de nuevo.';
        this.mensajes.push({
          tipo: 'asistente',
          texto: errorMsg,
          fecha: new Date()
        });
        this.cargando.set(false);
        this.shouldScroll = true;

        if (this.modoVoz()) {
          this.hablar(errorMsg);
        }
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
