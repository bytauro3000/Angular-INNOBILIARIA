import { Injectable } from '@angular/core';
import { forkJoin, Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ContratoService } from './contrato.service';
import { PagoLetraService } from './pagoletra.service';
import { MoraService } from './mora.service';
import { LetrasCambioService } from './letracambio.service';
import { ContratoResponseDTO } from '../dto/contratoreponse.dto';
import { PagoLetraResponse } from '../dto/pagoletraresponse.dto';
import { MoraResponse } from '../dto/moraresponse.dto';
import { LetraCambio } from '../models/letra-cambio.model';
import { HistorialMorasItem } from '../dto/historial-moras-item.dto';
import { calcularMora } from '../utils/mora-calculator';

export interface HistorialMorasData {
  contrato:   ContratoResponseDTO;
  bloqueA:    HistorialMorasItem[];   // Moras REGISTRADAS pendientes (estadoMora = PENDIENTE, no anuladas)
  bloqueAPagadas: HistorialMorasItem[]; // Moras REGISTRADAS pagadas (estadoMora = PAGADO, no suman al total)
  bloqueAAnuladas: HistorialMorasItem[]; // Moras REGISTRADAS pero ANULADAS (tachadas, no suman)
  bloqueB:    HistorialMorasItem[];   // Moras CALCULADAS pendientes
  totalMora:  number;                 // solo pendientes: bloqueA (registradas) + bloqueB (calculadas)
  simboloMoneda: '$' | 'S/';
  fechaEmision: Date;
  kardex:     number;                 // = contrato.idContrato
}

@Injectable({ providedIn: 'root' })
export class ReporteMorasService {

  constructor(
    private contratoService:    ContratoService,
    private pagoLetraService:   PagoLetraService,
    private moraService:        MoraService,
    private letrasService:      LetrasCambioService
  ) {}

  /**
   * Carga todos los datos del reporte HISTORIAL DE MORAS para un contrato.
   * - 4 forkJoin: contrato, pagosLetra, moras, letras
   * - Calcula bloque A (registradas pendientes) + bloque A pagadas + bloque B (calculadas pendientes)
   * - Aplica filtros: pagos a cuenta no cuentan para "letra más alta pagada"
   *                    moras anuladas tachadas y NO suman
   *                    bloque B excluye letras que ya tienen mora registrada
   * @param fechaCalculo Fecha ISO (YYYY-MM-DD) para calcular moras pendientes. Por defecto: hoy.
   */
  cargar(idContrato: number, fechaCalculo?: string): Observable<HistorialMorasData> {
    return forkJoin({
      contrato:  this.contratoService.obtenerContratoPorId(idContrato),
      pagos:     this.pagoLetraService.listarPorContrato(idContrato).pipe(catchError(() => of([] as PagoLetraResponse[]))),
      moras:     this.moraService.listarPorContrato(idContrato).pipe(catchError(() => of([] as MoraResponse[]))),
      letras:    this.letrasService.listarPorContrato(idContrato).pipe(catchError(() => of([] as LetraCambio[])))
    }).pipe(
      map(({ contrato, pagos, moras, letras }) =>
        this.construirHistorial(contrato, pagos, moras, letras, fechaCalculo)
      )
    );
  }

