export interface CalculoMoraDTO {
  idLetra: number;
  numeroLetra: string;
  importeLetra: number;
  fechaVencimiento: string;
  fechaCalculo: string;
  diasMora: number;
  montoPorcentaje: number;   // importe * 5%
  montoDiario: number;       // días * $1
  montoMoraTotal: number;
  tieneMoraPrevia: boolean;
  idMoraPrevia: number | null;
}