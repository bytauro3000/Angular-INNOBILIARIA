import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReporteMoraService } from '../../services/reporte-mora.service';
import { ReporteClientesMoraDTO, FilaClienteMora, DetalleLetraVencida } from '../../dto/reporte-mora.dto';
import { ToastrService } from 'ngx-toastr';

const WHATSAPP_WINDOW = 'WhatsAppWeb';
let whatsappRef: Window | null = null;

interface TelefonoOption {
  nombre: string;
  numero: string;
}

@Component({
  selector: 'app-letras-vencidas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './letras-vencidas.html',
  styleUrls: ['./letras-vencidas.scss']
})
export class LetrasVencidasComponent implements OnInit {

  grupos: ReporteClientesMoraDTO[] = [];
  cargando = true;

  // Modal de seleccion de celular
  modalVisible = false;
  modalTelefono: TelefonoOption[] = [];
  modalFila: FilaClienteMora | null = null;
  editandoIndex: number | null = null;
  editandoValor: string = '';

  constructor(
    private reporteMoraService: ReporteMoraService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.cargarLetrasVencidas();
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.editandoIndex !== null) {
      this.cancelarEdicion();
    } else {
      this.cerrarModal();
    }
  }

  // ── Carga de datos ──────────────────────────────────────────────────────

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

  // ── Stats ───────────────────────────────────────────────────────────────

  get totalClientes(): number {
    return this.grupos.reduce((sum, g) => sum + g.clientes.length, 0);
  }

  get totalImporte(): number {
    return this.grupos.reduce((sum, g) =>
      sum + g.clientes.reduce((s, f) => s + (f.importeTotal ?? 0), 0), 0);
  }

  // ── Helpers ─────────────────────────────────────────────────────────────

  private parseLote(lote: string | undefined): number {
    const num = parseInt((lote ?? '').replace(/\D/g, ''), 10);
    return isNaN(num) ? 0 : num;
  }

  simbolo(moneda: string): string {
    return moneda === 'USD' ? '$' : 'S/';
  }

  formatArea(area: number | undefined): string {
    if (area === null || area === undefined) return '—';
    return `${Number(area).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} m²`;
  }

  // ── Celulares ───────────────────────────────────────────────────────────

  getCelulares(fila: FilaClienteMora): string[] {
    if (fila.celulares?.length) {
      return fila.celulares.filter(c => c?.trim());
    }
    return fila.celular?.trim() ? [fila.celular] : [];
  }

  nombreTitular(fila: FilaClienteMora, index: number): string {
    const nombres = fila.nombreClientes.split('/').map(n => n.trim());
    return nombres[index] || `Titular ${index + 1}`;
  }

  // ── WhatsApp click handler ──────────────────────────────────────────────

  onWhatsAppClick(fila: FilaClienteMora): void {
    const celulares = this.getCelulares(fila);

    if (celulares.length === 0) {
      this.toastr.warning(`El cliente "${fila.nombreClientes}" no tiene celular registrado`, 'WhatsApp');
      return;
    }

    if (celulares.length === 1) {
      this.abrirWhatsapp(fila, celulares[0]);
      return;
    }

    // 2+ celulares: abrir modal de seleccion
    this.modalFila = fila;
    this.modalTelefono = celulares.map((c, i) => ({
      nombre: this.nombreTitular(fila, i),
      numero: c
    }));
    this.modalVisible = true;
  }

  seleccionarTelefono(numero: string): void {
    if (this.editandoIndex !== null) return;
    if (this.modalFila) {
      this.abrirWhatsapp(this.modalFila, numero);
    }
    this.cerrarModal();
  }

  iniciarEdicion(index: number, event: Event): void {
    event.stopPropagation();
    this.editandoIndex = index;
    this.editandoValor = this.modalTelefono[index].numero;
  }

  cancelarEdicion(): void {
    this.editandoIndex = null;
    this.editandoValor = '';
  }

  guardarEdicion(index: number): void {
    const numLimpio = this.editandoValor.replace(/\D/g, '');
    if (numLimpio.length < 6) {
      this.toastr.warning('Ingrese un numero valido (minimo 6 digitos)', 'Celular');
      return;
    }
    this.modalTelefono[index].numero = numLimpio;
    this.cancelarEdicion();
    this.toastr.success('Numero actualizado', 'Celular');
  }

  cerrarModal(): void {
    this.modalVisible = false;
    this.modalFila = null;
    this.modalTelefono = [];
    this.editandoIndex = null;
    this.editandoValor = '';
  }

  // ── Abrir WhatsApp Web ──────────────────────────────────────────────────

  abrirWhatsapp(fila: FilaClienteMora, celular: string): void {
    const limpio = celular.replace(/\D/g, '');
    const formato = limpio.startsWith('51') ? limpio : '51' + limpio;

    if (!formato || formato === '51' || /^510+$/.test(formato)) {
      this.toastr.warning(`El celular de "${fila.nombreClientes}" no es válido`, 'WhatsApp');
      return;
    }

    this.toastr.info('Cargando detalle de letras...', 'WhatsApp', { timeOut: 1500 });

    this.reporteMoraService.obtenerDetalleLetras(fila.idContrato).subscribe({
      next: (letras) => {
        if (!letras?.length) {
          this.toastr.warning('No se encontraron letras pendientes', 'WhatsApp');
          return;
        }

        const mensaje = this.construirMensaje(fila.nombreClientes, letras, fila.moneda);
        const url = `https://web.whatsapp.com/send?phone=${formato}&text=${encodeURIComponent(mensaje)}`;

        if (whatsappRef && !whatsappRef.closed) {
          whatsappRef.location.href = url;
          whatsappRef.focus();
        } else {
          whatsappRef = window.open(url, WHATSAPP_WINDOW);
          whatsappRef?.focus();
        }
      },
      error: () => {
        this.toastr.error('Error al obtener el detalle de letras', 'WhatsApp');
      }
    });
  }

  // ── Construcción de mensaje ─────────────────────────────────────────────

  private construirMensaje(
    nombreClientes: string,
    letras: DetalleLetraVencida[],
    moneda: string
  ): string {
    const simb = this.simbolo(moneda);
    const hoy = new Date();
    const fechaHoy = `${String(hoy.getDate()).padStart(2, '0')}/${String(hoy.getMonth() + 1).padStart(2, '0')}/${hoy.getFullYear()}`;

    const vencidas = letras.filter(l => !l.venceHoy);
    const hoyLetras = letras.filter(l => l.venceHoy);
    const nombreEmpresa = letras[0]?.nombreEmpresa || 'INMOBILIARIA IVAN SAC';

    const saludo = this.formatearSaludo(nombreClientes);
    let msg = `\u{1F514} *RECORDATORIO DE PAGO*\n\n${saludo}\n\n`;

    if (vencidas.length > 0) {
      const textoHoy = hoyLetras.length === 1
        ? `, además su cuota N.\u{00B0} ${this.formatearNumeroLetra(hoyLetras[0].numeroLetra)} vence el día de hoy`
        : '';

      msg += `Le informamos que actualmente registra ${vencidas.length} ${vencidas.length === 1 ? 'letra de cambio vencida' : 'letras de cambio vencidas'} y pendientes de pago${textoHoy}.\n\n`;
      msg += `\u{1F4CB} *Detalle de letras vencidas:*\n\n`;

      for (const l of vencidas) {
        const num = this.formatearNumeroLetra(l.numeroLetra);
        const fecha = this.formatearFecha(l.fechaVencimiento);
        const mora = l.montoMora > 0 ? ` | \u26A0\uFE0F Mora: ${simb} ${l.montoMora.toFixed(2)}` : '';
        msg += `\u2022 *Letra N.\u{00B0} ${num}* — ${simb} ${l.importe.toFixed(2)}\n`;
        msg += `  Vencimiento: ${fecha}${mora}\n`;
        if (l.montoMora > 0) {
          msg += `  *Total: ${simb} ${(l.importe + l.montoMora).toFixed(2)}*\n`;
        }
        msg += `\n`;
      }

      if (hoyLetras.length > 0) {
        msg += `\u{1F4C5} *Cuota que vence hoy:*\n\n`;
        for (const l of hoyLetras) {
          const num = this.formatearNumeroLetra(l.numeroLetra);
          msg += `\u2022 *Letra N.\u{00B0} ${num}* — ${simb} ${l.importe.toFixed(2)}\n`;
          msg += `  Vencimiento: HOY, ${fechaHoy}\n`;
          msg += `  *Total: ${simb} ${l.importe.toFixed(2)}*\n\n`;
        }
      }

      const importeTotal = letras.reduce((s, l) => s + l.importe, 0);
      const moraTotal = letras.reduce((s, l) => s + l.montoMora, 0);

      msg += `\u{1F4B5} *Importe total de letras:* ${simb} ${importeTotal.toFixed(2)}\n`;
      if (moraTotal > 0) {
        msg += `\u26A0\uFE0F *Mora total:* ${simb} ${moraTotal.toFixed(2)}\n`;
      }
      msg += `\u{1F4B0} *Total a regularizar:* ${simb} ${(importeTotal + moraTotal).toFixed(2)}\n\n`;
      msg += `Le agradeceremos acercarse a nuestra oficina para regularizar los pagos pendientes y evitar que continúe generándose mora sobre las letras vencidas.\n\n`;
      msg += `Si ya realizó alguno de estos pagos, por favor comuníquenoslo o envíenos su constancia para actualizar nuestros registros.\n\n`;
    } else {
      const l = hoyLetras[0];
      const num = this.formatearNumeroLetra(l.numeroLetra);

      msg += `Le informamos que su cuota N.\u{00B0} ${num} vence el día de hoy.\n\n`;
      msg += `\u{1F4C5} *Fecha de vencimiento:* HOY, ${fechaHoy}\n`;
      msg += `\u{1F4B5} *Importe:* ${simb} ${l.importe.toFixed(2)}\n\n`;
      msg += `Le agradeceremos regularizar su pago dentro de la fecha correspondiente y evitar la generación de mora.\n\n`;
      msg += `Si ya realizó el pago, por favor omita este mensaje o envíenos su constancia para actualizar nuestros registros.\n\n`;
    }

    msg += `*Atentamente,*\n*${nombreEmpresa}*`;
    return msg;
  }

  private formatearSaludo(nombreClientes: string): string {
    if (!nombreClientes?.trim()) return 'Estimado(a) cliente:';
    const nombres = nombreClientes.split('/').map(n => n.trim()).filter(Boolean);
    if (nombres.length === 1) return `Estimado(a) ${nombres[0]}:`;
    if (nombres.length === 2) return `Estimados ${nombres[0]} y ${nombres[1]}:`;
    return `Estimados ${nombres.slice(0, -1).join(', ')} y ${nombres[nombres.length - 1]}:`;
  }

  private formatearFecha(fechaStr: string): string {
    const parts = fechaStr.split('-');
    const dd = parts[2]?.substring(0, 2) || '??';
    const mm = parts[1] || '??';
    const yyyy = parts[0] || '????';
    const fecha = new Date(Number(yyyy), Number(mm) - 1, Number(dd));
    const hoy = new Date();
    const esHoy = fecha.getFullYear() === hoy.getFullYear()
      && fecha.getMonth() === hoy.getMonth()
      && fecha.getDate() === hoy.getDate();
    return esHoy ? `HOY, ${dd}/${mm}/${yyyy}` : `${dd}/${mm}/${yyyy}`;
  }

  private formatearNumeroLetra(numero: string): string {
    const num = parseInt(numero, 10);
    return isNaN(num) ? numero : String(num);
  }
}
