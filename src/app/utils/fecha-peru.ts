export function obtenerFechaPeru(): string {
  const formatter = new Intl.DateTimeFormat('es-PE', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    timeZone: 'America/Lima'
  });
  const parts = formatter.formatToParts(new Date());
  const year  = parts.find(p => p.type === 'year')!.value;
  const month = parts.find(p => p.type === 'month')!.value;
  const day   = parts.find(p => p.type === 'day')!.value;
  return `${year}-${month}-${day}`;
}
