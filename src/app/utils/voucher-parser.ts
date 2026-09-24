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
}

export function extractVoucherData(text: string): VoucherFields {
  return {
    numeroOperacion: extractNumeroOperacion(text),
    fechaPago: extractFechaPago(text)
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
