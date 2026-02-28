import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { UsuarioRegistroDTO} from '../dto/UsuarioRegistroDTO';
import { UsuarioListadoDTO } from '../dto/UsuarioListadoDTO';
import { environment } from '../../environments/environment'; // Importamos el environment para usar la URL base

@Injectable({
  providedIn: 'root'
})
export class UsuarioService {

  // Apunta a tu Gateway (puerto 8080)
  private apiUrl = `${environment.apiUrl}/api/usuarios`; 

  constructor(private http: HttpClient) { }

  registrarUsuario(usuario: UsuarioRegistroDTO): Observable<any> {
    return this.http.post(`${this.apiUrl}/registrar`, usuario);
  }

  listarUsuarios(): Observable<UsuarioListadoDTO[]> {
    return this.http.get<UsuarioListadoDTO[]>(`${this.apiUrl}/listar`);
  }

  // 3. Editar usuario (PUT) - NUEVO
  editarUsuario(id: number, usuario: UsuarioRegistroDTO): Observable<any> {
    return this.http.put(`${this.apiUrl}/editar/${id}`, usuario);
  }

  // 4. Cambiar estado (PATCH) - NUEVO
  // Enviamos un cuerpo vacío {} porque el ID ya va en la URL
  cambiarEstado(id: number): Observable<any> {
    return this.http.patch(`${this.apiUrl}/cambiar-estado/${id}`, {});
  }
}