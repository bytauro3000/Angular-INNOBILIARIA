export interface LetraResponseDTO {
    numeroLetra: string;
    fechaVencimiento: Date; // El JSON de Java lo convertirá a string o Date automáticamente
    importe: number;
    importeLetras: string;
}