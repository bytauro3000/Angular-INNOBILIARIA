import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PagoLetraRequest } from '../dto/pagoletrarequest .dto';
import { PagoLetraResponse } from '../dto/pagoletraresponse.dto';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PagoLetraService {
  private apiUrl = `${environment.apiUrl}/api/pagos`;

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

  registrarPago(pago: PagoLetraRequest, voucher?: File): Observable<PagoLetraResponse> {
    const formData = new FormData();
    formData.append('pago', new Blob([JSON.stringify(pago)], { type: 'application/json' }));
    if (voucher) {
      formData.append('voucher', voucher);
    }
    return this.http.post<PagoLetraResponse>(`${this.apiUrl}/registrar`, formData);
  }

  actualizarPago(idPago: number, pago: PagoLetraRequest, voucher?: File): Observable<PagoLetraResponse> {
    const formData = new FormData();
    formData.append('pago', new Blob([JSON.stringify(pago)], { type: 'application/json' }));
    if (voucher) {
      formData.append('voucher', voucher);
    }
    return this.http.put<PagoLetraResponse>(`${this.apiUrl}/actualizar/${idPago}`, formData);
  }

  eliminarPago(idPago: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/eliminar/${idPago}`);
  }
}