import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Cliente } from '../models/cliente.model';

@Injectable({
  providedIn: 'root'
})
export class ClienteService {
  private apiUrl = 'http://localhost:8080/api/clientes';

  constructor(private http: HttpClient) { }

  // 🔹 Listar todos los clientes
  listarClientes(): Observable<Cliente[]> {
    return this.http.get<Cliente[]>(`${this.apiUrl}/listar`);
  }

  // ✅ Nuevo: Obtener cliente por ID para la edición
  obtenerClientePorId(id: number): Observable<Cliente> {
    return this.http.get<Cliente>(`${this.apiUrl}/buscar/${id}`);
  }

  // 🔹 Buscar cliente por número de documento (numDoc)
  obtenerClientePorNumDoc(numDoc: string): Observable<Cliente> {
    return this.http.get<Cliente>(`${this.apiUrl}/buscar/numDoc/${numDoc}`);
  }

  // Nuevo método para buscar clientes por filtro combinado (apellidos + nombres)
  buscarClientesPorFiltro(filtro: string): Observable<Cliente[]> {
    return this.http.get<Cliente[]>(`${this.apiUrl}/buscar/filtro/${filtro}`);
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