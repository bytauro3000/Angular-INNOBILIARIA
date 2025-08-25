// src/app/auth/login/login-layout.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoginComponent } from './login.component';

@Component({
  selector: 'app-login-layout',
  standalone: true,
  imports: [CommonModule, LoginComponent],
  template: `
    <div class="login-page-container">
      <app-login></app-login>
    </div>
  `,
  styles: [`
    .login-page-container {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      background: linear-gradient(135deg, #0a2342, #4b6587);
      background-size: cover;
    }
  `]
})
export class LoginLayoutComponent {}