  private construirHistorial(
    contrato: ContratoResponseDTO,
    pagos:    PagoLetraResponse[],
    moras:    MoraResponse[],
    letras:   LetraCambio[],
    fechaCalculo?: string
  ): HistorialMorasData {
    const fechaRef = fechaCalculo ? new Date(fechaCalculo + 'T00:00:00') : new Date();
    const simbolo = contrato.moneda === 'USD' ? '$' : 'S/';

    // ── 1) Letra más alta PAGADA (sin pagos a cuenta) ─────────────────────
    const pagosValidos = pagos.filter(p =>
      p.estadoLetra === 'PAGADO' && p.esPagoAcuenta !== true && !p.anulado
    );
    let highestPaidNumero: number | null = null;
    for (const p of pagosValidos) {
      const n = this.parseNumeroLetra(p.numeroLetra);
      if (n !== null && (highestPaidNumero === null || n > highestPaidNumero)) {
        highestPaidNumero = n;
      }
    }

    // ── 2) Set de idLetra que ya tienen mora registrada ────────────────────
    const idsLetrasConMoraRegistrada = new Set<number>();
    for (const m of moras) idsLetrasConMoraRegistrada.add(m.idLetra);

    // ── 3) Bloque A: moras registradas (separar pendientes, pagadas, anuladas) ──
    const bloqueA: HistorialMorasItem[] = [];
    const bloqueAPagadas: HistorialMorasItem[] = [];
    const bloqueAAnuladas: HistorialMorasItem[] = [];

    for (const m of moras) {
      const pagoLetra = m.idPagoLetra != null
        ? pagos.find(p => p.idPago === m.idPagoLetra && !p.anulado)
        : null;
      const fechaPagoLetra = pagoLetra?.fechaPago        ?? null;
      const tipoComp       = pagoLetra?.tipoComprobante  ?? null;
      const numComp        = pagoLetra?.numeroComprobante ?? null;

      const pagosMoraValidos = m.pagos ?? [];
      const todosPagosAnulados = pagosMoraValidos.length > 0 && pagosMoraValidos.every(p => p.anulado);
      const anulada = m.estadoMora === 'ANULADO' || todosPagosAnulados;
      const pagada = !anulada && m.estadoMora === 'PAGADO';

      const item: HistorialMorasItem = {
        bloque:           'REGISTRADA',
        numeroLetra:      m.numeroLetra,
        fechaVencimiento: m.fechaVencimientoLetra,
        fechaPago:        fechaPagoLetra,
        diasMora:         m.diasMora,
        montoPorcentaje:  m.montoPorcentaje,
        montoDiario:      m.montoDiario,
        montoMoraTotal:   m.montoMoraTotal,
        tipoComprobante:  tipoComp,
        numeroComprobante: numComp,
        anulada,
        pagada,
        idMora:           m.idMora
      };

      if (anulada) {
        bloqueAAnuladas.push(item);
      } else if (pagada) {
        bloqueAPagadas.push(item);
      } else {
        bloqueA.push(item);
      }
    }

    bloqueA.sort((a, b) => this.compararNumero(a.numeroLetra, b.numeroLetra));
    bloqueAPagadas.sort((a, b) => this.compararNumero(a.numeroLetra, b.numeroLetra));
    bloqueAAnuladas.sort((a, b) => this.compararNumero(a.numeroLetra, b.numeroLetra));

    // ── 4) Bloque B: letras vencidas SIN mora registrada ──────────────────
    const bloqueB: HistorialMorasItem[] = [];

    if (highestPaidNumero !== null) {
      for (const l of letras) {
        const num = this.parseNumeroLetra(l.numeroLetra);
        if (num === null) continue;
        if (num <= highestPaidNumero) continue;
        if (idsLetrasConMoraRegistrada.has(l.idLetra)) continue;
        if (!l.fechaVencimiento) continue;
        const venc = new Date(l.fechaVencimiento + 'T00:00:00');
        if (venc >= fechaRef) continue;

        const calc = calcularMora(l.importe, l.fechaVencimiento, fechaRef);

        bloqueB.push({
          bloque:           'PENDIENTE',
          numeroLetra:      l.numeroLetra,
          fechaVencimiento: l.fechaVencimiento,
          fechaPago:        null,
          diasMora:         calc.diasMora,
          montoPorcentaje:  calc.montoPorcentaje,
          montoDiario:      calc.montoDiario,
          montoMoraTotal:   calc.montoMoraTotal,
          tipoComprobante:  null,
          numeroComprobante: null,
          anulada:          false,
          pagada:           false,
          idMora:           null
        });
      }
    }

    bloqueB.sort((a, b) => this.compararNumero(a.numeroLetra, b.numeroLetra));

    // ── 5) Total: solo pendientes (bloqueA registradas + bloqueB calculadas) ──
    const totalBloqueA = bloqueA.reduce((s, i) => s + (i.montoMoraTotal || 0), 0);
    const totalBloqueB = bloqueB.reduce((s, i) => s + (i.montoMoraTotal || 0), 0);
    const totalMora    = totalBloqueA + totalBloqueB;

    return {
      contrato,
      bloqueA,
      bloqueAPagadas,
      bloqueAAnuladas,
      bloqueB,
      totalMora,
      simboloMoneda: simbolo,
      fechaEmision:  fechaRef,
      kardex:        contrato.idContrato
    };
  }

  /** "5" → 5, "12" → 12, "1/120" → 1, "M-5" → 5, null si no parsea */
  private parseNumeroLetra(s: string | undefined | null): number | null {
    if (!s) return null;
    const m = String(s).match(/\d+/);
    return m ? parseInt(m[0], 10) : null;
  }

  private compararNumero(a: string, b: string): number {
    const na = this.parseNumeroLetra(a) ?? 0;
    const nb = this.parseNumeroLetra(b) ?? 0;
    return na - nb;
  }
}
