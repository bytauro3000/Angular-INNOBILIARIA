// src/app/auth-interceptor.ts
import { HttpInterceptorFn, HttpRequest, HttpHandlerFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { TokenService } from './token.service';

export const AuthInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn) => {
  const tokenService = inject(TokenService);
  const token = tokenService.getToken();

  // Clona la solicitud original
  let clonedRequest = req;

  // Si el token existe, agrega la cabecera de autorización
  if (token) {
    clonedRequest = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  // Continúa con la solicitud modificada
  return next(clonedRequest);
};