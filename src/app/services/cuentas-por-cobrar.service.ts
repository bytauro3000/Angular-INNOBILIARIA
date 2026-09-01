import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CuentasPorCobrarDTO } from '../dto/cuentas-por-cobrar.dto';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CuentasPorCobrarService {

  private readonly apiUrl = `${environment.apiUrl}/api/cuentas-por-cobrar`;

  constructor(private http: HttpClient) {}

  obtenerCuentasPorCobrar(): Observable<CuentasPorCobrarDTO> {
    return this.http.get<CuentasPorCobrarDTO>(this.apiUrl);
  }
}