// src/app/dto/reporte-letra-cambio.dto.ts
export interface ReporteLetraCambioDTO {
  numeroLetra: string;                
  fechaGiro: string;                 
  fechaVencimiento: string;           
  importe: number;                   
  importeLetras: string;              
  distritoNombre: string;          
  cliente1Nombre: string;
  cliente1Apellidos: string;
  cliente1NumDocumento: string;
  cliente2Nombre: string;
  cliente2Apellidos: string | null;
  cliente2NumDocumento: string;
  cliente1Direccion: string;
  cliente1Distrito: string;
}