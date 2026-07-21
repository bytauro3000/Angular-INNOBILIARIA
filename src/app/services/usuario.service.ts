import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { UsuarioRegistroDTO} from '../dto/UsuarioRegistroDTO';
import { UsuarioListadoDTO } from '../dto/UsuarioListadoDTO';
import { RolUsuario } from '../models/rolusuario.model';
import { Distrito } from '../models/distrito.model';
import { ConsultaDniDTO } from '../dto/consultadni.dto';
import { environment } from '../../environments/environment';

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

  listarRoles(): Observable<RolUsuario[]> {
    return this.http.get<RolUsuario[]>(`${this.apiUrl}/roles`);
  }

  enviarPinVerificacion(correo: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/enviar-pin`, { correo });
  }

  verificarPin(correo: string, pin: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/verificar-pin`, { correo, pin });
  }

  consultarDni(dni: string): Observable<ConsultaDniDTO> {
    return this.http.get<ConsultaDniDTO>(`${this.apiUrl}/consultar-dni/${dni}`);
  }

  listarDepartamentos(): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/departamentos`);
  }

  listarProvincias(departamento: string): Observable<string[]> {
    const params = new HttpParams().set('departamento', departamento);
    return this.http.get<string[]>(`${this.apiUrl}/provincias`, { params });
  }

  listarDistritos(departamento: string, provincia: string): Observable<Distrito[]> {
    const params = new HttpParams().set('departamento', departamento).set('provincia', provincia);
    return this.http.get<Distrito[]>(`${this.apiUrl}/distritos`, { params });
  }
}