import { extractVoucherData } from './voucher-parser';

function op(text: string): string | null {
  return extractVoucherData(text).numeroOperacion;
}

describe('voucher-parser - numero de operacion', () => {
  it('Continental: "Número de operación: <valor>"', () => {
    const text = 'Pago realizado con éxito\nNúmero de operación: 8899001122\nFecha: 24/09/2026';
    expect(op(text)).toBe('8899001122');
  });

  it('Pichincha: "Operación:" con valor en la misma línea', () => {
    const text = 'Transferencia exitosa\nOperación: 87654321\nFecha: 24/09/2026';
    expect(op(text)).toBe('87654321');
  });

  it('Pichincha: "Operación:" con valor en la línea siguiente', () => {
    const text = 'PICHINCHA\nOperación:\n12345678';
    expect(op(text)).toBe('12345678');
  });

  it('Depósito físico: "NRO. OPERACION: <valor>"', () => {
    const text = 'DEPOSITO EN CUENTA\nNRO. OPERACION: 55667788\n24/09/2026';
    expect(op(text)).toBe('55667788');
  });

  it('Otros bancos: "Código de operación: <valor>"', () => {
    const text = 'Operación aprobada\nCódigo de operación: 44332211';
    expect(op(text)).toBe('44332211');
  });

  it('Agente: "N° OPE: <valor>"', () => {
    const text = 'AGENTE BANCARIO\nN° OPE: 10111213';
    expect(op(text)).toBe('10111213');
  });

  it('No confunde "Fecha de operación" con el número de operación', () => {
    const text = 'FECHA DE OPERACIÓN: 24/09/2026\nOperación: 30313233';
    expect(op(text)).toBe('30313233');
  });

  it('Devuelve null cuando solo hay fecha de operación (sin número)', () => {
    const text = 'Fecha de operación: 24/09/2026\nMonto: 196.00';
    expect(op(text)).toBeNull();
  });

  it('Lee el valor aunque haya una línea en blanco después de la etiqueta', () => {
    const text = 'Número de operación:\n\n1234567890';
    expect(op(text)).toBe('1234567890');
  });

  it('Ignora la fecha cuando la etiqueta viene sin número propio', () => {
    const text = 'COMPROBANTE\nFECHA DE OPERACION 24/09/2026 Total: 196.00';
    expect(op(text)).toBeNull();
  });

  it('Funciona con texto previo típico de mensajes aprobados', () => {
    const text = 'TRANSACCIÓN APROBADA\nSu pago se realizó con éxito\nOperación: 123456';
    expect(op(text)).toBe('123456');
  });
});

describe('voucher-parser - fecha de pago', () => {
  it('Fecha en formato largo en español', () => {
    expect(extractVoucherData('Fecha: 24 de septiembre de 2026').fechaPago).toBe('2026-09-24');
  });

  it('Fecha en formato numérico dd/mm/yyyy', () => {
    expect(extractVoucherData('Fecha: 24/09/2026').fechaPago).toBe('2026-09-24');
  });
});

describe('voucher-parser - hora de operacion', () => {
  const hora = (text: string): string | null => extractVoucherData(text).horaOperacion;

  it('Label "Hora:" con hh:mm:ss', () => {
    expect(hora('Transferencia exitosa\nFecha: 24/09/2026\nHora: 14:35:22')).toBe('14:35:22');
  });

  it('Label "Hora:" con hh:mm agrega segundos en cero', () => {
    expect(hora('Hora: 09:05')).toBe('09:05:00');
  });

  it('Fecha y hora en una sola línea', () => {
    expect(hora('Operación realizada el 24/09/2026 14:35')).toBe('14:35:00');
  });

  it('Formato con puntos (14.35.22)', () => {
    expect(hora('14.35.22')).toBe('14:35:22');
  });

  it('Formato 12h con p. m.', () => {
    expect(hora('Realizado a las 2:35 p. m.')).toBe('14:35:00');
  });

  it('Formato 12h con a. m. y las 12', () => {
    expect(hora('12:05 a.m.')).toBe('00:05:00');
  });

  it('No confunde la fecha con puntos (20.09.2026) con una hora', () => {
    expect(hora('Fecha: 20.09.2026')).toBeNull();
  });

  it('Descarta horarios de atención (varias horas)', () => {
    expect(hora('Horario: 08:00 - 18:00')).toBeNull();
    expect(hora('Llegó 10:00 y salió 18:00')).toBeNull();
  });

  it('Linea de atención con una sola hora también se descarta', () => {
    expect(hora('Atención al cliente: 08:00')).toBeNull();
  });

  it('Voucher sin hora devuelve null', () => {
    expect(hora('Pago realizado\nFecha: 24/09/2026\nOperación: 123456')).toBeNull();
  });

  it('La hora no afecta los demás campos', () => {
    const d = extractVoucherData('Operación: 30313233\nFecha: 24/09/2026\nHora: 14:35:22');
    expect(d.numeroOperacion).toBe('30313233');
    expect(d.fechaPago).toBe('2026-09-24');
    expect(d.horaOperacion).toBe('14:35:22');
  });
});
