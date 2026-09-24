const MESES: Record<string, string> = {
  ene: '01', feb: '02', mar: '03', abr: '04',
  may: '05', jun: '06', jul: '07', ago: '08',
  set: '09', oct: '10', nov: '11', dic: '12'
};

const ENG_TO_SPA: Record<string, string> = {
  jan: 'ene', apr: 'abr', aug: 'ago',
  sep: 'set', dec: 'dic'
};

const MONTH_ALT = 'ene(?:ro)?|feb(?:rero)?|mar(?:zo)?|abr(?:il)?|may(?:o)?|jun(?:io)?|jul(?:io)?|ago(?:sto)?|set|sep(?:t(?:iembre)?)?|oct(?:ubre)?|nov(?:iembre)?|dic(?:iembre)?';

const FECHA_HORA = /\b(?:fecha|hora)\b/i;

export interface VoucherFields {
  numeroOperacion: string | null;
  fechaPago: string | null;
  /** Hora exacta del voucher en formato HH:mm:ss (null si no se detectó o no es válida). */
  horaOperacion: string | null;
}

export function extractVoucherData(text: string): VoucherFields {
  return {
    numeroOperacion: extractNumeroOperacion(text),
    fechaPago: extractFechaPago(text),
    horaOperacion: extractHoraOperacion(text)
  };
}

function extractNumeroOperacion(text: string): string | null {
  const keywords = /OP(?:ERACI[OÓ]N|\.\s*ERACI[OÓ]N)|N[°ºo0RO.\-]*\s*OP|N[úu]mero\s*Op|N[úu]mero.*[Oo]peraci|C[oó]digo.*[Oo]peraci|ID\s*[Oo]peraci|ID\s*[Tt]ransacci|COMPROBANTE\s*N[°ºo0]|NRO[.:\s]*OP/i;

  const labelPatterns = [
    /N[úu]mero\s+de\s+operaci[oó]n/i,
    /Nro[.:\s]*de\s+operaci[oó]n/i,
    /N[°ºo0.\-]?\s*de\s+operaci[oó]n/i,
    /C[oó]digo[.:\s]*de\s+operaci[oó]n/i,
    /C[oó]d[.:\s]*de\s+operaci[oó]n/i,
    /ID[.:\s]*de\s+(?:operaci[oó]n|transacci[oó]n)/i,
    /NRO[.:\s]*OPERACI[OÓ]N/i,
    /N[°ºo0RO.\-]*\s*OP(?:ERACI[OÓ]N)?/i,
    /OP(?:ERACI[OÓ]N|)\s*N[°ºo0]/i,
    /operaci[oó]n\s+n[úu]mero/i,
    /comprobante\s+n[úu]mero/i,
    /operaci[oó]n(?=\s*[:.])/i
  ];

  for (const pattern of labelPatterns) {
    const match = pattern.exec(text);
    if (!match || typeof match.index !== 'number') continue;
    const num = extraerTrasLabel(text, match.index + match[0].length);
    if (num) return num;
  }

  for (const line of text.split('\n')) {
    const trimmed = line.trim();
    if (!keywords.test(trimmed)) continue;
    const num = extraerEnLinea(trimmed, 0, 10);
    if (num) return num;
  }

  return null;
}

function extraerTrasLabel(text: string, finLabel: number): string | null {
  const salto = text.indexOf('\n', finLabel);
  const finLinea = salto === -1 ? text.length : salto;
  const inicioLinea = text.lastIndexOf('\n', finLabel) + 1;
  const linea = text.substring(inicioLinea, finLinea);
  const num = extraerEnLinea(linea, finLabel - inicioLinea, null);
  if (num) return num;

  let cursor = finLinea + 1;
  for (let i = 0; i < 2 && cursor <= text.length; i++) {
    const sig = text.indexOf('\n', cursor);
    const finSig = sig === -1 ? text.length : sig;
    const lineaSig = text.substring(cursor, finSig);
    const m = lineaSig.match(/^\s*[:\-]?\s*(\d{4,})/);
    if (m && !esParteDeFecha(lineaSig, lineaSig.indexOf(m[1]), m[1])) return m[1];
    cursor = finSig + 1;
  }
  return null;
}

function extraerEnLinea(linea: string, desde: number, tope: number | null): string | null {
  const region = linea.substring(desde);

  const sep = /[:\-]\s*(\d{4,})/g;
  let m: RegExpExecArray | null;
  while ((m = sep.exec(region)) !== null) {
    const pos = desde + m.index + m[0].length - m[1].length;
    if (esNumeroOperacionValido(linea, pos, m[1], tope)) return m[1];
  }

  if (FECHA_HORA.test(region)) return null;

  const suelto = /(\d{4,})/g;
  while ((m = suelto.exec(region)) !== null) {
    const pos = desde + m.index;
    if (esNumeroOperacionValido(linea, pos, m[1], tope)) return m[1];
  }

  return null;
}

function esNumeroOperacionValido(linea: string, pos: number, cand: string, tope: number | null): boolean {
  if (tope !== null && cand.length > tope) return false;
  if (esParteDeFecha(linea, pos, cand)) return false;
  if (FECHA_HORA.test(linea.substring(0, pos)) && /^(?:19|20)\d{2}$/.test(cand)) return false;
  return true;
}

