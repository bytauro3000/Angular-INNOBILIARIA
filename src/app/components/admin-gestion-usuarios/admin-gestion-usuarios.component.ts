import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { UsuarioService } from '../../services/usuario.service';
import { UsuarioListadoDTO } from '../../dto/UsuarioListadoDTO';
import { UsuarioRegistroDTO } from '../../dto/UsuarioRegistroDTO';

@Component({
  selector: 'app-admin-gestion-usuarios',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './admin-gestion-usuarios.html',
  styleUrls: ['./admin-gestion-usuarios.scss']
})
export class AdminGestionUsuariosComponent implements OnInit {

  usuarios: UsuarioListadoDTO[] = [];
  usuariosFiltrados: UsuarioListadoDTO[] = [];
  cargando = false;

  usuarioForm!: FormGroup;
  mostrarModal = false;
  tituloModal = 'Registrar Usuario';
  modoAccion: 'registrar' | 'editar' | 'ver' = 'registrar';
  usuarioSeleccionadoId?: number;

  toast = { mostrar: false, mensaje: '', tipo: 'success' };

  constructor(
    private fb: FormBuilder,
    private usuarioService: UsuarioService
  ) {}

  ngOnInit(): void {
    this.inicializarFormulario();
    this.cargarUsuarios();
  }

  inicializarFormulario(): void {
    this.usuarioForm = this.fb.group({
      nombres:    ['', Validators.required],
      apellidos:  ['', Validators.required],
      correo:     ['', [Validators.required, Validators.email]],
      contrasena: ['', Validators.required],
      dni:        ['', [Validators.required, Validators.maxLength(8)]],
      telefono:   [''],
      direccion:  [''],
      idRol:      ['', Validators.required],
      estado:     ['activo', Validators.required]
    });
  }

  cargarUsuarios(): void {
    this.cargando = true;
    this.usuarioService.listarUsuarios().subscribe({
      next: (data) => {
        this.usuarios = data;
        this.usuariosFiltrados = data;
        this.cargando = false;
      },
      error: () => {
        this.mostrarNotificacion('Error al cargar usuarios', 'error');
        this.cargando = false;
      }
    });
  }

  filtrarUsuarios(criterio: string, evento: any): void {
    const termino = evento.target.value.toLowerCase();
    this.usuariosFiltrados = this.usuarios.filter(u => {
      if (criterio === 'Nombres y Apellidos')
        return (u.nombres + ' ' + u.apellidos).toLowerCase().includes(termino);
      if (criterio === 'Correo')
        return u.correo.toLowerCase().includes(termino);
      return true;
    });
  }

  guardarUsuario(): void {
    if (this.usuarioForm.invalid) return;
    const dto: UsuarioRegistroDTO = this.usuarioForm.getRawValue();

    if (this.modoAccion === 'registrar') {
      this.usuarioService.registrarUsuario(dto).subscribe({
        next: () => {
          this.mostrarNotificacion('Usuario registrado correctamente', 'success');
          this.cerrarModal();
          this.cargarUsuarios();
        },
        error: () => this.mostrarNotificacion('Error al registrar usuario', 'error')
      });
    } else if (this.modoAccion === 'editar' && this.usuarioSeleccionadoId) {
      this.usuarioService.editarUsuario(this.usuarioSeleccionadoId, dto).subscribe({
        next: () => {
          this.mostrarNotificacion('Usuario actualizado correctamente', 'success');
          this.cerrarModal();
          this.cargarUsuarios();
        },
        error: () => this.mostrarNotificacion('Error al actualizar usuario', 'error')
      });
    }
  }

  cambiarEstado(usuario: UsuarioListadoDTO): void {
    this.usuarioService.cambiarEstado(usuario.id).subscribe({
      next: () => {
        const estado = usuario.estado.toLowerCase() === 'activo' ? 'inactivado' : 'activado';
        this.mostrarNotificacion(`Usuario ${usuario.nombres} ha sido ${estado}`, 'success');
        this.cargarUsuarios();
      },
      error: () => this.mostrarNotificacion('Error al cambiar estado', 'error')
    });
  }

  abrirModalRegistro(): void {
    this.modoAccion = 'registrar';
    this.tituloModal = 'Registrar Nuevo Usuario';
    this.usuarioForm.reset({ estado: 'activo' });
    this.usuarioForm.enable();
    this.usuarioForm.get('contrasena')?.setValidators(Validators.required);
    this.usuarioForm.get('contrasena')?.updateValueAndValidity();
    this.mostrarModal = true;
  }

  abrirModalVer(usuario: UsuarioListadoDTO): void {
    this.modoAccion = 'ver';
    this.tituloModal = 'Detalles del Usuario';
    this.llenarFormulario(usuario);
    this.usuarioForm.disable();
    this.mostrarModal = true;
  }

  abrirModalEditar(usuario: UsuarioListadoDTO): void {
    this.modoAccion = 'editar';
    this.tituloModal = 'Editar Usuario';
    this.usuarioSeleccionadoId = usuario.id;
    this.llenarFormulario(usuario);
    this.usuarioForm.enable();
    this.usuarioForm.get('correo')?.disable();
    this.usuarioForm.get('contrasena')?.clearValidators();
    this.usuarioForm.get('contrasena')?.updateValueAndValidity();
    this.mostrarModal = true;
  }

  cerrarModal(): void { this.mostrarModal = false; }

  llenarFormulario(usuario: UsuarioListadoDTO): void {
    let idRolSelect = 3;
    if (usuario.rol === 'Secretaria')    idRolSelect = 1;
    if (usuario.rol === 'Soporte')       idRolSelect = 2;
    if (usuario.rol === 'Administrador') idRolSelect = 3;

    this.usuarioForm.patchValue({
      nombres:   usuario.nombres,
      apellidos: usuario.apellidos,
      correo:    usuario.correo,
      telefono:  usuario.telefono  || '',
      dni:       usuario.dni       || '',
      direccion: usuario.direccion || '',
      idRol:     idRolSelect,
      estado:    usuario.estado.toLowerCase()
    });
  }

  mostrarNotificacion(mensaje: string, tipo: 'success' | 'error'): void {
    this.toast = { mostrar: true, mensaje, tipo };
    setTimeout(() => { this.toast.mostrar = false; }, 3000);
  }
}