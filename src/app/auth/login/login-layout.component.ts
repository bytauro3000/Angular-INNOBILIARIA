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
      width: 100%;
      margin: 0;
      padding: 0;
    
      background: linear-gradient(rgba(15, 23, 42, 0.8), rgba(15, 23, 42, 0.7)), 
                  url('https://res.cloudinary.com/dlgqaifrk/image/upload/f_auto,q_auto/v1772147734/floging_oez9ey.png') no-repeat center center;
      background-size: cover !important; /* 🟢 Esto elimina las franjas azules laterales */
      background-attachment: fixed;
    }
  `]
})
export class LoginLayoutComponent {}