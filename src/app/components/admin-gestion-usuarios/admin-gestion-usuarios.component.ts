import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { UsuarioService } from '../../services/usuario.service';
import { UsuarioListadoDTO } from '../../dto/UsuarioListadoDTO';
import { UsuarioRegistroDTO } from '../../dto/UsuarioRegistroDTO';
import { RolUsuario } from '../../models/rolusuario.model';

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
  roles: RolUsuario[] = [];
  cargando = false;

  usuarioForm!: FormGroup;
  mostrarModal = false;
  tituloModal = 'Registrar Usuario';
  modoAccion: 'registrar' | 'editar' | 'ver' = 'registrar';
  usuarioSeleccionadoId?: number;

  // Visibilidad de contraseñas
  mostrarContrasena = false;
  mostrarConfirmarContrasena = false;
  mostrarContrasenaActual = false;
  mostrarNuevaContrasena = false;
  mostrarConfirmarNuevaContrasena = false;

  toast = { mostrar: false, mensaje: '', tipo: 'success' };

  constructor(
    private fb: FormBuilder,
    private usuarioService: UsuarioService
  ) {}

  ngOnInit(): void {
    this.inicializarFormulario();
    this.cargarUsuarios();
    this.cargarRoles();
  }

  private confirmarContrasenaValidator(form: AbstractControl): ValidationErrors | null {
    const contrasena = form.get('contrasena')?.value;
    const confirmar = form.get('confirmarContrasena')?.value;
    if (contrasena && confirmar && contrasena !== confirmar) {
      return { contrasenasNoCoinciden: true };
    }
    return null;
  }

  private confirmarNuevaContrasenaValidator(form: AbstractControl): ValidationErrors | null {
    const nueva = form.get('nuevaContrasena')?.value;
    const confirmar = form.get('confirmarNuevaContrasena')?.value;
    if (nueva && confirmar && nueva !== confirmar) {
      return { nuevasContrasenasNoCoinciden: true };
    }
    return null;
  }

  inicializarFormulario(): void {
    this.usuarioForm = this.fb.group({
      nombres:    ['', Validators.required],
      apellidos:  ['', Validators.required],
      correo:     ['', [Validators.required, Validators.email]],
      contrasena: ['', Validators.required],
      confirmarContrasena: ['', Validators.required],
      dni:        ['', [Validators.required, Validators.maxLength(8)]],
      telefono:   [''],
      direccion:  [''],
      idRol:      ['', Validators.required],
      estado:     ['activo', Validators.required],
      // Edición
      contrasenaActual: [''],
      nuevaContrasena: [''],
      confirmarNuevaContrasena: ['']
    }, {
      validators: [this.confirmarContrasenaValidator, this.confirmarNuevaContrasenaValidator]
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

  cargarRoles(): void {
    this.usuarioService.listarRoles().subscribe({
      next: (data) => { this.roles = data; },
      error: () => { console.error('Error al cargar roles'); }
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

    if (this.modoAccion === 'registrar') {
      const { confirmarContrasena, contrasenaActual, nuevaContrasena, confirmarNuevaContrasena, ...dto } = this.usuarioForm.getRawValue();
      this.usuarioService.registrarUsuario(dto).subscribe({
        next: () => {
          this.mostrarNotificacion('Usuario registrado correctamente', 'success');
          this.cerrarModal();
          this.cargarUsuarios();
        },
        error: () => this.mostrarNotificacion('Error al registrar usuario', 'error')
      });
    } else if (this.modoAccion === 'editar' && this.usuarioSeleccionadoId) {
      const raw = this.usuarioForm.getRawValue();
      const dto: UsuarioRegistroDTO = {
        nombres: raw.nombres,
        apellidos: raw.apellidos,
        correo: raw.correo,
        contrasena: raw.nuevaContrasena || raw.contrasena || '',
        dni: raw.dni,
        telefono: raw.telefono,
        direccion: raw.direccion,
        idRol: raw.idRol,
        estado: raw.estado
      };
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
    this.usuarioForm.get('correo')?.enable();
    this.usuarioForm.get('contrasena')?.setValidators(Validators.required);
    this.usuarioForm.get('contrasena')?.updateValueAndValidity();
    this.usuarioForm.get('confirmarContrasena')?.setValidators(Validators.required);
    this.usuarioForm.get('confirmarContrasena')?.updateValueAndValidity();
    this.usuarioForm.get('contrasenaActual')?.clearValidators();
    this.usuarioForm.get('contrasenaActual')?.updateValueAndValidity();
    this.usuarioForm.get('nuevaContrasena')?.clearValidators();
    this.usuarioForm.get('nuevaContrasena')?.updateValueAndValidity();
    this.usuarioForm.get('confirmarNuevaContrasena')?.clearValidators();
    this.usuarioForm.get('confirmarNuevaContrasena')?.updateValueAndValidity();
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
    this.usuarioForm.get('confirmarContrasena')?.clearValidators();
    this.usuarioForm.get('confirmarContrasena')?.updateValueAndValidity();
    this.usuarioForm.get('contrasenaActual')?.clearValidators();
    this.usuarioForm.get('contrasenaActual')?.updateValueAndValidity();
    this.usuarioForm.get('nuevaContrasena')?.clearValidators();
    this.usuarioForm.get('nuevaContrasena')?.updateValueAndValidity();
    this.usuarioForm.get('confirmarNuevaContrasena')?.clearValidators();
    this.usuarioForm.get('confirmarNuevaContrasena')?.updateValueAndValidity();
    this.mostrarModal = true;
  }

  cerrarModal(): void { this.mostrarModal = false; }

  llenarFormulario(usuario: UsuarioListadoDTO): void {
    const rolEncontrado = this.roles.find(r => r.rolUsuario === usuario.rol);
    const idRolSelect = rolEncontrado ? rolEncontrado.idRolUsuario : null;

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

  get contrasenasNoCoinciden(): boolean {
    const form = this.usuarioForm;
    if (this.modoAccion === 'registrar') {
      return (form.hasError('contrasenasNoCoinciden') ?? false) &&
             ((form.get('confirmarContrasena')?.touched || form.get('confirmarContrasena')?.dirty) ?? false);
    }
    return false;
  }

  get nuevasContrasenasNoCoinciden(): boolean {
    const form = this.usuarioForm;
    if (this.modoAccion === 'editar') {
      return (form.hasError('nuevasContrasenasNoCoinciden') ?? false) &&
             ((form.get('confirmarNuevaContrasena')?.touched || form.get('confirmarNuevaContrasena')?.dirty) ?? false);
    }
    return false;
  }
}
