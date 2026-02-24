import { Injectable } from '@angular/core';
// 1. Asegúrate de importar HttpHeaders
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http'; 
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { InscripcionServicioDTO } from '../dto/inscripcionservicio.model';
import { TipoServicios } from '../enums/tiposervicio';

@Injectable({
  providedIn: 'root'
})
export class InscripcionService {

  private readonly URL_GATEWAY = `${environment.apiUrl}/api/gateway/inscripciones`;

  constructor(private http: HttpClient) { }

  registrarInscripcion(inscripcion: InscripcionServicioDTO): Observable<InscripcionServicioDTO> {
    // 2. Extraer el token del localStorage (donde lo guarda tu login)
    const token = localStorage.getItem('token'); 
    // 3. Crear las cabeceras con el Bearer Token
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    // 4. Pasar las cabeceras en la petición
    return this.http.post<InscripcionServicioDTO>(
      `${this.URL_GATEWAY}/registrar`, 
      inscripcion, 
      { headers }
    );
  }

  obtenerContratosConServicio(tipo: TipoServicios): Observable<number[]> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });
    
    const params = new HttpParams().set('tipo', tipo.toString());
    // También debes proteger el GET
    return this.http.get<number[]>(`${this.URL_GATEWAY}/contratos-activos`, { 
      params, 
      headers 
    });
  }
}