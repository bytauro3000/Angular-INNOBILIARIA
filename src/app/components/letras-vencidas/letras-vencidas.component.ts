import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReporteMoraService } from '../../services/reporte-mora.service';
import { ReporteClientesMoraDTO, FilaClienteMora, DetalleLetraVencida } from '../../dto/reporte-mora.dto';
import { ToastrService } from 'ngx-toastr';

// Nombre fijo de la ventana de WhatsApp Web. Al usar siempre el mismo nombre,
// el navegador reutiliza esa pestaña aunque la referencia JS se pierda
// (por ejemplo al navegar entre vistas).
const WHATSAPP_WEB_WINDOW_NAME = 'WhatsAppWeb';

// Referencia a nivel de módulo: sobrevive a la navegación entre vistas y a la
// recreación del componente. Mientras la pestaña siga abierta se reutiliza.
let whatsappWindowRef: Window | null = null;

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

  // ── Helpers para formato de mensaje WhatsApp ──────────────────────────────

  /**
   * Formatea el saludo según la cantidad de titulares:
   * 1 titular  → "Estimado(a) JUAN PEREZ:"
   * 2 titulares → "Estimados JUAN PEREZ y MARIA LOPEZ:"
   * 3+ titulares → "Estimados A, B y C:"
   */
  private formatearSaludo(nombreClientes: string): string {
    if (!nombreClientes || nombreClientes.trim() === '') {
      return 'Estimado(a) cliente:';
    }
    const nombres = nombreClientes.split('/').map(n => n.trim()).filter(n => n.length > 0);
    if (nombres.length === 1) {
      return `Estimado(a) ${nombres[0]}:`;
    }
    if (nombres.length === 2) {
      return `Estimados ${nombres[0]} y ${nombres[1]}:`;
    }
    const todosMenosUltimo = nombres.slice(0, -1).join(', ');
    return `Estimados ${todosMenosUltimo} y ${nombres[nombres.length - 1]}:`;
  }

  /**
   * Formatea la fecha de vencimiento para el mensaje.
   * Si es hoy, muestra "HOY, DD/MM/YYYY".
   * Si no, muestra "DD/MM/YYYY".
   */
  private formatearFecha(fechaStr: string): string {
    const fecha = new Date(fechaStr + 'T00:00:00');
    const hoy = new Date();
    const esHoy = fecha.getFullYear() === hoy.getFullYear()
      && fecha.getMonth() === hoy.getMonth()
      && fecha.getDate() === hoy.getDate();
    const dd = String(fecha.getDate()).padStart(2, '0');
    const mm = String(fecha.getMonth() + 1).padStart(2, '0');
    const yyyy = fecha.getFullYear();
    return esHoy ? `HOY, ${dd}/${mm}/${yyyy}` : `${dd}/${mm}/${yyyy}`;
  }

  /**
   * Formatea el número de letra: "1" → "1", "12" → "12".
   * Sin ceros a la izquierda.
   */
  private formatearNumeroLetra(numero: string): string {
    const num = parseInt(numero, 10);
    return isNaN(num) ? numero : String(num);
  }

  /**
   * Construye el mensaje completo de WhatsApp según el escenario:
   * - Escenario A: tiene letras vencidas + la que vence hoy
   * - Escenario B: solo tiene la letra que vence hoy (sin vencidas)
   */
  private construirMensaje(
    nombreClientes: string,
    letras: DetalleLetraVencida[],
    moneda: string
  ): string {
    const simb = this.simbolo(moneda);
    const hoy = new Date();
    const fechaHoy = `${String(hoy.getDate()).padStart(2, '0')}/${String(hoy.getMonth() + 1).padStart(2, '0')}/${hoy.getFullYear()}`;

    const letrasVencidas = letras.filter(l => !l.venceHoy);
    const letraHoy = letras.filter(l => l.venceHoy);
    const nombreEmpresa = letras[0]?.nombreEmpresa || 'INMOBILIARIA IVAN SAC';

    const saludo = this.formatearSaludo(nombreClientes);
    let mensaje = `🔔 *RECORDATORIO DE PAGO*\n\n${saludo}\n\n`;

    if (letrasVencidas.length > 0) {
      // Escenario A: letras vencidas + la de hoy
      const textoCuota = letraHoy.length === 1
        ? `, además su cuota N.° ${this.formatearNumeroLetra(letraHoy[0].numeroLetra)} vence el día de hoy`
        : '';

      mensaje += `Le informamos que actualmente registra ${letrasVencidas.length} ${letrasVencidas.length === 1 ? 'letra de cambio vencida' : 'letras de cambio vencidas'} y pendientes de pago${textoCuota}.\n\n`;
      mensaje += `📋 *Detalle de letras vencidas:*\n\n`;

      for (const l of letrasVencidas) {
        const numFormat = this.formatearNumeroLetra(l.numeroLetra);
        const montoLetra = `${simb} ${l.importe.toFixed(2)}`;
        const fecha = this.formatearFecha(l.fechaVencimiento);
        const moraStr = l.montoMora > 0 ? ` | ⚠️ Mora: ${simb} ${l.montoMora.toFixed(2)}` : '';
        const totalLetra = l.importe + l.montoMora;
        mensaje += `• *Letra N.° ${numFormat}* — ${montoLetra}\n`;
        mensaje += `  Vencimiento: ${fecha}${moraStr}\n`;
        if (l.montoMora > 0) {
          mensaje += `  *Total: ${simb} ${totalLetra.toFixed(2)}*\n`;
        }
        mensaje += `\n`;
      }

      if (letraHoy.length > 0) {
        mensaje += `📅 *Cuota que vence hoy:*\n\n`;
        for (const l of letraHoy) {
          const numFormat = this.formatearNumeroLetra(l.numeroLetra);
          const montoLetra = `${simb} ${l.importe.toFixed(2)}`;
          mensaje += `• *Letra N.° ${numFormat}* — ${montoLetra}\n`;
          mensaje += `  Vencimiento: HOY, ${fechaHoy}\n`;
          mensaje += `  *Total: ${montoLetra}*\n\n`;
        }
      }

      const importeTotalLetras = letras.reduce((s, l) => s + l.importe, 0);
      const moraTotal = letras.reduce((s, l) => s + l.montoMora, 0);
      const totalRegularizar = importeTotalLetras + moraTotal;

      mensaje += `💵 *Importe total de letras:* ${simb} ${importeTotalLetras.toFixed(2)}\n`;
      if (moraTotal > 0) {
        mensaje += `⚠️ *Mora total:* ${simb} ${moraTotal.toFixed(2)}\n`;
      }
      mensaje += `💰 *Total a regularizar:* ${simb} ${totalRegularizar.toFixed(2)}\n\n`;
      mensaje += `Le agradeceremos acercarse a nuestra oficina para regularizar los pagos pendientes y evitar que continúe generándose mora sobre las letras vencidas.\n\n`;
      mensaje += `Si ya realizó alguno de estos pagos, por favor comuníquenoslo o envíenos su constancia para actualizar nuestros registros.\n\n`;

    } else {
      // Escenario B: solo la letra que vence hoy
      const l = letraHoy[0];
      const numFormat = this.formatearNumeroLetra(l.numeroLetra);
      const montoLetra = `${simb} ${l.importe.toFixed(2)}`;

      mensaje += `Le informamos que su cuota N.° ${numFormat} vence el día de hoy.\n\n`;
      mensaje += `📅 *Fecha de vencimiento:* HOY, ${fechaHoy}\n`;
      mensaje += `💵 *Importe:* ${montoLetra}\n\n`;
      mensaje += `Le agradeceremos acercarse a nuestra oficina para regularizar su pago dentro de la fecha correspondiente y evitar la generación de mora.\n\n`;
      mensaje += `Si ya realizó el pago, por favor omita este mensaje o envíenos su constancia para actualizar nuestros registros.\n\n`;
    }

    mensaje += `*Atentamente,*\n`;
    mensaje += `*${nombreEmpresa}*`;

    return mensaje;
  }

  /**
   * Abre WhatsApp Web con el mensaje precargado para el cliente.
   * Obtiene el detalle de letras vencidas del backend y construye
   * el mensaje personalizado según la cantidad de titulares.
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

    this.toastr.info('Cargando detalle de letras...', 'WhatsApp', { timeOut: 1500 });

    this.reporteMoraService.obtenerDetalleLetras(fila.idContrato).subscribe({
      next: (letras) => {
        if (!letras || letras.length === 0) {
          this.toastr.warning('No se encontraron letras pendientes para este contrato', 'WhatsApp');
          return;
        }

        const mensaje = this.construirMensaje(fila.nombreClientes, letras, fila.moneda);
        const url = `https://web.whatsapp.com/send?phone=${celularLimpio}&text=${encodeURIComponent(mensaje)}`;

        if (whatsappWindowRef && !whatsappWindowRef.closed) {
          whatsappWindowRef.location.href = url;
          whatsappWindowRef.focus();
          return;
        }

        whatsappWindowRef = window.open(url, WHATSAPP_WEB_WINDOW_NAME);
        whatsappWindowRef?.focus();
      },
      error: () => {
        this.toastr.error('Error al obtener el detalle de letras', 'WhatsApp');
      }
    });
  }
}