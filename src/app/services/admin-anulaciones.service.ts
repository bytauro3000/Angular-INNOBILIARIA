import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { PagoLetraResponse } from '../dto/pagoletraresponse.dto';
import { PagoMoraResponse } from '../dto/pagomoraresponse.dto';
import { PagoInicialResponseDTO } from '../dto/pagoinicialresponse.dto';
import { PagoInscripcionDTO } from './inscripcion.service';

export interface FiltrosAnulacion {
  numeroComprobante?: string;
  programa?:          string;
  manzana?:           string;
  lote?:              string;
  fechaDesde?:        string;
  fechaHasta?:        string;
}

@Injectable({ providedIn: 'root' })
export class AdminAnulacionesService {

  private readonly urlPagos         = `${environment.apiUrl}/api/pagos`;
  private readonly urlMoras         = `${environment.apiUrl}/api/moras`;
  private readonly urlContratos     = `${environment.apiUrl}/api/contratos`;
  private readonly urlInscripciones = `${environment.apiUrl}/api/gateway/inscripciones`;

  constructor(private http: HttpClient) {}

  /* ── PAGOS LETRAS ─────────────────────────────────────── */

  listarPagosLetras(filtros?: FiltrosAnulacion): Observable<PagoLetraResponse[]> {
    const params = this.buildParamsLetras(filtros);
    return this.http.get<PagoLetraResponse[]>(`${this.urlPagos}/todos`, { params });
  }

  anularPagoLetra(idPago: number, motivo: string): Observable<PagoLetraResponse> {
    return this.http.patch<PagoLetraResponse>(`${this.urlPagos}/${idPago}/anular`, { motivo });
  }

  eliminarPagoLetra(idPago: number): Observable<void> {
    return this.http.delete<void>(`${this.urlPagos}/${idPago}`);
  }

  /* ── PAGOS MORAS ──────────────────────────────────────── */

  listarPagosMoras(filtros?: FiltrosAnulacion): Observable<PagoMoraResponse[]> {
    const params = this.buildParamsLetras(filtros);
    return this.http.get<PagoMoraResponse[]>(`${this.urlMoras}/pagos/todos`, { params });
  }

  anularPagoMora(idPagoMora: number, motivo: string): Observable<PagoMoraResponse> {
    return this.http.patch<PagoMoraResponse>(`${this.urlMoras}/pago/${idPagoMora}/anular`, { motivo });
  }

  /* ── PAGOS INICIALES ──────────────────────────────────── */

  listarPagosIniciales(filtros?: FiltrosAnulacion): Observable<PagoInicialResponseDTO[]> {
    const params = this.buildParamsLetras(filtros);
    return this.http.get<PagoInicialResponseDTO[]>(`${this.urlContratos}/pagos-iniciales/todos`, { params });
  }

  anularPagoInicial(idContrato: number, motivo: string): Observable<PagoInicialResponseDTO> {
    return this.http.patch<PagoInicialResponseDTO>(
      `${this.urlContratos}/${idContrato}/pago-inicial/anular`,
      { motivo }
    );
  }

  /* ── PAGOS INSCRIPCIONES ──────────────────────────────── */

  listarPagosInscripciones(filtros?: FiltrosAnulacion): Observable<PagoInscripcionDTO[]> {
    const params = this.buildParamsLetras(filtros);
    return this.http.get<PagoInscripcionDTO[]>(`${this.urlInscripciones}/pagos/todos`, { params });
  }

  anularPagoInscripcion(idPago: number, motivo: string): Observable<any> {
    return this.http.patch(`${this.urlInscripciones}/pago/${idPago}/anular`, { motivo });
  }

  /* ── DESCARGA COMPROBANTE (genérico por tipo) ─────────── */

  descargarComprobanteLetra(idPago: number): Observable<Blob> {
    return this.http.get(`${this.urlPagos}/${idPago}/comprobante-pdf`, { responseType: 'blob' });
  }

  descargarComprobanteMora(idPagoMora: number): Observable<Blob> {
    return this.http.get(`${this.urlMoras}/pago/${idPagoMora}/comprobante-pdf`, { responseType: 'blob' });
  }

  descargarComprobanteInscripcion(idPago: number): Observable<Blob> {
    return this.http.get(`${this.urlInscripciones}/pago/${idPago}/comprobante-pdf`, { responseType: 'blob' });
  }

  descargarComprobanteInicial(idContrato: number): Observable<Blob> {
    return this.http.get(`${this.urlContratos}/${idContrato}/pago-inicial/comprobante-pdf`, { responseType: 'blob' });
  }

  /* ── NOTA DE CREDITO ──────────────────────────────────── */

  enviarNotaCredito(idPago: number, tipoPago: string, codMotivo: string, desMotivo: string): Observable<any> {
    return this.http.post(`${environment.apiUrl}/api/nota-credito/enviar`, {
      idPago, tipoPago, codMotivo, desMotivo
    });
  }

  obtenerMotivosNotaCredito(): Observable<{[key: string]: string}> {
    return this.http.get<{[key: string]: string}>(`${environment.apiUrl}/api/nota-credito/motivos`);
  }

  /* ── Helpers ──────────────────────────────────────────── */

  private buildParams(filtros?: FiltrosAnulacion): HttpParams {
    let params = new HttpParams();
    if (!filtros) return params;
    if (filtros.numeroComprobante) params = params.set('numeroComprobante', filtros.numeroComprobante);
    if (filtros.programa)          params = params.set('programa', filtros.programa);
    if (filtros.manzana)           params = params.set('manzana', filtros.manzana);
    if (filtros.lote)              params = params.set('lote', filtros.lote);
    if (filtros.fechaDesde)        params = params.set('fechaDesde', filtros.fechaDesde);
    if (filtros.fechaHasta)        params = params.set('fechaHasta', filtros.fechaHasta);
    return params;
  }

  private buildParamsLetras(filtros?: FiltrosAnulacion): HttpParams {
    let params = new HttpParams();
    if (!filtros) return params;
    if (filtros.numeroComprobante) params = params.set('numeroComprobante', filtros.numeroComprobante);
    if (filtros.manzana)           params = params.set('manzana', filtros.manzana);
    if (filtros.lote)              params = params.set('numeroLote', filtros.lote);
    if (filtros.fechaDesde)        params = params.set('desde', filtros.fechaDesde);
    if (filtros.fechaHasta)        params = params.set('hasta', filtros.fechaHasta);
    return params;
  }
}