import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Cliente } from '../models/cliente.model';

@Injectable({
  providedIn: 'root'
})
export class ClienteService {
  // La URL base para todas las peticiones a la API de clientes
  private apiUrl = 'http://localhost:8080/api';

  constructor(private http: HttpClient) { }

  // 🔹 Listar todos los clientes
  listarClientes(): Observable<Cliente[]> {
    return this.http.get<Cliente[]>(`${this.apiUrl}/listarClientes`);
  }

  // 🔹 Buscar cliente por DNI
  obtenerClientePorDni(dni: string): Observable<Cliente> {
    return this.http.get<Cliente>(`${this.apiUrl}/obtenerClientePorDni/${dni}`);
  }

  // 🔹 Buscar clientes por apellidos
  obtenerClientesPorApellidos(apellidos: string): Observable<Cliente[]> {
    return this.http.get<Cliente[]>(`${this.apiUrl}/obtenerClientesPorApellidos/${apellidos}`);
  }

  // 🔹 Agregar nuevo cliente
  agregarCliente(cliente: Cliente): Observable<Cliente> {
    return this.http.post<Cliente>(`${this.apiUrl}/agregarCliente`, cliente);
  }

  // 🔹 Actualizar cliente
  actualizarCliente(id: number, cliente: Cliente): Observable<Cliente> {
    return this.http.post<Cliente>(`${this.apiUrl}/actualizarCliente/${id}`, cliente);
  }

  // 🔹 Eliminar cliente
  eliminarCliente(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/eliminarCliente/${id}`);
  }
}