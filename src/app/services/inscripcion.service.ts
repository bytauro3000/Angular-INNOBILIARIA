import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { InscripcionServicioDTO } from '../dto/inscripcionservicio.model';
import { TipoServicios } from '../enums/tiposervicio';
import { TipoComprobante } from '../enums/tipocomprobante';
import { MedioPago } from '../enums/mediopago.enum';

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

export interface InscripcionResumenDTO {
  idContrato:     number;
  nombreCliente:  string;
  manzana:        string;
  numeroLote:     string;
  tieneLuz:       boolean;
  tieneAgua:      boolean;
}

export interface PagoInscripcionDTO {
  idPagoInicial:     number;
  idContrato:        number;
  importePagado:     number;
  fechaPago:         string;
  medioPago:         MedioPago;
  numeroOperacion:   string | null;
  observaciones:     string | null;
  tipoComprobante:   TipoComprobante;
  numeroComprobante: string;
  fechaEmision:      string;
  tipoServicio:      string;   // "LUZ" | "AGUA" | "SERVICIO"

  // Datos del lote y programa
  manzana:           string | null;
  numeroLote:        string | null;
  idPrograma:        number | null;
  nombrePrograma:    string | null;
}

@Injectable({
  providedIn: 'root'
})
export class InscripcionService {

  private readonly URL_GATEWAY    = `${environment.apiUrl}/api/gateway/inscripciones`;
  private readonly URL_COMPROBANTE = `${environment.apiUrl}/api/comprobantes`;

  constructor(private http: HttpClient) { }

  // ── Lista resumen (contratos con tieneLuz/tieneAgua) ─────────────────────
  listarResumen(): Observable<InscripcionResumenDTO[]> {
    return this.http.get<InscripcionResumenDTO[]>(`${this.URL_GATEWAY}/resumen`);
  }

  // ── Lista todos los pagos de inscripción con sus comprobantes ─────────────
  listarPagos(): Observable<PagoInscripcionDTO[]> {
    return this.http.get<PagoInscripcionDTO[]>(`${this.URL_GATEWAY}/pagos`);
  }

  // ── Registro simple (sin comprobante) ────────────────────────────────────
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

  // ── Registro con comprobante ──────────────────────────────────────────────
  registrarConPago(request: InscripcionConPagoRequest): Observable<InscripcionConPagoResponse> {
    return this.http.post<InscripcionConPagoResponse>(
      `${this.URL_GATEWAY}/registrar-con-pago`,
      request
    );
  }

  // ── Eliminar inscripción por idInscripcion (del microservicio) ────────────
  eliminarInscripcion(idInscripcion: number): Observable<void> {
    return this.http.delete<void>(`${this.URL_GATEWAY}/${idInscripcion}`);
  }

  // ── PDF comprobante ───────────────────────────────────────────────────────
  descargarComprobante(idPagoInicial: number): Observable<Blob> {
    return this.http.get(
      `${this.URL_GATEWAY}/pago/${idPagoInicial}/comprobante-pdf`,
      { responseType: 'blob' }
    );
  }

  // ── Preview número de comprobante ─────────────────────────────────────────
  previewSiguienteNumeroComprobante(tipo: TipoComprobante): Observable<string> {
    return this.http.get(
      `${this.URL_COMPROBANTE}/preview-siguiente?tipo=${tipo}`,
      { responseType: 'text' }
    );
  }
}