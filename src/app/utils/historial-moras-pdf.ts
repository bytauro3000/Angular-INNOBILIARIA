/**
 * Generador de PDF para el reporte "HISTORIAL DE MORAS".
 *
 * Layout: A4 portrait
 *   ┌────────────────────────────────────────────────────────┐
 *   │  EMPRESA (izq)              LOGO (der)                 │  ← header
 *   │              HISTORIAL DE MORAS                        │  ← centrado
 *   │              KARDEX N°: 1105                           │  ← centrado
 *   │              EMISION: 06/06/2026 17:20                 │  ← centrado
 *   │  ───────────────────────────────────────────            │
 *   │  CLIENTE 1: FALCON LOPEZ JANETH       DNI: ___         │  ← bloque cliente
 *   │  DIRECCION: CALLE S/N MZ.51 LT.14 ...                  │
 *   │  PROGRAMA:  1. LA FLORIDA DE TORRE BLANCA              │
 *   │  MANZANA:   A2   LOTE: 06   AREA: 120.00 m²           │
 *   │  PRECIO:    $ 13,350.00  TEL: ___                      │
 *   │  ───────────────────────────────────────────            │
 *   │  ▌ MORAS REGISTRADAS                                   │  ← micro-banda azul
 *   │  # | F.Venc | F.Pago | Días | 5% | Diaria | Total | C  │  ← tabla bloque A
 *   │  ...                                                   │
 *   │  ▌ MORAS PENDIENTES (calculadas)                       │  ← micro-banda naranja
 *   │  # | F.Venc | F.Pago | Días | 5% | Diaria | Total | C  │  ← tabla bloque B
 *   │  ...                                                   │
 *   │                                  TOTAL MORA: $ _____   │  ← footer derecho
 *   └────────────────────────────────────────────────────────┘
 */
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { HistorialMorasData } from '../services/reporte-moras.service';
import { HistorialMorasItem } from '../dto/historial-moras-item.dto';
import { ContratoResponseDTO } from '../dto/contratoreponse.dto';



export class HistorialMorasPdf {

