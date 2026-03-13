import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
// Ajusta estas rutas según cómo tengas organizadas tus carpetas
import { UsuarioService } from '../../services/usuario.service'; 
import { UsuarioListadoDTO} from '../../dto/UsuarioListadoDTO';
import { UsuarioRegistroDTO } from '../../dto/UsuarioRegistroDTO';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { LogoutService } from '../../auth/logout.service';

@Component({
  selector: 'app-admin-menu',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './admin-menu.html',
  styleUrls: ['./admin-menu.scss']
})
export class AdminMenuComponent implements OnInit {

  usuarios: UsuarioListadoDTO[] = [];
  usuariosFiltrados: UsuarioListadoDTO[] = []; // Para el buscador
  cargando: boolean = false; // Estado del loader

  // Variables del Modal
  usuarioForm!: FormGroup;
  mostrarModal: boolean = false;
  tituloModal: string = 'Registrar Usuario';
  modoAccion: 'registrar' | 'editar' | 'ver' = 'registrar';
  usuarioSeleccionadoId?: number; // Para saber a quién editamos/cambiamos estado

  // Variables para la Notificación (Toast)
  toast = { mostrar: false, mensaje: '', tipo: 'success' };

  constructor(
    private fb: FormBuilder,
    private usuarioService: UsuarioService,
    private router: Router,
    private logoutService: LogoutService
  ) {}

  ngOnInit(): void {
    this.inicializarFormulario();
    this.cargarUsuarios();
  }

  inicializarFormulario(): void {
    this.usuarioForm = this.fb.group({
      nombres: ['', Validators.required],
      apellidos: ['', Validators.required],
      correo: ['', [Validators.required, Validators.email]],
      contrasena: ['', Validators.required],
      dni: ['', [Validators.required, Validators.maxLength(8)]],
      telefono: [''],
      direccion: [''],
      idRol: ['', Validators.required],
      estado: ['activo', Validators.required]
    });
  }

cargarUsuarios(): void {
    this.cargando = true; // Mostramos animación
    this.usuarioService.listarUsuarios().subscribe({
      next: (data) => {
        this.usuarios = data;
        this.usuariosFiltrados = data; // Inicialmente mostramos todos
        this.cargando = false; // Ocultamos animación
      },
      error: (err) => {
        this.mostrarNotificacion('Error al cargar los datos', 'error');
        this.cargando = false;
      }
    });
  }

  // --- BUSCADOR EN TIEMPO REAL ---
  filtrarUsuarios(criterio: string, evento: any): void {
    const termino = evento.target.value.toLowerCase();
    this.usuariosFiltrados = this.usuarios.filter(u => {
      if (criterio === 'Nombres y Apellidos') {
        return (u.nombres + ' ' + u.apellidos).toLowerCase().includes(termino);
      }
      if (criterio === 'Correo') {
        return u.correo.toLowerCase().includes(termino);
      }
      return true;
    });
  }

  // --- CERRAR SESIÓN ---
  cerrarSesion(): void {
    this.logoutService.logout();
}

  // --- NOTIFICACIONES MEJORADAS ---
  mostrarNotificacion(mensaje: string, tipo: 'success' | 'error'): void {
    this.toast = { mostrar: true, mensaje, tipo };
    setTimeout(() => {
      this.toast.mostrar = false; // Se oculta sola después de 3 segundos
    }, 3000);
  }

