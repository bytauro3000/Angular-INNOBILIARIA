import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { InscripcionServicioDTO } from '../dto/inscripcionservicio.model';
import { TipoServicios } from '../enums/tiposervicio';
import { TipoComprobante } from '../enums/tipocomprobante';

export interface InscripcionConPagoRequest {
  idContrato:                    number;
  tipoServicio:                  string;
  montoPagado:                   number;
  fechaPago:                     string;
  medioPago:                     string;
  numeroOperacion?:              string;
  observaciones?:                string;
  tipoComprobante:               TipoComprobante;
  numeroComprobantePersonalizado?: string;
}

export interface InscripcionConPagoResponse {
  idPagoInicial:     number;
  numeroComprobante: string;
  tipoServicio:      string;
  idContrato:        number;
}

@Injectable({
  providedIn: 'root'
})
export class InscripcionService {

  private readonly URL_GATEWAY    = `${environment.apiUrl}/api/gateway/inscripciones`;
  private readonly URL_COMPROBANTE = `${environment.apiUrl}/api/comprobantes`;

  constructor(private http: HttpClient) { }

  // ── Endpoint original ────────────────────────────────────────────────────

  registrarInscripcion(inscripcion: InscripcionServicioDTO): Observable<InscripcionServicioDTO> {
    return this.http.post<InscripcionServicioDTO>(
      `${this.URL_GATEWAY}/registrar`,
      inscripcion
    );
  }

  obtenerContratosConServicio(tipo: TipoServicios): Observable<number[]> {
    const params = new HttpParams().set('tipo', tipo.toString());
    return this.http.get<number[]>(`${this.URL_GATEWAY}/contratos-activos`, { params });
  }

  // ── Nuevos métodos para inscripción con comprobante ──────────────────────

  /**
   * Registra la inscripción de servicio Y genera el comprobante en el monolito.
   * Devuelve el idPagoInicial necesario para descargar el PDF.
   */
  registrarConPago(request: InscripcionConPagoRequest): Observable<InscripcionConPagoResponse> {
    return this.http.post<InscripcionConPagoResponse>(
      `${this.URL_GATEWAY}/registrar-con-pago`,
      request
    );
  }

  /**
   * Descarga el PDF del comprobante de inscripción.
   * Usa el idPagoInicial devuelto por registrarConPago().
   */
  descargarComprobante(idPagoInicial: number): Observable<Blob> {
    return this.http.get(
      `${this.URL_GATEWAY}/pago/${idPagoInicial}/comprobante-pdf`,
      { responseType: 'blob' }
    );
  }

  /**
   * Consulta al backend el siguiente número de comprobante disponible
   * (mismo endpoint genérico que usa pagoletra-insertar).
   */
  previewSiguienteNumeroComprobante(tipo: TipoComprobante): Observable<string> {
    return this.http.get(
      `${this.URL_COMPROBANTE}/preview-siguiente?tipo=${tipo}`,
      { responseType: 'text' }
    );
  }
}