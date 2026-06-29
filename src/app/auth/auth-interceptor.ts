import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError } from 'rxjs';
import { TokenService } from './token.service';
import { LoginService } from './login.service';

let isRefreshing = false;

export const AuthInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn) => {
  const tokenService = inject(TokenService);
  const loginService = inject(LoginService);
  const router = inject(Router);

  // Las peticiones de auth usan withCredentials para enviar/recibir cookies
  const reqWithCredentials = req.clone({ withCredentials: true });

  if (req.url.includes('/auth/refresh') || req.url.includes('/auth/login')) {
    return next(reqWithCredentials);
  }

  const token = tokenService.getToken();
  const clonedRequest = token
    ? reqWithCredentials.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : reqWithCredentials;

  return next(clonedRequest).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && !isRefreshing) {
        isRefreshing = true;

        // El refresh token viaja automáticamente en la cookie HttpOnly
        return loginService.refreshToken().pipe(
          switchMap((response) => {
            isRefreshing = false;
            tokenService.setToken(response.token);
            const retryRequest = reqWithCredentials.clone({
              setHeaders: { Authorization: `Bearer ${response.token}` }
            });
            return next(retryRequest);
          }),
          catchError((refreshError) => {
            isRefreshing = false;
            tokenService.removeToken();
            loginService.logout().subscribe({
              error: () => {} // ignorar error de logout
            });
            router.navigate(['/login']);
            return throwError(() => refreshError);
          })
        );
      }

      if (error.status === 403) {
        console.warn('Acceso denegado (403) en:', req.url);
      }

      return throwError(() => error);
    })
  );
};