import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, ReplaySubject } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { EmpresaPublic, EmpresaResponse, EmpresaRequest } from '../models/empresa.model';

@Injectable({ providedIn: 'root' })
export class EmpresaService {
  private readonly API_URL = environment.apiUrl;
  private cache$: Observable<EmpresaPublic> | null = null;

  constructor(private http: HttpClient) {}

  obtenerEmpresa(): Observable<EmpresaPublic> {
    if (!this.cache$) {
      this.cache$ = this.http.get<EmpresaPublic>(`${this.API_URL}/api/public/empresa`).pipe(
        tap(empresa => console.log('Empresa cargada:', empresa.nombreLegal))
      );
    }
    return this.cache$;
  }

  limpiarCache(): void {
    this.cache$ = null;
  }

  // ── Admin CRUD ────────────────────────────────────────────────────────────

  listarTodas(): Observable<EmpresaResponse[]> {
    return this.http.get<EmpresaResponse[]>(`${this.API_URL}/api/empresa`);
  }

  obtenerPorId(id: number): Observable<EmpresaResponse> {
    return this.http.get<EmpresaResponse>(`${this.API_URL}/api/empresa/${id}`);
  }

  crear(data: EmpresaRequest): Observable<EmpresaResponse> {
    return this.http.post<EmpresaResponse>(`${this.API_URL}/api/empresa`, data).pipe(
      tap(() => this.limpiarCache())
    );
  }

  actualizar(id: number, data: EmpresaRequest): Observable<EmpresaResponse> {
    return this.http.put<EmpresaResponse>(`${this.API_URL}/api/empresa/${id}`, data).pipe(
      tap(() => this.limpiarCache())
    );
  }

  activar(id: number): Observable<EmpresaResponse> {
    return this.http.put<EmpresaResponse>(`${this.API_URL}/api/empresa/${id}/activar`, {}).pipe(
      tap(() => this.limpiarCache())
    );
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/api/empresa/${id}`).pipe(
      tap(() => this.limpiarCache())
    );
  }

  subirLogo(file: File): Observable<{ url: string }> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<{ url: string }>(`${this.API_URL}/api/archivos/subir`, formData);
  }
}
