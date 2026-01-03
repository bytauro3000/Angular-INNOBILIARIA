import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Vendedor } from '../models/vendedor.model';

@Injectable({
  providedIn: 'root'
})
export class VendedorService {

  private apiUrl = 'https://inmobiliariaivan.onrender.com/api/vendedores';

  constructor(private http: HttpClient) {}

  // LISTAR
  listarVendedores(): Observable<Vendedor[]> {
    return this.http.get<Vendedor[]>(this.apiUrl);
  }

  // OBTENER POR ID
  obtenerVendedorPorId(id: number): Observable<Vendedor> {
    return this.http.get<Vendedor>(`${this.apiUrl}/${id}`);
  }

  // CREAR
  crearVendedor(vendedor: Vendedor): Observable<Vendedor> {
    return this.http.post<Vendedor>(this.apiUrl, vendedor);
  }

  // ACTUALIZAR
  actualizarVendedor(id: number, vendedor: Vendedor): Observable<Vendedor> {
    return this.http.put<Vendedor>(`${this.apiUrl}/${id}`, vendedor);
  }

  // ELIMINAR
  eliminarVendedor(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  // ✅ EXPORTAR EXCEL
  exportarExcel(): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/reporte-excel`, {
      responseType: 'blob'  // <- importante
    });
  }
}
