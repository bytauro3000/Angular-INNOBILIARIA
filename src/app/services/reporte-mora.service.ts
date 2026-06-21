import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ReporteClientesMoraDTO, FilaClienteMora } from '../dto/reporte-mora.dto';

@Injectable({ providedIn: 'root' })
export class ReporteMoraService {

  private apiUrl = `${environment.apiUrl}/api/reporte-mora`;
  private whatsappUrl = `${environment.apiUrl}/api/whatsapp`;

  constructor(private http: HttpClient) {}

  obtenerClientesEnMora(): Observable<ReporteClientesMoraDTO[]> {
    return this.http.get<ReporteClientesMoraDTO[]>(`${this.apiUrl}/clientes`);
  }

  descargarPdf(): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/clientes/pdf`, { responseType: 'blob' });
  }

  enviarWhatsapp(fila: FilaClienteMora): Observable<any> {
    return this.http.post(`${this.whatsappUrl}/enviar`, {
      idContrato: fila.idContrato,
      celular: fila.celular,
      nombreClientes: fila.nombreClientes,
      importeTotal: fila.importeTotal,
      cantidadLetrasAtrasadas: fila.cantidadLetrasAtrasadas,
      moneda: fila.moneda
    });
  }
}