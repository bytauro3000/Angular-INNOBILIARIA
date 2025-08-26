// src/app/app.config.ts

import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { routes } from './app.routes';
import { AuthInterceptor } from './auth-interceptor';
import { provideToastr } from 'ngx-toastr';
import { provideAnimations } from '@angular/platform-browser/animations';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(withInterceptors([AuthInterceptor])),
    provideToastr({
      timeOut: 5000, //El mensaje desaparecerá después de 5 segundos
      positionClass: 'toast-bottom-right', // Opcional: Define la posición esquina derecha inferior
      preventDuplicates: true, //Opcional: Evita mensajes duplicados
    }),
    provideAnimations()
  ]
};