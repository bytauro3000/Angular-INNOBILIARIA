// src/app/dto/lote-programa-response.dto.ts
export interface LoteProgramaDTO {
  idLote: number;
  manzana: string;
  numeroLote: string;
  area: number;

  idPrograma: number;
  nombrePrograma: string;
  precioM2: number;
}
