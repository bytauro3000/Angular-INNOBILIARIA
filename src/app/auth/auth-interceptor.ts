import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { TokenService } from './token.service';

export const AuthInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn) => {
  const tokenService = inject(TokenService);
  const router = inject(Router);
  const token = tokenService.getToken();

  // Adjunta el token JWT a todas las peticiones que lo tengan
  const clonedRequest = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(clonedRequest).pipe(
    catchError((error: HttpErrorResponse) => {

      if (error.status === 401) {
        // Token expirado o inválido según el backend → limpiar y redirigir al login.
        // El usuario verá el login en vez de pantallas en blanco o errores crípticos.
        tokenService.removeToken();
        router.navigate(['/login']);
      }

      if (error.status === 403) {
        // El token es válido pero el rol no tiene permiso para esta acción.
        // Se reenvía el error para que el componente lo muestre con su propio mensaje.
        console.warn('Acceso denegado (403) en:', req.url);
      }

      // Propaga el error para que los componentes puedan reaccionar con su bloque error()
      return throwError(() => error);
    })
  );
};