  // --- MODIFICACIÓN EN GUARDAR USUARIO ---
  guardarUsuario(): void {
    if (this.usuarioForm.invalid) return;

    // getRawValue() extrae los valores incluso de los campos deshabilitados (como el correo en edición)
    const dto: UsuarioRegistroDTO = this.usuarioForm.getRawValue();

    if (this.modoAccion === 'registrar') {
      this.usuarioService.registrarUsuario(dto).subscribe({
        next: () => {
          this.mostrarNotificacion('Usuario registrado correctamente', 'success');
          this.cerrarModal();
          this.cargarUsuarios(); // Refresca la tabla
        },
        error: () => this.mostrarNotificacion('Error al registrar usuario', 'error')
      });
    } else if (this.modoAccion === 'editar' && this.usuarioSeleccionadoId) {
      
      // NUEVA LÓGICA DE EDICIÓN LLAMANDO AL SERVICIO
      this.usuarioService.editarUsuario(this.usuarioSeleccionadoId, dto).subscribe({
        next: () => {
          this.mostrarNotificacion('Usuario actualizado correctamente', 'success');
          this.cerrarModal();
          this.cargarUsuarios(); // Refresca la tabla
        },
        error: () => this.mostrarNotificacion('Error al actualizar usuario', 'error')
      });
    }
  }

  // --- MÉTODO PARA CAMBIAR ESTADO ---
  cambiarEstado(usuario: UsuarioListadoDTO): void {
    // NUEVA LÓGICA DE CAMBIO DE ESTADO LLAMANDO AL SERVICIO
    this.usuarioService.cambiarEstado(usuario.id).subscribe({
      next: () => {
        const nuevoEstado = usuario.estado.toLowerCase() === 'activo' ? 'inactivado' : 'activado';
        this.mostrarNotificacion(`Usuario ${usuario.nombres} ha sido ${nuevoEstado}`, 'success');
        this.cargarUsuarios(); // Refresca la tabla para ver el cambio de color en el badge
      },
      error: () => {
        this.mostrarNotificacion('Error al cambiar el estado del usuario', 'error');
      }
    });
  }

  // --- MÉTODOS PARA ABRIR EL MODAL ---

  abrirModalRegistro(): void {
    this.modoAccion = 'registrar';
    this.tituloModal = 'Registrar Nuevo Usuario';
    this.usuarioForm.reset({ estado: 'activo' }); // Limpia y deja estado activo por defecto
    this.usuarioForm.enable(); // Habilita todos los campos
    
    // Al registrar, la contraseña es obligatoria
    this.usuarioForm.get('contrasena')?.setValidators(Validators.required);
    this.usuarioForm.get('contrasena')?.updateValueAndValidity();
    
    this.mostrarModal = true;
  }

  abrirModalVer(usuario: UsuarioListadoDTO): void {
    this.modoAccion = 'ver';
    this.tituloModal = 'Detalles del Usuario';
    this.llenarFormulario(usuario);
    this.usuarioForm.disable(); // Todo en solo lectura
    this.mostrarModal = true;
  }

  abrirModalEditar(usuario: UsuarioListadoDTO): void {
    this.modoAccion = 'editar';
    this.tituloModal = 'Editar Usuario';
    this.usuarioSeleccionadoId = usuario.id;
    this.llenarFormulario(usuario);
    this.usuarioForm.enable(); 
    
    // Al editar, bloqueamos el correo para que no lo cambien y la contraseña no es obligatoria
    this.usuarioForm.get('correo')?.disable(); 
    this.usuarioForm.get('contrasena')?.clearValidators();
    this.usuarioForm.get('contrasena')?.updateValueAndValidity();
    
    this.mostrarModal = true;
  }

  cerrarModal(): void {
    this.mostrarModal = false;
  }

  // --- MÉTODOS DE APOYO ---

  llenarFormulario(usuario: UsuarioListadoDTO): void {
    // Mapeamos el nombre del rol al ID numérico del select
    let idRolSelect = 3; // Por defecto
    if (usuario.rol === 'Secretaria') idRolSelect = 1;
    if (usuario.rol === 'Soporte') idRolSelect = 2;
    if (usuario.rol === 'Administrador') idRolSelect = 3;

    this.usuarioForm.patchValue({
      nombres: usuario.nombres,
      apellidos: usuario.apellidos,
      correo: usuario.correo,
      telefono: usuario.telefono || '',
      dni: usuario.dni || '',
      direccion: usuario.direccion || '',
      idRol: idRolSelect,
      estado: usuario.estado.toLowerCase()
    });
  }
}