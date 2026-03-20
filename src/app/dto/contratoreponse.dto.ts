import { ClienteResponseDTO } from "./clienteresponse.dto";
import { LoteResponseDTO } from "./lote-response.dto";
import { LetraResponseDTO } from "./letra-response.dto";
import { EstadoContrato } from "../enums/Estadocontrato.enum";
import { VendedorResponseDTO } from "./vendedorreponse.dto";
import { Moneda } from "./moneda.enum";

export interface ContratoResponseDTO {
    idContrato: number;
    fechaContrato: Date;
    tipoContrato: string;
    estadoContrato: EstadoContrato;
    montoTotal: number;
    inicial: number;
    saldo: number;
    cantidadLetras: number;
    observaciones: string;
    moneda: Moneda;
    clientes: ClienteResponseDTO[];
    lotes: LoteResponseDTO[];
    letras: LetraResponseDTO[];
    vendedor?: VendedorResponseDTO;
    tieneLuz: boolean;
    tieneAgua: boolean;
}