import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { LoginService, LoginRequest } from '../login.service';
import { jwtDecode } from 'jwt-decode';
import { TokenService } from '../token.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html',
  styleUrls: ['./login.scss']
})
export class LoginComponent implements OnInit {
  loginRequest: LoginRequest = {
    correo: '',
    contrasena: ''
  };
  recordar: boolean = false;
  verContrasena: boolean = false;

  constructor(
    private loginService: LoginService,
    private router: Router,
    private tokenService: TokenService,
    private toastr: ToastrService
  ) { }

  ngOnInit(): void {
    const correoGuardado = localStorage.getItem('remembered_email');
    if (correoGuardado) {
      this.loginRequest.correo = correoGuardado;
      this.recordar = true;
    }
  }

  togglePassword(): void {
    this.verContrasena = !this.verContrasena;
  }

  onLogin(): void {
    this.tokenService.removeToken();

    this.loginService.login(this.loginRequest).subscribe({
      next: (response) => {
        if (this.recordar) {
          localStorage.setItem('remembered_email', this.loginRequest.correo);
        } else {
          localStorage.removeItem('remembered_email');
        }

        const token = response.token;
        this.tokenService.setToken(token);

        const decodedToken: any = jwtDecode(token);
        const userRole = decodedToken.rol;

        this.toastr.success('¡Bienvenido al SGI!', 'Acceso Exitoso');

        switch (userRole) {
          case 'ROLE_SECRETARIA':
            this.router.navigate(['/secretaria-menu']);
            break;
          case 'ROLE_SOPORTE':
            this.router.navigate(['/soporte-menu']);
            break;
          case 'ROLE_ADMINISTRADOR':
            this.router.navigate(['/admin-menu']);
            break;
          default:
            this.router.navigate(['/']);
        }
      },
      error: (err) => {
        console.error('Login fallido:', err);
        this.toastr.error('Correo o contraseña incorrectos', 'Error de Acceso', {
          timeOut: 3000,
          progressBar: true,
          positionClass: 'toast-top-right'
        });
      }
    });
  }
}