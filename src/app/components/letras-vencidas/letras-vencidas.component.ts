import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReporteMoraService } from '../../services/reporte-mora.service';
import { ReporteClientesMoraDTO, FilaClienteMora } from '../../dto/reporte-mora.dto';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-letras-vencidas',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './letras-vencidas.html',
  styleUrls: ['./letras-vencidas.scss']
})
export class LetrasVencidasComponent implements OnInit {

  grupos: ReporteClientesMoraDTO[] = [];
  cargando = true;

  /** Referencia a la pestaña de WhatsApp Web abierta por este botón (para reutilizarla). */
  private whatsappWindow: Window | null = null;

  constructor(
    private reporteMoraService: ReporteMoraService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.cargarLetrasVencidas();
  }

  cargarLetrasVencidas(): void {
    this.cargando = true;
    this.reporteMoraService.obtenerClientesLetrasVencidas().subscribe({
      next: (data) => {
        this.grupos = data.map(grupo => ({
          ...grupo,
          clientes: [...grupo.clientes].sort((a, b) => {
            const mzA = a.manzanas?.[0] ?? '';
            const mzB = b.manzanas?.[0] ?? '';
            const mzCmp = mzA.localeCompare(mzB);
            if (mzCmp !== 0) return mzCmp;
            return this.parseLote(a.numeroLotes?.[0]) - this.parseLote(b.numeroLotes?.[0]);
          })
        }));
        this.cargando = false;
      },
      error: () => {
        this.toastr.error('Error al cargar las letras vencidas', 'Error');
        this.cargando = false;
      }
    });
  }

  get totalClientes(): number {
    return this.grupos.reduce((sum, g) => sum + g.clientes.length, 0);
  }

  get totalImporte(): number {
    return this.grupos.reduce((sum, g) =>
      sum + g.clientes.reduce((s, f) => s + (f.importeTotal ?? 0), 0), 0);
  }

  /** Convierte "02", "10", "A3" → número para ordenar correctamente */
  private parseLote(lote: string | undefined): number {
    const num = parseInt((lote ?? '').replace(/\D/g, ''), 10);
    return isNaN(num) ? 0 : num;
  }

  simbolo(moneda: string): string {
    return moneda === 'USD' ? '$' : 'S/';
  }

  /** "19/120" → 19 */
  numeroLetra(numeroLetra: string): string {
    if (!numeroLetra) return '';
    return numeroLetra.includes('/') ? numeroLetra.split('/')[0].trim() : numeroLetra.trim();
  }

  formatArea(area: number | undefined): string {
    if (area === null || area === undefined) return '—';
    return `${Number(area).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} m²`;
  }

  /**
   * Construye el saludo según la hora actual de Perú:
   * <12 → Buenos días, 12–18 → Buenas tardes, >18 → Buenas noches.
   */
  private saludoSegunHora(): string {
    const hora = Number(new Intl.DateTimeFormat('es-PE', {
      hour: '2-digit',
      hour12: false,
      timeZone: 'America/Lima'
    }).format(new Date()));
    if (hora < 12) return 'Buenos días';
    if (hora < 19) return 'Buenas tardes';
    return 'Buenas noches';
  }

  /**
   * Abre WhatsApp Web con el mensaje precargado para el cliente.
   * El número se normaliza al prefijo 51 (Perú).
   */
  abrirWhatsapp(fila: FilaClienteMora): void {
    if (!fila.celular) {
      this.toastr.warning(`El cliente "${fila.nombreClientes}" no tiene celular registrado`, 'WhatsApp');
      return;
    }
    const celular = fila.celular.replace(/\D/g, '');
    const celularLimpio = celular.startsWith('51') ? celular : '51' + celular;
    if (celularLimpio === '51' || celularLimpio.match(/^510+$/)) {
      this.toastr.warning(`El celular de "${fila.nombreClientes}" no es válido`, 'WhatsApp');
      return;
    }

    const cantidad = fila.cantidadLetrasAtrasadas;
    const sustantivo = cantidad === 1 ? 'letra de cambio' : 'letras de cambio';
    const importe = `${this.simbolo(fila.moneda)} ${(fila.importeTotal ?? 0).toFixed(2)}`;

    const mensaje = `${this.saludoSegunHora()}, estimado cliente se le informa que a la fecha usted adeuda ` +
      `${cantidad} ${sustantivo} por un total de ${importe}. ` +
      `Por favor acercarse a oficina a regularizar su pago y evite generar intereses.`;

    const url = `https://web.whatsapp.com/send?phone=${celularLimpio}&text=${encodeURIComponent(mensaje)}`;

    // Si ya abrimos una pestaña de WhatsApp Web desde este botón y sigue abierta,
    // la reutilizamos (navega al chat nuevo y la trae al frente). Si no existe
    // o fue cerrada, se abre una nueva con el nombre fijo "WhatsAppWeb".
    if (this.whatsappWindow && !this.whatsappWindow.closed) {
      this.whatsappWindow.location.href = url;
      this.whatsappWindow.focus();
    } else {
      this.whatsappWindow = window.open(url, 'WhatsAppWeb');
      this.whatsappWindow?.focus();
    }
  }
}