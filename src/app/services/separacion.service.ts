import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { SeparacionDTO } from '../dto/separacion.dto'; 

@Injectable({
  providedIn: 'root'
})
export class SeparacionService {

  // URL base de tu API de Spring Boot para separaciones
  private apiUrl = 'http://localhost:8080/api/separaciones'; 

  constructor(private http: HttpClient) { }

  buscarSeparaciones(filtro: string): Observable<SeparacionDTO[]> {
    // Realiza una petición GET al endpoint con el parámetro 'filtro'
    return this.http.get<SeparacionDTO[]>(`${this.apiUrl}/buscar`, { params: { filtro } });
  }
}
