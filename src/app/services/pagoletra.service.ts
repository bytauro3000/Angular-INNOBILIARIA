import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PagoLetraRequest } from '../dto/pagoletrarequest.dto';
import { PagoLetraResponse } from '../dto/pagoletraresponse.dto';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PagoLetraService {
  private apiUrl = `${environment.apiUrl}/api/pagos`;

  constructor(private http: HttpClient) { }

  listarPorContrato(idContrato: number): Observable<PagoLetraResponse[]> {
    return this.http.get<PagoLetraResponse[]>(`${this.apiUrl}/contrato/${idContrato}`);
  }

  listarPorLetra(idLetra: number): Observable<PagoLetraResponse[]> {
    return this.http.get<PagoLetraResponse[]>(`${this.apiUrl}/letra/${idLetra}`);
  }

  obtenerPorId(idPago: number): Observable<PagoLetraResponse> {
    return this.http.get<PagoLetraResponse>(`${this.apiUrl}/${idPago}`);
  }

  registrarPago(pago: PagoLetraRequest, vouchers?: File[]): Observable<PagoLetraResponse> {
    const formData = new FormData();
    formData.append('pago', new Blob([JSON.stringify(pago)], { type: 'application/json' }));
    if (vouchers && vouchers.length > 0) {
      vouchers.forEach(v => formData.append('vouchers', v));
    }
    return this.http.post<PagoLetraResponse>(`${this.apiUrl}/registrar`, formData);
  }

  registrarPagosMultiples(pagos: PagoLetraRequest[], vouchers?: File[]): Observable<PagoLetraResponse[]> {
    const formData = new FormData();
    const request = { pagos: pagos };
    formData.append('pagos', new Blob([JSON.stringify(request)], { type: 'application/json' }));
    if (vouchers && vouchers.length > 0) {
      vouchers.forEach(v => formData.append('vouchers', v));
    }
    return this.http.post<PagoLetraResponse[]>(`${this.apiUrl}/registrar-multiple`, formData);
  }

  actualizarPago(idPago: number, pago: PagoLetraRequest, vouchers?: File[]): Observable<PagoLetraResponse> {
    const formData = new FormData();
    formData.append('pago', new Blob([JSON.stringify(pago)], { type: 'application/json' }));
    if (vouchers && vouchers.length > 0) {
      vouchers.forEach(v => formData.append('vouchers', v));
    }
    return this.http.put<PagoLetraResponse>(`${this.apiUrl}/actualizar/${idPago}`, formData);
  }

  eliminarPago(idPago: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/eliminar/${idPago}`);
  }

  sugerirNumeroComprobante(tipo: string): Observable<{ numeroSugerido: string }> {
  return this.http.get<{ numeroSugerido: string }>(`${this.apiUrl}/sugerir-numero?tipoComprobante=${tipo}`);
}
}