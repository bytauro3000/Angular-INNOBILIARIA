import { ClienteResponseDTO } from "./clienteresponse.dto";
import { LoteResponseDTO } from "./lote-response.dto";
import { LetraResponseDTO } from "./letra-response.dto";

export interface ContratoResponseDTO {
    idContrato: number;
    fechaContrato: Date;
    tipoContrato: string;
    montoTotal: number;
    inicial: number;
    saldo: number;
    cantidadLetras: number;
    observaciones: string;
    clientes: ClienteResponseDTO[];
    lotes: LoteResponseDTO[];    // 🟢 Agregado
    letras: LetraResponseDTO[];  // 🟢 Agregado
}