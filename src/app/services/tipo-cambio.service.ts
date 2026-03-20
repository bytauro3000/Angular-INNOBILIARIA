import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface TipoCambioResponse {
  oficial:  number;
  empresa:  number;
  compra:   number;  // oficial + 0.0206 — cliente trae soles, compra dólares
  venta:    number;  // oficial - 0.0054 — cliente trae dólares, vende a la empresa
  respaldo: number;
}

@Injectable({ providedIn: 'root' })
export class TipoCambioService {

  private apiUrl      = `${environment.apiUrl}/api/public/tipo-cambio`;
  private respaldoUrl = `${environment.apiUrl}/api/tipo-cambio/respaldo`;

  constructor(private http: HttpClient) {}

  obtenerTipoCambio(): Observable<TipoCambioResponse> {
    return this.http.get<TipoCambioResponse>(this.apiUrl);
  }

  actualizarRespaldo(valor: number): Observable<any> {
    return this.http.put(this.respaldoUrl, { valor });
  }
}