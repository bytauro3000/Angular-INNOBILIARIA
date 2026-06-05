import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PagoLetraRequest } from '../dto/pagoletrarequest.dto';
import { PagoLetraResponse } from '../dto/pagoletraresponse.dto';
import { PagosMultiplesRequest } from '../dto/pagosmultiplesrequest.dto';
import { environment } from '../../environments/environment';
import { TipoComprobante } from '../enums/tipocomprobante';

@Injectable({ providedIn: 'root' })
export class PagoLetraService {

  private apiUrl = `${environment.apiUrl}/api/pagos`;
  private comprobanteUrl = `${environment.apiUrl}/api/comprobantes`;

  constructor(private http: HttpClient) {}

  listarPorContrato(idContrato: number): Observable<PagoLetraResponse[]> {
    return this.http.get<PagoLetraResponse[]>(`${this.apiUrl}/contrato/${idContrato}`);
  }

  listarPorLetra(idLetra: number): Observable<PagoLetraResponse[]> {
    return this.http.get<PagoLetraResponse[]>(`${this.apiUrl}/letra/${idLetra}`);
  }

  obtenerPorId(idPago: number): Observable<PagoLetraResponse> {
    return this.http.get<PagoLetraResponse>(`${this.apiUrl}/${idPago}`);
  }

  consultarSaldo(idLetra: number): Observable<{ idLetra: number; saldoPendiente: number }> {
    return this.http.get<{ idLetra: number; saldoPendiente: number }>(
      `${this.apiUrl}/letra/${idLetra}/saldo`
    );
  }

  registrarPago(pago: PagoLetraRequest, vouchers?: File[]): Observable<PagoLetraResponse> {
    const formData = new FormData();
    formData.append('pago', new Blob([JSON.stringify(pago)], { type: 'application/json' }));
    if (vouchers?.length) vouchers.forEach(v => formData.append('vouchers', v));
    return this.http.post<PagoLetraResponse>(`${this.apiUrl}/registrar`, formData);
  }

  registrarPagosMultiples(request: PagosMultiplesRequest, vouchers?: File[]): Observable<any> {
    const formData = new FormData();
    formData.append('pagos', new Blob([JSON.stringify(request)], { type: 'application/json' }));
    if (vouchers?.length) vouchers.forEach(v => formData.append('vouchers', v));
    return this.http.post<any>(`${this.apiUrl}/registrar-multiple`, formData);
  }

  actualizarPago(idPago: number, pago: PagoLetraRequest, vouchers?: File[]): Observable<PagoLetraResponse> {
    const formData = new FormData();
    formData.append('pago', new Blob([JSON.stringify(pago)], { type: 'application/json' }));
    if (vouchers?.length) vouchers.forEach(v => formData.append('vouchers', v));
    return this.http.put<PagoLetraResponse>(`${this.apiUrl}/actualizar/${idPago}`, formData);
  }

  eliminarPago(idPago: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/eliminar/${idPago}`);
  }

  anularPago(idPago: number, motivo: string): Observable<PagoLetraResponse> {
    return this.http.patch<PagoLetraResponse>(`${this.apiUrl}/${idPago}/anular`, { motivo });
  }

  previewSiguienteNumeroComprobante(tipo: TipoComprobante | string): Observable<string> {
    return this.http.get(
      `${this.comprobanteUrl}/preview-siguiente?tipo=${tipo}`,
      { responseType: 'text' }
    );
  }

  sugerirNumeroComprobante(tipo: string): Observable<{ numeroSugerido: string }> {
    return this.http.get<{ numeroSugerido: string }>(`${this.apiUrl}/sugerir-numero?tipoComprobante=${tipo}`);
  }

  descargarComprobanteMultiple(numeroComprobante: string): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/comprobante-multiple/${numeroComprobante}`, { responseType: 'blob' });
  }

  descargarComprobante(idPago: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/${idPago}/comprobante-pdf`, { responseType: 'blob' });
  }
}