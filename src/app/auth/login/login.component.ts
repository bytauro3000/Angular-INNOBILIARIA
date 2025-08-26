import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { LoginService, LoginRequest } from '../login.service';
import { jwtDecode } from 'jwt-decode';
import { TokenService } from '../../services/token.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html',
  styleUrls: ['./login.scss']
})
export class LoginComponent {
  loginRequest: LoginRequest = {
    correo: '',
    contrasena: ''
  };
  errorMessage: string | null = null;

  constructor(
    private loginService: LoginService,
    private router: Router,
    private tokenService: TokenService
  ) { }

  onLogin(): void {
    // 🔹 Limpia cualquier token viejo antes de loguear
    this.tokenService.removeToken();

    this.loginService.login(this.loginRequest).subscribe({
      next: (response) => {
        const token = response.token;
        this.tokenService.setToken(token);
        this.errorMessage = null;

        // 🔹 Decodificar el token para obtener el rol
        const decodedToken: any = jwtDecode(token);
        const userRole = decodedToken.rol;

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
        this.errorMessage = 'Usuario o contraseña incorrectos.';
      }
    });
  }
}
