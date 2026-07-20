import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Cliente } from '../models/cliente.model';
import { Page } from '../models/page.model';
import { ConsultaDniDTO } from '../dto/consultadni.dto'; 
import { environment } from '../../environments/environment';


@Injectable({
  providedIn: 'root'
})
export class ClienteService {
  private readonly apiUrl = `${environment.apiUrl}/api/clientes`;

  constructor(private http: HttpClient) { }

  // 🔹 Listar todos los clientes (sin paginación - para dropdowns)
  listarClientes(): Observable<Cliente[]> {
    return this.http.get<Cliente[]>(`${this.apiUrl}/listar`);
  }

  // 🔹 Listar clientes con paginación
  listarClientesPaginado(page: number, size: number): Observable<Page<Cliente>> {
    const params = new HttpParams().set('page', page.toString()).set('size', size.toString());
    return this.http.get<Page<Cliente>>(`${this.apiUrl}/listar`, { params });
  }

  // ✅ Nuevo: Obtener cliente por ID para la edición
  obtenerClientePorId(id: number): Observable<Cliente> {
    return this.http.get<Cliente>(`${this.apiUrl}/buscar/${id}`);
  }

  // 🔹 Buscar cliente por número de documento (numDoc)
  obtenerClientePorNumDoc(numDoc: string): Observable<Cliente> {
    return this.http.get<Cliente>(`${this.apiUrl}/buscar/numDoc/${numDoc}`);
  }

  // 🔹 NUEVO: Consultar DNI en API externa a través del Backend
  consultarDniExterno(dni: string): Observable<ConsultaDniDTO> {
    return this.http.get<ConsultaDniDTO>(`${this.apiUrl}/externo/reniec/${dni}`);
  }

  buscarClientesPorFiltro(termino: string, tipo: string): Observable<Cliente[]> {
    // Usamos HttpParams para enviar los parámetros de forma limpia en la URL
    return this.http.get<Cliente[]>(`${this.apiUrl}/buscar/filtro`, {
      params: {
        termino: termino,
        tipo: tipo
      }
    });
  }

  // 🔹 Agregar nuevo cliente
  agregarCliente(cliente: Cliente): Observable<Cliente> {
    return this.http.post<Cliente>(`${this.apiUrl}/agregar`, cliente).pipe(
      catchError(error => {
        let errorMessage = 'Ocurrió un error inesperado al insertar el cliente.';
        if (error.error instanceof ErrorEvent) {
          errorMessage = `Error: ${error.error.message}`;
        } else {
          errorMessage = error.error;
        }
        console.error(errorMessage);
        return throwError(() => new Error(errorMessage));
      })
    );
  }

  // 🔹 Actualizar cliente
  actualizarCliente(id: number, cliente: Cliente): Observable<Cliente> {
    return this.http.put<Cliente>(`${this.apiUrl}/actualizar/${id}`, cliente);
  }

  // 🔹 Eliminar cliente
  eliminarCliente(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/eliminar/${id}`);
  }
}