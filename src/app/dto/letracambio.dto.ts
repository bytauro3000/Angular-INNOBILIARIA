export interface LetraCambioDTO {
  idLetra: number;
  fechaGiro: Date;
  fechaVencimiento: Date;
  importe: number;         // BigDecimal en Java → number en TypeScript
  importeLetras: string;
  estadoLetra: string;
  numeroLetra: string;

  idContrato: number;
  nombreCliente: string;
}
