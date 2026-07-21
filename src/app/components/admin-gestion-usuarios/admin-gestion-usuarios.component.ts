import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ToastrService } from 'ngx-toastr';
import { UsuarioService } from '../../services/usuario.service';
import { UsuarioListadoDTO } from '../../dto/UsuarioListadoDTO';
import { UsuarioRegistroDTO } from '../../dto/UsuarioRegistroDTO';
import { RolUsuario } from '../../models/rolusuario.model';
import { Distrito } from '../../models/distrito.model';

@Component({
  selector: 'app-admin-gestion-usuarios',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
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

  emailVerificado = false;
  enviandoPin = false;
  pinEnviado = false;
  verificandoPin = false;
  pinInput = '';
  mostrarModalPin = false;

  consultandoDni = false;
  departamentos: string[] = [];
  provincias: string[] = [];
  distritos: Distrito[] = [];
  departamentoSel = '';
  provinciaSel = '';

  constructor(
    private fb: FormBuilder,
    private usuarioService: UsuarioService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.inicializarFormulario();
    this.cargarUsuarios();
    this.cargarRoles();
    this.cargarDepartamentos();
  }

  onDniInput(): void {
    const dni = this.usuarioForm.get('dni')?.value;
    if (dni && dni.length === 8) {
      this.consultandoDni = true;
      this.usuarioService.consultarDni(dni).subscribe({
        next: (data) => {
          this.consultandoDni = false;
          if (data.success) {
            this.usuarioForm.patchValue({
              nombres: data.full_name?.split(' ')[0] || data.first_name || '',
              apellidos: (data.first_last_name || '') + ' ' + (data.second_last_name || '')
            });
            this.toastr.success('Datos obtenidos desde RENIEC.', 'DNI');
          } else {
            this.toastr.warning('No se encontraron datos para este DNI.', 'RENIEC');
          }
        },
        error: () => {
          this.consultandoDni = false;
          this.toastr.error('Error al consultar DNI.', 'Error');
        }
      });
    }
  }

  cargarDepartamentos(): void {
    this.usuarioService.listarDepartamentos().subscribe({
      next: (data) => { this.departamentos = data; },
      error: () => { console.error('Error al cargar departamentos'); }
    });
  }

  onDepartamentoChange(): void {
    this.provincias = [];
    this.distritos = [];
    this.provinciaSel = '';
    this.usuarioForm.get('idDistrito')?.setValue(null);
    this.usuarioForm.get('idDistrito')?.disable();
    const depto = this.departamentoSel;
    if (depto) {
      this.usuarioService.listarProvincias(depto).subscribe({
        next: (data) => {
          this.provincias = data;
          setTimeout(() => {
            const el = document.querySelector('.select-provincia') as HTMLElement;
            el?.focus();
          }, 100);
        }
      });
    }
  }

  onProvinciaChange(): void {
    this.distritos = [];
    this.usuarioForm.get('idDistrito')?.setValue(null);
    this.usuarioForm.get('idDistrito')?.disable();
    if (this.departamentoSel && this.provinciaSel) {
      this.usuarioService.listarDistritos(this.departamentoSel, this.provinciaSel).subscribe({
        next: (data) => {
          this.distritos = data;
          if (this.modoAccion !== 'ver') {
            this.usuarioForm.get('idDistrito')?.enable();
          }
        }
      });
    }
  }

  onProvinciaClick(): void {
    if (!this.departamentoSel && this.modoAccion !== 'ver') {
      this.toastr.warning('Seleccione un departamento primero.', 'Atención', { timeOut: 2500 });
    }
  }

  onDistritoClick(): void {
    if (this.modoAccion === 'ver') return;
    if (!this.departamentoSel) {
      this.toastr.warning('Seleccione departamento y provincia primero.', 'Atención', { timeOut: 2500 });
    } else if (!this.provinciaSel) {
      this.toastr.warning('Seleccione provincia primero.', 'Atención', { timeOut: 2500 });
    }
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
      celular:    [''],
      direccion:  [''],
      idRol:      ['', Validators.required],
      idDistrito: [''],
      estado:     ['activo'],
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

  enviarPin(): void {
    const correo = this.usuarioForm.get('correo')?.value;
    if (!correo || !correo.includes('@')) {
      this.toastr.warning('Ingrese un correo válido primero.', 'Validación');
      return;
    }
    this.enviandoPin = true;
    this.pinEnviado = false;
    this.emailVerificado = false;
    this.usuarioService.enviarPinVerificacion(correo).subscribe({
      next: () => {
        this.enviandoPin = false;
        this.pinEnviado = true;
        this.pinInput = '';
        this.mostrarModalPin = true;
        this.toastr.success('Código enviado al correo.', 'Verificación');
      },
      error: (err) => {
        this.enviandoPin = false;
        this.toastr.error(err.error?.message || 'Error al enviar código.', 'Error');
      }
    });
  }

  cerrarModalPin(): void {
    this.mostrarModalPin = false;
    this.pinInput = '';
  }

  verificarPin(): void {
    if (!this.pinInput || this.pinInput.length < 4) {
      this.toastr.warning('Ingrese el código completo.', 'Validación');
      return;
    }
    const correo = this.usuarioForm.get('correo')?.value;
    if (!correo) return;

    this.verificandoPin = true;
    this.usuarioService.verificarPin(correo, this.pinInput).subscribe({
      next: () => {
        this.verificandoPin = false;
        this.emailVerificado = true;
        this.mostrarModalPin = false;
        this.pinInput = '';
        this.toastr.success('Correo verificado correctamente.', 'Verificación');
      },
      error: (err) => {
        this.verificandoPin = false;
        this.toastr.error(err.error?.message || 'Código inválido.', 'Error');
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

    if (this.modoAccion === 'registrar') {
      if (!this.emailVerificado) {
        this.toastr.warning('Debe verificar el correo electrónico antes de registrar.', 'Verificación requerida');
        return;
      }
      const raw = this.usuarioForm.getRawValue();
      const dto: UsuarioRegistroDTO = {
        nombres: raw.nombres,
        apellidos: raw.apellidos,
        correo: raw.correo,
        contrasena: raw.contrasena,
        dni: raw.dni,
        telefono: raw.celular,
        direccion: raw.direccion,
        idRol: raw.idRol,
        idDistrito: raw.idDistrito || null,
        estado: 'activo'
      };
      this.usuarioService.registrarUsuario(dto).subscribe({
        next: () => {
          this.mostrarNotificacion('Usuario registrado correctamente', 'success');
          this.cerrarModal();
          this.cargarUsuarios();
        },
        error: (err) => this.mostrarNotificacion(err.error?.message || 'Error al registrar usuario', 'error')
      });
    } else if (this.modoAccion === 'editar' && this.usuarioSeleccionadoId) {
      const raw = this.usuarioForm.getRawValue();
      const dto: UsuarioRegistroDTO = {
        nombres: raw.nombres,
        apellidos: raw.apellidos,
        correo: raw.correo,
        contrasena: raw.nuevaContrasena || raw.contrasena || '',
        dni: raw.dni,
        telefono: raw.celular,
        direccion: raw.direccion,
        idRol: raw.idRol,
        idDistrito: raw.idDistrito || null,
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
    this.emailVerificado = false;
    this.pinEnviado = false;
    this.pinInput = '';
    this.departamentoSel = '';
    this.provinciaSel = '';
    this.provincias = [];
    this.distritos = [];
    this.usuarioForm.get('correo')?.enable();
    this.usuarioForm.get('estado')?.clearValidators();
    this.usuarioForm.get('idDistrito')?.disable();
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
    this.departamentoSel = '';
    this.provinciaSel = '';
    this.provincias = [];
    this.distritos = [];
    this.usuarioForm.get('idDistrito')?.disable();
    this.usuarioForm.enable();
    this.llenarFormulario(usuario);
    this.usuarioForm.get('correo')?.disable();
    this.usuarioForm.get('estado')?.setValidators(Validators.required);
    this.usuarioForm.get('estado')?.updateValueAndValidity();
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
      celular:   usuario.telefono  || '',
      dni:       usuario.dni       || '',
      direccion: usuario.direccion || '',
      idRol:     idRolSelect,
      idDistrito: usuario.idDistrito || null,
      estado:    usuario.estado.toLowerCase()
    });

    const depto = usuario.departamento;
    if (depto) {
      this.departamentoSel = depto;
      this.usuarioService.listarProvincias(depto).subscribe(p => {
        this.provincias = p;
        this.provinciaSel = usuario.provincia || '';
        const prov = usuario.provincia;
        if (prov) {
          this.usuarioService.listarDistritos(depto, prov).subscribe(d => {
            this.distritos = d;
            if (this.modoAccion === 'editar') {
              this.usuarioForm.get('idDistrito')?.enable();
            }
          });
        }
      });
    }
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
