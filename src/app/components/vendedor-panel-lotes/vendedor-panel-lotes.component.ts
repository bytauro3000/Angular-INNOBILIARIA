import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProgramaService } from '../../services/programa.service';
import { LoteService } from '../../services/lote.service';
import { Programa } from '../../models/programa.model';
import { EstadoLote } from '../../enums/estadolote.enum';
import { Title } from '@angular/platform-browser';

interface LoteVisual {
  idLote: number;
  manzana: string;
  numeroLote: string;
  area: number;
  largo1?: number;
  largo2?: number;
  ancho1?: number;
  ancho2?: number;
  precioM2?: number;
  estado: EstadoLote;
}

interface ManzanaGrupo {
  manzana: string;
  lotes: LoteVisual[];
}

@Component({
  selector: 'app-vendedor-panel-lotes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './vendedor-panel-lotes.html',
  styleUrls: ['./vendedor-panel-lotes.scss']
})
export class VendedorPanelLotesComponent implements OnInit {

  programas: Programa[] = [];
  programaSeleccionado: number | null = null;
  programaNombre: string = '';
  manzanas: ManzanaGrupo[] = [];
  loteSeleccionado: LoteVisual | null = null;

  cantidadLetrasSimulacion: number | null = null;
  inicialSimulacion: number | null = null;
  generandoPdf = false;
  precioVentaReal: number | null = null;
  detalleVenta: any = null;

  cargando = false;
  mostrarPlano = false;
  planoError = false;

  EstadoLote = EstadoLote;

  constructor(
    private programaService: ProgramaService,
    private loteService: LoteService,
    private cdr: ChangeDetectorRef,
    private titleService: Title
  ) {
    this.titleService.setTitle('Panel de Lotes | Inmobiliaria Ivan');
  }

  ngOnInit(): void {
    this.cargarProgramas();
  }

  cargarProgramas(): void {
    this.programaService.listarProgramas().subscribe({
      next: (data) => {
        this.programas = data;
        if (data.length > 0) {
          const defaultProg = data.find(p => p.idPrograma === 4);
          this.programaSeleccionado = defaultProg?.idPrograma || data[0].idPrograma!;
          this.programaNombre = defaultProg?.nombrePrograma || data[0].nombrePrograma;
          this.cargarLotes();
        }
      },
      error: (err) => console.error('Error al cargar programas:', err)
    });
  }

  onProgramaChange(): void {
    this.loteSeleccionado = null;
    this.cantidadLetrasSimulacion = null;
    this.inicialSimulacion = null;
    const prog = this.programas.find(p => p.idPrograma != null && +p.idPrograma === +(this.programaSeleccionado || 0));
    this.programaNombre = prog?.nombrePrograma || '';
    this.cargarLotes();
  }

  cargarLotes(): void {
    if (!this.programaSeleccionado) return;
    this.cargando = true;
    this.loteService.listarLotesEntidadPorPrograma(this.programaSeleccionado).subscribe({
      next: (data) => {
        this.cargando = false;
        const lotes: LoteVisual[] = data
          .map(l => ({
            idLote: l.idLote!,
            manzana: l.manzana,
            numeroLote: l.numeroLote,
            area: l.area,
            largo1: l.largo1,
            largo2: l.largo2,
            ancho1: l.ancho1,
            ancho2: l.ancho2,
            precioM2: l.precioM2,
            estado: l.estado || EstadoLote.Disponible
          }))
          .sort((a, b) => {
            const mz = a.manzana.localeCompare(b.manzana, undefined, { numeric: true });
            return mz !== 0 ? mz : a.numeroLote.localeCompare(b.numeroLote, undefined, { numeric: true });
          });

        const gruposMap = new Map<string, LoteVisual[]>();
        for (const lote of lotes) {
          if (!gruposMap.has(lote.manzana)) {
            gruposMap.set(lote.manzana, []);
          }
          gruposMap.get(lote.manzana)!.push(lote);
        }

        this.manzanas = Array.from(gruposMap.entries())
          .map(([manzana, lotes]) => ({ manzana, lotes }))
          .sort((a, b) => a.manzana.localeCompare(b.manzana, undefined, { numeric: true }));

        this.cdr.markForCheck();
      },
      error: (err) => {
        this.cargando = false;
        console.error('Error al cargar lotes:', err);
      }
    });
  }

