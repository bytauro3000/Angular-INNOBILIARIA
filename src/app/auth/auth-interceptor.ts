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

  if (req.url.includes('/auth/refresh') || req.url.includes('/auth/login')) {
    return next(req);
  }

  const token = tokenService.getToken();
  const clonedRequest = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(clonedRequest).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && !isRefreshing) {
        isRefreshing = true;
        const refreshToken = tokenService.getRefreshToken();

        if (refreshToken) {
          return loginService.refreshToken(refreshToken).pipe(
            switchMap((response) => {
              isRefreshing = false;
              tokenService.setToken(response.token);
              tokenService.setRefreshToken(response.refreshToken);
              const retryRequest = req.clone({
                setHeaders: { Authorization: `Bearer ${response.token}` }
              });
              return next(retryRequest);
            }),
            catchError((refreshError) => {
              isRefreshing = false;
              tokenService.removeToken();
              router.navigate(['/login']);
              return throwError(() => refreshError);
            })
          );
        }

        isRefreshing = false;
        tokenService.removeToken();
        router.navigate(['/login']);
      }

      if (error.status === 403) {
        console.warn('Acceso denegado (403) en:', req.url);
      }

      return throwError(() => error);
    })
  );
};