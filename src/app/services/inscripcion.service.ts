import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { InscripcionServicioDTO } from '../dto/InscripcionServicio.dto';
import { TipoServicios } from '../enums/tiposervicio';
import { TipoComprobante } from '../enums/tipocomprobante';
import { MedioPago } from '../enums/mediopago.enum';
import { InscripcionResumenDTO } from '../dto/InscripcionResumen.dto';
import { AbonoInscripcionRequest } from '../dto/AbonoInscripcionRequest.dto';

export interface AbonoInscripcionResponse {
  idPagoInscripcionComprobante: number;
  numeroComprobante:            string;
  tipoServicio:                 string;
  idContrato:                   number;
}

export interface SaldoInscripcionDTO {
  idInscripcion:  number;
  saldoPendiente: number;
}

export interface PagoInscripcionMsDTO {
  idPagoInscripcion: number;
  montoPagado:       number;
  fechaPago:         string;
  metodoPago:        string;
}

export interface PagoInscripcionDTO {
  idPagoInscripcionComprobante: number;
  idContrato:        number;
  importePagado:     number;
  fechaPago:         string;
  medioPago:         MedioPago;
  numeroOperacion:   string | null;
  observaciones:     string | null;
  tipoComprobante:   TipoComprobante;
  numeroComprobante: string;
  fechaEmision:      string;
  tipoServicio:      string;
  manzana:           string | null;
  numeroLote:        string | null;
  idPrograma:        number | null;
  nombrePrograma:    string | null;
  // Campos admin
  anulado?:          boolean;
  motivoAnulacion?:  string;
  fechaAnulacion?:   string;
  anuladoPor?:       string;
  nombreCliente?:    string;
  moneda?:           'USD' | 'PEN';
}

@Injectable({
  providedIn: 'root'
})
export class InscripcionService {

  private readonly URL_GATEWAY     = `${environment.apiUrl}/api/gateway/inscripciones`;
  private readonly URL_COMPROBANTE = `${environment.apiUrl}/api/comprobantes`;

  constructor(private http: HttpClient) {}

  listarResumen(): Observable<InscripcionResumenDTO[]> {
    return this.http.get<InscripcionResumenDTO[]>(`${this.URL_GATEWAY}/resumen`);
  }

  listarPagos(): Observable<PagoInscripcionDTO[]> {
    return this.http.get<PagoInscripcionDTO[]>(`${this.URL_GATEWAY}/pagos`);
  }

  listarPendientesPorContrato(idContrato: number): Observable<InscripcionServicioDTO[]> {
    return this.http.get<InscripcionServicioDTO[]>(
      `${this.URL_GATEWAY}/pendientes/${idContrato}`
    );
  }

  registrarInscripcion(idContrato: number, tipoServicio: string): Observable<InscripcionServicioDTO> {
    const payload: Partial<InscripcionServicioDTO> = { idContrato, tipoServicio };
    return this.http.post<InscripcionServicioDTO>(`${this.URL_GATEWAY}/registrar`, payload);
  }

  registrarAbono(
    idInscripcion: number,
    request: AbonoInscripcionRequest
  ): Observable<AbonoInscripcionResponse> {
    return this.http.post<AbonoInscripcionResponse>(
      `${this.URL_GATEWAY}/${idInscripcion}/abonar`,
      request
    );
  }

  obtenerSaldo(idInscripcion: number): Observable<SaldoInscripcionDTO> {
    return this.http.get<SaldoInscripcionDTO>(
      `${this.URL_GATEWAY}/${idInscripcion}/saldo`
    );
  }

  listarAbonos(idInscripcion: number): Observable<PagoInscripcionMsDTO[]> {
    return this.http.get<PagoInscripcionMsDTO[]>(
      `${this.URL_GATEWAY}/${idInscripcion}/abonos`
    );
  }

  obtenerContratosConServicio(tipo: TipoServicios): Observable<number[]> {
    const params = new HttpParams().set('tipo', tipo.toString());
    return this.http.get<number[]>(`${this.URL_GATEWAY}/contratos-activos`, { params });
  }

  eliminarInscripcion(idInscripcion: number): Observable<void> {
    return this.http.delete<void>(`${this.URL_GATEWAY}/${idInscripcion}`);
  }

  descargarComprobante(idPagoInscripcionComprobante: number): Observable<Blob> {
    return this.http.get(
      `${this.URL_GATEWAY}/pago/${idPagoInscripcionComprobante}/comprobante-pdf`,
      { responseType: 'blob' }
    );
  }

  previewSiguienteNumeroComprobante(tipo: TipoComprobante): Observable<string> {
    return this.http.get(
      `${this.URL_COMPROBANTE}/preview-siguiente?tipo=${tipo}`,
      { responseType: 'text' }
    );
  }
}