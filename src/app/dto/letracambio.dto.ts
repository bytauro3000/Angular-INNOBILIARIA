export interface LetraCambioDTO {
  idLetra: number;
  fechaGiro: string;             // Usamos Date en vez de string
  fechaVencimiento: string;
  importe: number;
  importeLetras: string;
  estadoLetra: string;
  numeroLetra: string;

  idContrato: number;
  nombreCliente: string;

  idDistrito: number;
  nombreDistrito: string;

  fechaPago?: Date | null;
  tipoComprobante?: string | null;
  numeroComprobante?: string | null;
  observaciones?: string | null;
}
