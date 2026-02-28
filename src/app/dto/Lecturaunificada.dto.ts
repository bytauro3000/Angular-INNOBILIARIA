export interface LecturaUnificadaDTO {
    idContrato: number;
    clienteNombre: string;
    manzana: string;
    lote: string;
    
    // 💡 BLOQUE LUZ
    inscritoLuz: boolean;     // Gris si es false
    lecturaAntLuz: number;
    lecturaActLuz: number | null; // Amarillo si es null o igual a la anterior
    consumoLuz: number;
    importeLuz: number;
    errorLuz?: boolean;
    
    // 💧 BLOQUE AGUA
    inscritoAgua: boolean;    // Gris si es false
    lecturaAntAgua: number;
    lecturaActAgua: number | null; // Amarillo si es null o igual a la anterior
    consumoAgua: number;
    importeAgua: number;
    errorAgua?: boolean;
}