  seleccionarLote(lote: LoteVisual): void {
    this.loteSeleccionado = lote;
    this.cantidadLetrasSimulacion = null;
    this.inicialSimulacion = null;
    this.precioVentaReal = null;
    this.detalleVenta = null;
    if (lote.estado === EstadoLote.Vendido && lote.idLote) {
      this.loteService.obtenerDetalleVenta(lote.idLote).subscribe({
        next: (detalle) => {
          this.detalleVenta = detalle;
          this.precioVentaReal = detalle.montoTotal;
        },
        error: () => {}
      });
    }
  }

  getEstadoColor(estado: EstadoLote): string {
    switch (estado) {
      case EstadoLote.Disponible: return 'disponible';
      case EstadoLote.Separado: return 'separado';
      case EstadoLote.Vendido: return 'vendido';
      default: return 'disponible';
    }
  }

  getEstadoLabel(estado: EstadoLote): string {
    switch (estado) {
      case EstadoLote.Disponible: return 'Disponible';
      case EstadoLote.Separado: return 'Separado';
      case EstadoLote.Vendido: return 'Vendido';
      default: return 'Disponible';
    }
  }

  getEstadoIcon(estado: EstadoLote): string {
    switch (estado) {
      case EstadoLote.Disponible: return 'bi-check-circle-fill';
      case EstadoLote.Separado: return 'bi-clock-fill';
      case EstadoLote.Vendido: return 'bi-x-circle-fill';
      default: return 'bi-check-circle-fill';
    }
  }

  getPrecioTotalNum(lote: LoteVisual): number {
    if (lote.area && lote.precioM2) {
      return lote.area * lote.precioM2;
    }
    return 0;
  }

  getPrecioTotal(lote: LoteVisual): string {
    const total = this.getPrecioTotalNum(lote);
    if (total > 0) {
      const label = lote.estado === EstadoLote.Vendido && this.precioVentaReal ? 'Vendido en ' : '';
      return label + new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(total);
    }
    return '—';
  }

  get montoTotalSimulado(): number {
    if (!this.loteSeleccionado) return 0;
    if (this.loteSeleccionado.estado === EstadoLote.Vendido && this.precioVentaReal) {
      return this.precioVentaReal;
    }
    return this.getPrecioTotalNum(this.loteSeleccionado);
  }

  get descuento(): number {
    return Math.round(this.montoTotalSimulado * 0.3);
  }

  get precioVentaContado(): number {
    return this.montoTotalSimulado - this.descuento;
  }

  get saldoFinanciado(): number {
    const inicial = this.inicialSimulacion || 0;
    return Math.max(0, this.montoTotalSimulado - inicial);
  }

  get cuotaMensual(): number {
    const s = this.saldoFinanciado;
    const l = this.cantidadLetrasSimulacion || 0;
    return l > 0 ? Math.floor(s / l) : 0;
  }

  get ultimaLetra(): number {
    const s = this.saldoFinanciado;
    const l = this.cantidadLetrasSimulacion || 0;
    if (l <= 0) return 0;
    return s - Math.floor(s / l) * (l - 1);
  }

  get tieneResiduo(): boolean {
    return this.ultimaLetra !== this.cuotaMensual;
  }

  getResumen() {
    let disponibles = 0, separados = 0, vendidos = 0;
    for (const mz of this.manzanas) {
      for (const l of mz.lotes) {
        if (l.estado === EstadoLote.Disponible) disponibles++;
        else if (l.estado === EstadoLote.Separado) separados++;
        else if (l.estado === EstadoLote.Vendido) vendidos++;
      }
    }
    return { disponibles, separados, vendidos, total: disponibles + separados + vendidos };
  }

  getResumenPorManzana(lotes: LoteVisual[]) {
    let d = 0, s = 0, v = 0;
    for (const l of lotes) {
      if (l.estado === EstadoLote.Disponible) d++;
      else if (l.estado === EstadoLote.Separado) s++;
      else if (l.estado === EstadoLote.Vendido) v++;
    }
    return { disponibles: d, separados: s, vendidos: v };
  }

  togglePlano(): void {
    this.mostrarPlano = !this.mostrarPlano;
  }

  private dividirTexto(texto: string, maxLen: number): string[] {
    if (texto.length <= maxLen) return [texto];
    const corte = texto.lastIndexOf(' ', maxLen);
    if (corte < 1) return [texto.substring(0, maxLen), texto.substring(maxLen)];
    return [texto.substring(0, corte), texto.substring(corte + 1)];
  }

