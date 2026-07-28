import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-chat-widget',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat-widget.component.html',
  styleUrls: ['./chat-widget.component.scss']
})
export class ChatWidgetComponent {
  abierto = signal(false);
  paso = 1;
  enviando = false;
  enviado = false;
  captchaValido = false;

  form = {
    nombres: '',
    correo: '',
    mensaje: ''
  };

  private readonly API_URL = environment.apiUrl;

  constructor(private http: HttpClient) {}

  toggle(): void {
    this.abierto.update(v => !v);
  }

  onCaptchaChecked(checked: boolean): void {
    this.captchaValido = checked;
  }

  enviarMensaje(): void {
    if (!this.form.nombres.trim() || !this.form.mensaje.trim() || !this.captchaValido) return;
    if (this.enviando) return;

    this.enviando = true;
    this.http.post(`${this.API_URL}/api/mensajes/publico`, {
      nombres: this.form.nombres.trim(),
      correo: this.form.correo.trim(),
      contenido: this.form.mensaje.trim()
    }).subscribe({
      next: () => {
        this.enviado = true;
        this.enviando = false;
        setTimeout(() => {
          this.enviado = false;
          this.paso = 1;
          this.form = { nombres: '', correo: '', mensaje: '' };
          this.captchaValido = false;
        }, 3000);
      },
      error: () => {
        this.enviando = false;
      }
    });
  }

  reiniciar(): void {
    this.paso = 1;
    this.enviado = false;
    this.captchaValido = false;
    this.form = { nombres: '', correo: '', mensaje: '' };
  }
}
