const MESES: Record<string, string> = {
  ene: '01', feb: '02', mar: '03', abr: '04',
  may: '05', jun: '06', jul: '07', ago: '08',
  set: '09', oct: '10', nov: '11', dic: '12'
};

const ENG_TO_SPA: Record<string, string> = {
  jan: 'ene', apr: 'abr', aug: 'ago',
  sep: 'set', dec: 'dic'
};

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
  const labelPatterns = [
    /N[úu]mero\s+de\s+operaci[oó]n/i,
    /Nro\.?\s+de\s+operaci[oó]n/i,
    /N[°ºo0.\-]?\s*de\s+operaci[oó]n/i,
    /C[oó]digo\s+de\s+operaci[oó]n/i,
    /C[oó]d\.?\s+de\s+operaci[oó]n/i,
    /ID\s+de\s+(?:operaci[oó]n|transacci[oó]n)/i,
    /NRO\.?\s+OPERACI[OÓ]N/i,
    /operaci[oó]n\s+n[úu]mero/i,
    /comprobante\s+n[úu]mero/i
  ];

  for (const pattern of labelPatterns) {
    const match = text.match(pattern);
    if (match && typeof match.index === 'number') {
      const afterLabel = text.substring(match.index + match[0].length);
      const numMatch = afterLabel.match(/[:\-]?\s*(\d[\d.,]*\d|\d)/);
      if (numMatch && numMatch[1]) {
        const cleaned = cleanNumber(numMatch[1]);
        if (cleaned.length >= 4) return cleaned;
      }
    }
  }
  return null;
}

const MONTH_ALT = 'ene(?:ro)?|feb(?:rero)?|mar(?:zo)?|abr(?:il)?|may(?:o)?|jun(?:io)?|jul(?:io)?|ago(?:sto)?|set|sep(?:t(?:iembre)?)?|oct(?:ubre)?|nov(?:iembre)?|dic(?:iembre)?';

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

function cleanNumber(raw: string): string {
  return raw.replace(/[.\s,]/g, '').replace(/[^\d]/g, '').trim();
}
