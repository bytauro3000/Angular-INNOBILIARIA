// src/app/app.config.ts
import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http'; // ✅ Usa withInterceptors
import { routes } from './app.routes';
import { AuthInterceptor } from './auth-interceptor'; // ✅ Importa tu función interceptora

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(withInterceptors([AuthInterceptor])), // ✅ Provee el interceptor como una función
  ]
};