  async descargarProforma(): Promise<void> {
    if (!this.loteSeleccionado) return;
    this.generandoPdf = true;

    try {
      const jsPDF = (await import('jspdf')).default;
      const lote = this.loteSeleccionado;
      const total = this.getPrecioTotalNum(lote);
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a5' });
      const pw = 148, ph = 210;
      const ml = 10;

      const imgUrl = 'https://res.cloudinary.com/dlgqaifrk/image/upload/v1784613093/profroma_jhsms6.png';
      try {
        const img = await this.cargarImagen(imgUrl);
        pdf.addImage(img, 'PNG', -2, -2, pw + 4, ph + 4);
      } catch {
        pdf.setFillColor(255, 255, 255);
        pdf.rect(0, 0, pw, ph, 'F');
      }

      const bold = (s: number) => { pdf.setFont('helvetica', 'bold'); pdf.setFontSize(s); };
      const normal = (s: number) => { pdf.setFont('helvetica', 'normal'); pdf.setFontSize(s); };
      const txt = (s: string, x: number, y: number, o?: any) => pdf.text(s, x, y, o);
      const prog = this.programaNombre;
      const l1 = lote.largo1 != null ? `L1: ${lote.largo1}m` : '';
const l2 = lote.largo2 != null ? `L2: ${lote.largo2}m` : '';
const a1 = lote.ancho1 != null ? `A1: ${lote.ancho1}m` : '';
const a2 = lote.ancho2 != null ? `A2: ${lote.ancho2}m` : '';
const dimLine1 = [l1, l2].filter(Boolean).join('  ');
const dimLine2 = [a1, a2].filter(Boolean).join('  ');
const tieneA2 = lote.ancho2 != null && lote.largo2 != null;

      const bw = pw - ml * 2;
      const hw = bw / 2 - 1.5;
      const rh = 7.5;

      // ── DATOS DEL PROYECTO (tabla 2×2 con bordes) ───────────────────────
      let y = 58;
      const boxTop = y;
      const tx = ml, tw = bw;
      const half = tx + tw / 2;

      // Dividir nombre largo del programa en 2 líneas si es necesario
      const progLines = prog.length > 30 ? this.dividirTexto(prog, 30) : [prog];
      const extraH = (progLines.length - 1) * 5;
      const dimExtraH = tieneA2 ? 5 : 0;
      const th = rh * 3 + 2 + extraH + dimExtraH;

      // Borde exterior (transparente para ver la imagen de fondo)
      pdf.setDrawColor(180, 180, 180);
      pdf.setLineWidth(0.4);
      pdf.roundedRect(tx, y, tw, th, 2, 2, 'S');

      // Encabezado
      bold(9); txt('DATOS DEL PROYECTO', tx + 3, y + 6);
      y += rh + 1;

      // Línea horizontal debajo del encabezado (tocando bordes izq y der)
      pdf.line(tx + 1.8, y - 1, tx + tw - 1.8, y - 1);

      // Línea vertical central (desde línea horizontal superior hasta borde inferior)
      pdf.line(half, y - 1, half, boxTop + th - 2);

      // Fila 1: PROGRAMA (izquierda) | DIMENSIONES con L1,L2 + A1,A2 (derecha)
      bold(8.5); pdf.text('PROGRAMA:', tx + 3, y + 4);
      normal(8);
      progLines.forEach((line, i) => pdf.text(line, tx + 25, y + 4 + (i * 4.5)));
      bold(8.5); pdf.text('DIMENSIONES:', half + 3, y + 4);
      normal(8);
      const dimsX = half + 27;
      if (dimLine1) pdf.text(dimLine1, dimsX, y + 4);
      if (dimLine2) pdf.text(dimLine2, dimsX, y + 9);
      y += rh + extraH + dimExtraH;

      // Línea horizontal entre filas (tocando bordes izq y der)
      pdf.line(tx + 1.8, y - 1, tx + tw - 1.8, y - 1);

      // Fila 2: LOTE (izquierda) | ÁREA (derecha)
      bold(8.5); pdf.text('LOTE:', tx + 3, y + 4);
      normal(8); txt(`${lote.manzana} - Lt. ${lote.numeroLote}`, tx + 16, y + 4);
      bold(8.5); pdf.text('ÁREA:', half + 3, y + 4);
      normal(8); txt(`${lote.area} m²`, half + 16, y + 4);
      y += rh + 4;

      // ── CONTADO (izquierda) y FINANCIADO (derecha) ────────────────────
      const cyCont = y;
      const drawBox = (x: number, w: number, h: number) => {
        pdf.roundedRect(x, cyCont, w, h, 2, 2, 'S');
      };

      pdf.setLineWidth(0.4);
      // CONTADO
      drawBox(ml, hw, rh * 5 + 2);
      bold(9); txt('MODALIDAD', ml + 3, cyCont + 5);
      bold(9); txt('CONTADO', ml + 3, cyCont + rh + 5);
      normal(8); txt(`PRECIO DEL LOTE:`, ml + 3, cyCont + rh * 2 + 5);
      bold(9); txt(`$ ${Math.round(total).toLocaleString('en-US')}`, ml + hw - 3, cyCont + rh * 2 + 5, { align: 'right' });
      normal(8); txt(`DESCUENTO (30%):`, ml + 3, cyCont + rh * 3 + 5);
      bold(9); txt(`$ ${this.descuento.toLocaleString('en-US')}`, ml + hw - 3, cyCont + rh * 3 + 5, { align: 'right' });
      bold(10); txt(`PRECIO DE VENTA:`, ml + 3, cyCont + rh * 4 + 5);
      bold(10); txt(`$ ${this.precioVentaContado.toLocaleString('en-US')}`, ml + hw - 3, cyCont + rh * 4 + 5, { align: 'right' });

      // FINANCIADO
      const fx = ml + hw + 3;
      const ini = this.inicialSimulacion || 0;
      const letras = this.cantidadLetrasSimulacion || 0;
      const finRows = letras > 0 ? 8 : 5;
      drawBox(fx, hw, rh * finRows + 2);

      bold(9); txt('MODALIDAD', fx + 3, cyCont + 5);
      bold(9); txt('FINANCIADO', fx + 3, cyCont + rh + 5);
      normal(8); txt(`PRECIO DEL LOTE:`, fx + 3, cyCont + rh * 2 + 5);
      bold(9); txt(`$ ${Math.round(total).toLocaleString('en-US')}`, fx + hw - 3, cyCont + rh * 2 + 5, { align: 'right' });
      normal(8); txt(`INICIAL:`, fx + 3, cyCont + rh * 3 + 5);
      bold(9); txt(`$ ${Math.round(ini).toLocaleString('en-US')}`, fx + hw - 3, cyCont + rh * 3 + 5, { align: 'right' });

      normal(8); txt(`SALDO:`, fx + 3, cyCont + rh * 4 + 5);
      bold(9); txt(`$ ${this.saldoFinanciado.toLocaleString('en-US')}`, fx + hw - 3, cyCont + rh * 4 + 5, { align: 'right' });

      if (letras > 0) {
        bold(9); txt('DETALLE DE PAGO', fx + 3, cyCont + rh * 5 + 5);
        if (this.tieneResiduo) {
          normal(8); txt(`De la letra 1 a ${letras - 1}:`, fx + 3, cyCont + rh * 6 + 5);
          bold(9); txt(`$ ${this.cuotaMensual.toLocaleString('en-US')}`, fx + hw - 3, cyCont + rh * 6 + 5, { align: 'right' });
          normal(8); txt(`Letra ${letras}:`, fx + 3, cyCont + rh * 7 + 5);
          bold(9); txt(`$ ${this.ultimaLetra.toLocaleString('en-US')}`, fx + hw - 3, cyCont + rh * 7 + 5, { align: 'right' });
        } else {
          normal(8); txt(`${letras} letras de:`, fx + 3, cyCont + rh * 6 + 5);
          bold(9); txt(`$ ${this.cuotaMensual.toLocaleString('en-US')}`, fx + hw - 3, cyCont + rh * 6 + 5, { align: 'right' });
        }
      }

      // ── DATOS DE CONTACTO (esquina inferior izquierda) ──
      normal(7.5);
      txt('Av. Alfredo Mendiola N° 3623 3er. Piso Of. 301 - Urb. Panamericana Norte - Los Olivos', ml + 5, 178);
      txt('+51 987-891-788', ml + 5, 185);
      txt('inmobiliariaivan.eirl@gmail.com', ml + 5, 192);
      txt('https://inmobiliaria-ivan.vercel.app/', ml + 5, 199);

      pdf.save(`Proforma_${lote.manzana}-${lote.numeroLote}.pdf`);
    } catch (e) {
      console.error('Error al generar PDF:', e);
    } finally {
      this.generandoPdf = false;
    }
  }

  private cargarImagen(url: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = url;
    });
  }
}