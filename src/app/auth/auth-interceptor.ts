import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError } from 'rxjs';
import { TokenService } from './token.service';
import { TokenRefreshService } from './token-refresh.service';

export const AuthInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn) => {
  const tokenService = inject(TokenService);
  const refreshService = inject(TokenRefreshService);
  const router = inject(Router);

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
      if (error.status !== 401) {
        return throwError(() => error);
      }

      return refreshService.refreshToken().pipe(
        switchMap((newToken) => {
          const retryRequest = reqWithCredentials.clone({
            setHeaders: { Authorization: `Bearer ${newToken}` }
          });
          return next(retryRequest);
        }),
        catchError(() => {
          tokenService.removeToken();
          router.navigate(['/login']);
          return throwError(() => error);
        })
      );
    })
  );
};
