export interface ReciboConClienteDTO {
    idRecibo: number;
    idContrato: number;
    tipoServicio: string;
    lecturaAnterior: number;
    lecturaActual: number;
    consumoMes: number;
    importeTotal: number;
    fechaGiro: string;
    fechaVencimiento: string;
    estado: string;
    fechaLectura: string;
    nombreCliente: string;
    manzana: string;
    lote: string;
    nombrePrograma?: string;
}