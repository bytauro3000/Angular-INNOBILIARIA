// src/app/app.config.ts

import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { routes } from './app.routes';
import { AuthInterceptor } from './auth/auth-interceptor';
import { provideToastr } from 'ngx-toastr';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideCharts, withDefaultRegisterables } from 'ng2-charts'; // 👈 Importación necesaria

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(withInterceptors([AuthInterceptor])),

    // 🟢 Configuración de Gráficos (Chart.js)
    provideCharts(withDefaultRegisterables()),

    // Mensajes con Toastr - libreria de notificaciones
    provideToastr({
      timeOut: 5000, // El mensaje desaparecerá después de 5 segundos
      positionClass: 'toast-bottom-right', // Opcional: Define la posición esquina derecha inferior
      preventDuplicates: true, // Opcional: Evita mensajes duplicados
    }),
    
    provideAnimations()
  ]
};