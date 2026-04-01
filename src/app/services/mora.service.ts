import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { CalculoMoraDTO } from '../dto/calculomora.dto';
import { MoraResponse } from '../dto/moraresponse.dto';
import { MoraResumenContratoDTO } from '../dto/moraresumencontrato.dto';
import { PagoMoraRequest } from '../dto/pagomorarequest.dto';
import { PagoMoraResponse } from '../dto/pagomoraresponse.dto';

@Injectable({ providedIn: 'root' })
export class MoraService {

  private apiUrl = `${environment.apiUrl}/api/moras`;

  constructor(private http: HttpClient) {}

  calcularMora(idLetra: number): Observable<CalculoMoraDTO> {
    return this.http.get<CalculoMoraDTO>(`${this.apiUrl}/calcular/${idLetra}`);
  }

  listarPorContrato(idContrato: number): Observable<MoraResponse[]> {
    return this.http.get<MoraResponse[]>(`${this.apiUrl}/contrato/${idContrato}`);
  }

  listarPendientesPorContrato(idContrato: number): Observable<MoraResponse[]> {
    return this.http.get<MoraResponse[]>(`${this.apiUrl}/contrato/${idContrato}/pendientes`);
  }

  listarPorLetra(idLetra: number): Observable<MoraResponse[]> {
    return this.http.get<MoraResponse[]>(`${this.apiUrl}/letra/${idLetra}`);
  }

  obtenerResumenPorContrato(idContrato: number): Observable<MoraResumenContratoDTO> {
    return this.http.get<MoraResumenContratoDTO>(`${this.apiUrl}/contrato/${idContrato}/resumen`);
  }

  pagarMora(request: PagoMoraRequest): Observable<PagoMoraResponse> {
    return this.http.post<PagoMoraResponse>(`${this.apiUrl}/pagar`, request);
  }

  anularMora(idMora: number, motivo: string = ''): Observable<MoraResponse> {
    return this.http.patch<MoraResponse>(
      `${this.apiUrl}/${idMora}/anular`,
      null,
      { params: new HttpParams().set('motivo', motivo) }
    );
  }

  /**
   * Consulta al backend el siguiente número de comprobante disponible.
   * El backend considera TANTO pago_letras como pago_mora, por lo que
   * la secuencia de BOLETA / RECIBO / FACTURA es siempre continua.
   */
  sugerirNumeroComprobante(tipoComprobante: string): Observable<{ numeroSugerido: string }> {
    return this.http.get<{ numeroSugerido: string }>(
      `${this.apiUrl}/sugerir-numero?tipoComprobante=${tipoComprobante}`
    );
  }

  /**
   * Descarga el comprobante PDF de un pago de mora específico.
   * GET /api/moras/pago/{idPagoMora}/comprobante-pdf
   */
  descargarComprobante(idPagoMora: number): Observable<Blob> {
    return this.http.get(
      `${this.apiUrl}/pago/${idPagoMora}/comprobante-pdf`,
      { responseType: 'blob' }
    );
  }

  crearMoraPendiente(idLetra: number): Observable<any> {
  return this.http.post(`${this.apiUrl}/crear-pendiente/${idLetra}`, {});
}
}