  /**
   * Genera el PDF en memoria y lo abre en nueva pestaña.
   */
  static async generar(data: HistorialMorasData): Promise<void> {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageW = doc.internal.pageSize.getWidth();

    // ── Header empresa + logo ─────────────────────────────
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text('INMOBILIARIA CONSTRUCTORA IVAN E.I.R.L.', 14, 18);

    try {
      const resp = await fetch('https://res.cloudinary.com/dlgqaifrk/image/upload/f_auto,q_auto,w_400,h_400/v1773723460/logo_y1ygeg.png');
      if (resp.ok) {
        const blob = await resp.blob();
        const logoDataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload  = () => resolve(reader.result as string);
          reader.onerror = () => reject(reader.error);
          reader.readAsDataURL(blob);
        });
        doc.addImage(logoDataUrl, 'PNG', pageW - 38, 11, 18, 18);
      }
    } catch (e) {
      console.warn('No se pudo cargar el logo:', e);
    }

    // ── Titulo centrado ────────────────────────────────────
    const centerX = pageW / 2;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(2, 62, 138);
    doc.text('HISTORIAL DE MORAS', centerX, 34, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text(`KARDEX N°:  ${data.kardex}`, centerX, 41, { align: 'center' });

    const emisionStr = this.formatFechaEmision(data.fechaEmision);
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    doc.text(`EMISION:  ${emisionStr}`, centerX, 46, { align: 'center' });

    // ── Bloque cliente ────────────────────────────────────
    const clienteY = this.drawClienteBlock(doc, data.contrato, 54);

    let cursorY = clienteY + 1;

    // ── Tabla bloque A pagadas ────────────────────────────────
    if (data.bloqueAPagadas.length > 0) {
      cursorY = this.drawMicroBanda(doc, 'MORAS PAGADAS (no suman al total)', [22, 163, 74], 14, cursorY, pageW - 28);

      autoTable(doc, {
        startY: cursorY,
        margin: { left: 14, right: 14 },
        tableWidth: 182,
        head: [
          [
            { content: 'LETRAS', colSpan: 4,
              styles: { fillColor: [219, 234, 254], textColor: [30, 64, 175],
                        fontStyle: 'bold', halign: 'center', fontSize: 9 } },
            { content: 'MORAS', colSpan: 4,
              styles: { fillColor: [220, 252, 231], textColor: [22, 163, 74],
                        fontStyle: 'bold', halign: 'center', fontSize: 9 } }
          ],
          [
            this.th('N° LETRA'), this.th('F. VENC.'), this.th('F. REF.'),
            this.th('COMPROBANTE'),
            this.th('D. ATRAS'), this.th('MORA 5%'), this.th('MORA DIARIA'),
            this.th('MORA')
          ]
        ],
        body: data.bloqueAPagadas.map(i => this.rowItem(i, data.simboloMoneda)),
        theme: 'grid',
        styles: { fontSize: 8, cellPadding: 1.5, lineColor: [226, 232, 240], lineWidth: 0.1 },
        headStyles: { fillColor: [241, 245, 249], textColor: [15, 23, 42], halign: 'center', fontStyle: 'bold' },
        bodyStyles: { halign: 'center' },
        columnStyles: {
          0: { halign: 'center', cellWidth: 16 },
          1: { halign: 'center', cellWidth: 22 },
          2: { halign: 'center', cellWidth: 22 },
          3: { halign: 'center', cellWidth: 32 },
          4: { halign: 'center', cellWidth: 18 },
          5: { halign: 'right',  cellWidth: 20 },
          6: { halign: 'right',  cellWidth: 24 },
          7: { halign: 'right',  cellWidth: 28 }
        },
        didDrawPage: (d) => this.drawFooterPagina(doc, d.pageNumber, pageW)
      });
      cursorY = (doc as any).lastAutoTable.finalY + 4;
    }

    // ── Tabla bloque A (moras registradas pendientes) ──────
    cursorY = this.drawMicroBanda(doc, 'MORAS REGISTRADAS PENDIENTES', [30, 64, 175], 14, cursorY, pageW - 28);

    if (data.bloqueA.length > 0) {
      autoTable(doc, {
        startY: cursorY,
        margin: { left: 14, right: 14 },
        tableWidth: 182,
        head: [
          [
            { content: 'LETRAS', colSpan: 4,
              styles: { fillColor: [219, 234, 254], textColor: [30, 64, 175],
                        fontStyle: 'bold', halign: 'center', fontSize: 9 } },
            { content: 'MORAS', colSpan: 4,
              styles: { fillColor: [254, 215, 170], textColor: [194, 65, 12],
                        fontStyle: 'bold', halign: 'center', fontSize: 9 } }
          ],
          [
            this.th('N° LETRA'), this.th('F. VENC.'), this.th('F. REF.'),
            this.th('COMPROBANTE'),
            this.th('D. ATRAS'), this.th('MORA 5%'), this.th('MORA DIARIA'),
            this.th('MORA')
          ]
        ],
        body: data.bloqueA.map(i => this.rowItem(i, data.simboloMoneda)),
        theme: 'grid',
        styles: { fontSize: 8, cellPadding: 1.5, lineColor: [226, 232, 240], lineWidth: 0.1 },
        headStyles: { fillColor: [241, 245, 249], textColor: [15, 23, 42], halign: 'center', fontStyle: 'bold' },
        bodyStyles: { halign: 'center' },
        columnStyles: {
          0: { halign: 'center', cellWidth: 16 },
          1: { halign: 'center', cellWidth: 22 },
          2: { halign: 'center', cellWidth: 22 },
          3: { halign: 'center', cellWidth: 32 },
          4: { halign: 'center', cellWidth: 18 },
          5: { halign: 'right',  cellWidth: 20 },
          6: { halign: 'right',  cellWidth: 24 },
          7: { halign: 'right',  cellWidth: 28, fontStyle: 'bold' }
        },
        didDrawPage: (d) => this.drawFooterPagina(doc, d.pageNumber, pageW)
      });
      cursorY = (doc as any).lastAutoTable.finalY + 4;
    } else {
      doc.setFontSize(9);
      doc.setTextColor(148, 163, 184);
      doc.setFont('helvetica', 'italic');
      doc.text('(No hay moras pendientes registradas)', 14, cursorY + 5);
      cursorY += 10;
    }

    // ── Tabla de anuladas (si las hay) ────────────────────────
    if (data.bloqueAAnuladas.length > 0) {
      cursorY = this.drawMicroBanda(doc, 'ANULADAS (no suman al total)', [148, 163, 184], 14, cursorY, pageW - 28);

      autoTable(doc, {
        startY: cursorY,
        margin: { left: 14, right: 14 },
        tableWidth: 182,
        head: [
          [
            { content: 'LETRAS', colSpan: 4,
              styles: { fillColor: [219, 234, 254], textColor: [30, 64, 175],
                        fontStyle: 'bold', halign: 'center', fontSize: 9 } },
            { content: 'MORAS', colSpan: 4,
              styles: { fillColor: [226, 232, 240], textColor: [100, 116, 139],
                        fontStyle: 'bold', halign: 'center', fontSize: 9 } }
          ],
          [
            this.th('N° LETRA'), this.th('F. VENC.'), this.th('F. REF.'),
            this.th('COMPROBANTE'),
            this.th('D. ATRAS'), this.th('MORA 5%'), this.th('MORA DIARIA'),
            this.th('MORA')
          ]
        ],
        body: data.bloqueAAnuladas.map(i => this.rowItem(i, data.simboloMoneda, true)),
        theme: 'grid',
        styles: { fontSize: 8, cellPadding: 1.5, lineColor: [226, 232, 240], lineWidth: 0.1,
                  textColor: [148, 163, 184] },
        headStyles: { fillColor: [241, 245, 249], textColor: [15, 23, 42], halign: 'center', fontStyle: 'bold' },
        bodyStyles: { halign: 'center', fontStyle: 'italic' },
        columnStyles: {
          0: { halign: 'center', cellWidth: 16 },
          1: { halign: 'center', cellWidth: 22 },
          2: { halign: 'center', cellWidth: 22 },
          3: { halign: 'center', cellWidth: 32 },
          4: { halign: 'center', cellWidth: 18 },
          5: { halign: 'right',  cellWidth: 20 },
          6: { halign: 'right',  cellWidth: 24 },
          7: { halign: 'right',  cellWidth: 28 }
        },
        didDrawPage: (d) => this.drawFooterPagina(doc, d.pageNumber, pageW)
      });
      cursorY = (doc as any).lastAutoTable.finalY + 4;
    }

    // ── Tabla bloque B (moras calculadas pendientes) ───────
    cursorY = this.drawMicroBanda(doc, 'MORAS PENDIENTES (calculadas)', [234, 88, 12], 14, cursorY, pageW - 28);

    if (data.bloqueB.length > 0) {
      autoTable(doc, {
        startY: cursorY,
        margin: { left: 14, right: 14 },
        tableWidth: 182,
        head: [
          [
            { content: 'LETRAS', colSpan: 4,
              styles: { fillColor: [219, 234, 254], textColor: [30, 64, 175],
                        fontStyle: 'bold', halign: 'center', fontSize: 9 } },
            { content: 'MORAS', colSpan: 4,
              styles: { fillColor: [254, 215, 170], textColor: [194, 65, 12],
                        fontStyle: 'bold', halign: 'center', fontSize: 9 } }
          ],
          [
            this.th('N° LETRA'), this.th('F. VENC.'), this.th('F. REF.'),
            this.th('COMPROBANTE'),
            this.th('D. ATRAS'), this.th('MORA 5%'), this.th('MORA DIARIA'),
            this.th('MORA')
          ]
        ],
        body: data.bloqueB.map(i => this.rowItem(i, data.simboloMoneda, false, data.fechaEmision)),
        theme: 'grid',
        styles: { fontSize: 8, cellPadding: 1.5, lineColor: [226, 232, 240], lineWidth: 0.1 },
        headStyles: { fillColor: [241, 245, 249], textColor: [15, 23, 42], halign: 'center', fontStyle: 'bold' },
        bodyStyles: { halign: 'center' },
        columnStyles: {
          0: { halign: 'center', cellWidth: 16 },
          1: { halign: 'center', cellWidth: 22 },
          2: { halign: 'center', cellWidth: 22 },
          3: { halign: 'center', cellWidth: 32 },
          4: { halign: 'center', cellWidth: 18 },
          5: { halign: 'right',  cellWidth: 20 },
          6: { halign: 'right',  cellWidth: 24 },
          7: { halign: 'right',  cellWidth: 28, fontStyle: 'bold' }
        },
        didDrawPage: (d) => this.drawFooterPagina(doc, d.pageNumber, pageW)
      });
      // @ts-ignore
      cursorY = (doc as any).lastAutoTable.finalY + 6;
    } else {
      doc.setFontSize(9);
      doc.setTextColor(148, 163, 184);
      doc.setFont('helvetica', 'italic');
      doc.text('(No hay moras pendientes calculadas)', 14, cursorY + 5);
      cursorY += 10;
    }

    // ── Footer derecho: TOTAL MORA ──────────────────────────
    const pageH = doc.internal.pageSize.getHeight();
    let footerY = cursorY + 8;
    if (footerY > pageH - 14) {
      doc.addPage();
      footerY = 20;
    }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(220, 38, 38); // red-600
    const totalText = `TOTAL MORA:  ${data.simboloMoneda} ${this.fmtNumero(data.totalMora)}`;
    const textW = doc.getTextWidth(totalText);
    doc.text(totalText, pageW - 14 - textW, footerY);

    // ── Abrir en nueva pestaña ──────────────────────────────
    const blob = doc.output('blob');
    const url  = URL.createObjectURL(blob);
    window.open(url, '_blank');
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  }

  // ──────────────────────────────────────────────────────────
  // Helpers
  // ──────────────────────────────────────────────────────────

  private static th(text: string) {
    return { content: text, styles: { halign: 'center' as const } };
  }

  private static rowItem(
    i: HistorialMorasItem,
    simbolo: '$' | 'S/',
    tachado = false,
    fechaActual?: Date
  ) {
    const comp = (i.tipoComprobante || '') + (i.numeroComprobante ? ' ' + i.numeroComprobante : '');
    // F. REF.: muestra la fecha del pago si existe; si no y es una
    // mora PENDIENTE (Bloque B), muestra la fecha actual del reporte.
    let fechaPagoStr: string;
    if (i.fechaPago) {
      fechaPagoStr = this.fmtFecha(i.fechaPago);
    } else if (i.bloque === 'PENDIENTE' && fechaActual) {
      fechaPagoStr = this.fmtFechaObj(fechaActual);
    } else {
      fechaPagoStr = '—';
    }
    // Comprobante: vacío para moras PENDIENTES (la celda queda en blanco).
    const compStr = i.bloque === 'PENDIENTE' ? '' : (comp.trim() || '—');
    // Orden de columnas: LETRAS (numero, venc, pago, comp) | MORAS (dias, 5%, diar, mora)
    return [
      i.numeroLetra,
      this.fmtFecha(i.fechaVencimiento),
      fechaPagoStr,
      compStr,
      String(i.diasMora),
      `${simbolo} ${this.fmtNumero(i.montoPorcentaje)}`,
      `${simbolo} ${this.fmtNumero(i.montoDiario)}`,
      `${simbolo} ${this.fmtNumero(i.montoMoraTotal)}`
    ];
  }

  /** Formatea un Date como DD/MM/YYYY (hora local, sin hora/min). */
  private static fmtFechaObj(d: Date): string {
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yy = d.getFullYear();
    return `${dd}/${mm}/${yy}`;
  }

  /** Dibuja el bloque cliente y retorna la Y final ocupada */
  private static drawClienteBlock(doc: jsPDF, c: ContratoResponseDTO, yStart: number): number {
    const labelOpts = { font: 'helvetica' as const, style: 'bold' as const, size: 9, color: [15, 23, 42] as [number, number, number] };
    const valOpts   = { font: 'helvetica' as const, style: 'normal' as const, size: 9, color: [30, 41, 59] as [number, number, number] };
    const pageW = doc.internal.pageSize.getWidth();

    const setLabel = (x: number, y: number, text: string) => {
      doc.setFont(labelOpts.font, labelOpts.style);
      doc.setFontSize(labelOpts.size);
      doc.setTextColor(...labelOpts.color);
      doc.text(text, x, y);
    };
    const setVal = (x: number, y: number, text: string) => {
      doc.setFont(valOpts.font, valOpts.style);
      doc.setFontSize(valOpts.size);
      doc.setTextColor(...valOpts.color);
      doc.text(text.toUpperCase(), x, y);
    };

    const clientes = c.clientes || [];
    const lote     = c.lotes?.[0];
    const simbolo  = c.moneda === 'USD' ? '$' : 'S/';
    const fmtMonto = (n: number) => `${simbolo} ${this.fmtNumero(n)}`;

    let y = yStart;
    const rowH = 5;

    // ── 1) PROGRAMA ─────────────────────────────────────────
    setLabel(14, y, 'PROGRAMA:');
    setVal(36, y, lote?.nombrePrograma || '—');
    y += rowH;

    // ── 2) CLIENTE / DNI ────────────────────────────────────
    const colDerLabel = 160;
    const colDerVal   = 178;
    clientes.forEach((cli, idx) => {
      const etiqueta = clientes.length === 2 ? `CLIENTE ${idx + 1}:` : (idx === 0 ? 'CLIENTE:' : '');
      const nombreFull = `${cli.nombre ?? ''} ${cli.apellidos ?? ''}`.trim();
      setLabel(14, y, etiqueta);
      setVal(36, y, nombreFull || '—');
      setLabel(colDerLabel, y, 'DNI:');
      setVal(colDerVal, y, cli.numDoc || '—');
      y += rowH;
    });

    // ── 3) DIRECCION / DISTRITO ─────────────────────────────
    setLabel(14, y, 'DIRECCION:');
    setVal(36, y, clientes[0]?.direccion || '—');
    setLabel(colDerLabel, y, 'DISTRITO:');
    setVal(colDerVal, y, this.abreviarDistrito(clientes[0]?.distrito?.nombre || '—'));
    y += rowH;

    // ── 4) PRECIO / INICIAL / SALDO ─────────────────────────
    setLabel(14, y, 'PRECIO:');
    setVal(36, y, fmtMonto(c.montoTotal || 0));
    setLabel(78, y, 'INICIAL:');
    setVal(90, y, fmtMonto(c.inicial || 0));
    setLabel(colDerLabel, y, 'SALDO:');
    setVal(colDerVal, y, fmtMonto(c.saldo || 0));
    y += rowH;

    // ── 5) MZ / LT / AREA / CELULAR ─────────────────────────
    setLabel(14, y, 'MANZANA:');
    setVal(36, y, lote?.manzana || '—');
    setLabel(66, y, 'LOTE:');
    setVal(75, y, lote?.numeroLote || '—');
    setLabel(102, y, 'AREA:');
    setVal(112, y, lote?.area ? `${this.fmtNumero(lote.area)} m²` : '—');
    setLabel(colDerLabel, y, 'CELULAR:');
    setVal(colDerVal, y, clientes[0]?.celular || '—');
    y += rowH;

    return y;
  }

  /** Dibuja una micro-banda de color y retorna la Y final */
  private static drawMicroBanda(
    doc: jsPDF, text: string, rgb: [number, number, number],
    x: number, y: number, w: number
  ): number {
    const pageW = doc.internal.pageSize.getWidth();
    if (y > doc.internal.pageSize.getHeight() - 20) {
      doc.addPage();
      y = 16;
    }
    doc.setFillColor(...rgb);
    doc.rect(x, y, pageW - 28, 6, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(255, 255, 255);
    doc.text(text, x + 2, y + 4.2);
    return y + 7;
  }

  private static drawFooterPagina(doc: jsPDF, pageNumber: number, pageW: number) {
    const pageH = doc.internal.pageSize.getHeight();
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(`Página ${pageNumber}`, pageW - 14, pageH - 6, { align: 'right' });
    doc.text('INMOBILIARIA CONSTRUCTORA IVAN E.I.R.L.', 14, pageH - 6);
  }

  private static fmtNumero(n: number): string {
    return (n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  private static fmtFecha(iso: string): string {
    if (!iso) return '—';
    const d = new Date(iso.length === 10 ? iso + 'T00:00:00' : iso);
    if (isNaN(d.getTime())) return iso;
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    return `${dd}/${mm}/${d.getFullYear()}`;
  }

  static abreviarDistrito(nombre: string): string {
    const mapa: Record<string, string> = {
      'SAN MARTIN DE PORRES': 'S.M.P.',
      'SAN JUAN DE LURIGANCHO': 'S.J.L.',
      'VILLA MARIA DEL TRIUNFO': 'V.M.T.',
      'VILLA EL SALVADOR': 'V.E.S.',
      'SANTIAGO DE SURCO': 'SURCO',
      'SAN JUAN DE MIRAFLORES': 'S.J.M.',
      'ATE VITARTE': 'ATE',
      'MAGDALENA DEL MAR': 'MAGDALENA',
      'DISTRITO DE': '',
    };
    const up = nombre.toUpperCase().trim();
    for (const [key, val] of Object.entries(mapa)) {
      if (up.includes(key)) return val;
    }
    return nombre;
  }

  private static formatFechaEmision(d: Date): string {
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yy = d.getFullYear();
    const hh = String(d.getHours()).padStart(2, '0');
    const mi = String(d.getMinutes()).padStart(2, '0');
    return `${dd}/${mm}/${yy}  ${hh}:${mi}`;
  }

}
