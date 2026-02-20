import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { InscripcionServicioDTO } from '../dto/inscripcionservicio.model';
import { TipoServicios } from '../enums/tiposervicio';

@Injectable({
  providedIn: 'root'
})
export class InscripcionService {

  // La URL base apunta al Gateway del Monolito
  private readonly URL_GATEWAY = `${environment.apiUrl}/api/gateway/inscripciones`;

  constructor(private http: HttpClient) { }

  registrarInscripcion(inscripcion: InscripcionServicioDTO): Observable<InscripcionServicioDTO> {
    return this.http.post<InscripcionServicioDTO>(`${this.URL_GATEWAY}/registrar`, inscripcion);
  }

  obtenerContratosConServicio(tipo: TipoServicios): Observable<number[]> {
    const params = new HttpParams().set('tipo', tipo.toString());
    return this.http.get<number[]>(`${this.URL_GATEWAY}/contratos-activos`, { params });
  }
}