function esParteDeFecha(linea: string, inicio: number, num: string): boolean {
  const antes = linea.substring(0, inicio).trimEnd();
  const despues = linea.substring(inicio + num.length);
  if (/(?:\d{1,2}[\/\-\.])+$/.test(antes)) return true;
  if (/^[-\/\.]\d{1,2}/.test(despues)) return true;
  if (new RegExp(`(?:${MONTH_ALT})\\b(?:\\s+d[ei])?\\s*$`, 'i').test(antes)) return true;
  if (new RegExp(`^\\s*(?:d[ei]\\s+)?(?:${MONTH_ALT})\\b`, 'i').test(despues)) return true;
  return false;
}

function extractFechaPago(text: string): string | null {
  const spanishPattern = new RegExp(
    `(\\d{1,2})\\s+(?:de\\s+)?(${MONTH_ALT})[\\.,]?,?\\s*(?:d[ei]l?\\s+)?(\\d{4})`,
    'i'
  );
  const spanishMatch = text.match(spanishPattern);
  if (spanishMatch) {
    const day = spanishMatch[1].padStart(2, '0');
    const monthKey = spanishMatch[2].toLowerCase().substring(0, 3);
    const normalized = ENG_TO_SPA[monthKey] || monthKey;
    const month = MESES[normalized];
    const year = spanishMatch[3];
    if (month) return `${year}-${month}-${day}`;
  }

  const numericPattern = /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/;
  const numericMatch = text.match(numericPattern);
  if (numericMatch) {
    const day = numericMatch[1].padStart(2, '0');
    const month = numericMatch[2].padStart(2, '0');
    const year = numericMatch[3];
    return `${year}-${month}-${day}`;
  }

  const shortYearPattern = /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2})\b/;
  const shortYearMatch = text.match(shortYearPattern);
  if (shortYearMatch) {
    const day = shortYearMatch[1].padStart(2, '0');
    const month = shortYearMatch[2].padStart(2, '0');
    const year = `20${shortYearMatch[3]}`;
    return `${year}-${month}-${day}`;
  }

  return null;
}

/**
 * Detecta la hora exacta del voucher (HH:mm:ss).
 *
 * Estrategia:
 *  1) Línea con label de hora ("Hora:", "Fecha y hora:") y exactamente una hora
 *     válida → esa hora (prioridad).
 *  2) Se descartan líneas de horario ("Horario", "Atención") y líneas con 2+
 *     horas (rangos como "08:00 - 18:00").
 *  3) Candidatas que caen dentro de una fecha (24.09.2026) se ignoran.
 *  4) Si tras filtrar queda EXACTAMENTE una hora en todo el texto → esa;
 *     0 o varias → null (no se inventa hora).
 */
function extractHoraOperacion(text: string): string | null {
  const candidatas: string[] = [];

  for (const linea of text.split('\n')) {
    const horas = horasValidasDeLinea(linea);
    if (horas.length === 0) continue;
    if (/\b(?:horario|atenci[oó]n|cierre|apertura)\b/i.test(linea)) continue;
    if (horas.length > 1) continue;
    if (/\b(?:fecha\s*[y\/]\s*)?hora\b/i.test(linea)) return horas[0];
    candidatas.push(horas[0]);
  }

  return candidatas.length === 1 ? candidatas[0] : null;
}

function horasValidasDeLinea(linea: string): string[] {
  const fechas: { ini: number; fin: number }[] = [];
  const reFecha = /\b\d{1,2}[\/\-.](?:0[1-9]|1[0-2])[\/\-.]\d{2,4}\b/g;
  let f: RegExpExecArray | null;
  while ((f = reFecha.exec(linea)) !== null) {
    fechas.push({ ini: f.index, fin: f.index + f[0].length });
  }

  const res: string[] = [];
  const reHora = /\b(\d{1,2})\s*[:.]\s*(\d{2})(?:\s*[:.]\s*(\d{2}))?\s*(a\.?\s*m\.?|p\.?\s*m\.?)?/gi;
  let m: RegExpExecArray | null;
  while ((m = reHora.exec(linea)) !== null) {
    const ini = m.index;
    const fin = m.index + m[0].length;
    if (fechas.some(fc => ini < fc.fin && fin > fc.ini)) continue;
    const hora = normalizarHora(m[1], m[2], m[3], m[4]);
    if (hora) res.push(hora);
  }
  return res;
}

function normalizarHora(h: string, min: string, seg: string | undefined, marker: string | undefined): string | null {
  let hh = parseInt(h, 10);
  const mm = parseInt(min, 10);
  const ss = seg ? parseInt(seg, 10) : 0;
  if (mm > 59 || ss > 59) return null;

  const mk = (marker || '').toLowerCase().replace(/[\s.]/g, '');
  if (mk) {
    if (hh > 12) return null;
    if (mk === 'pm' && hh < 12) hh += 12;
    if (mk === 'am' && hh === 12) hh = 0;
  }
  if (hh > 23) return null;

  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;
}
