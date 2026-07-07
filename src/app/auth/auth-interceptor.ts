import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, catchError, filter, switchMap, take, throwError } from 'rxjs';
import { TokenService } from './token.service';
import { LoginService } from './login.service';
import { TokenRefreshService } from './token-refresh.service';

let isRefreshing = false;
const refreshSubject = new BehaviorSubject<string | null>(null);

export const AuthInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn) => {
  const tokenService = inject(TokenService);
  const loginService = inject(LoginService);
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

      if (!isRefreshing) {
        isRefreshing = true;
        refreshSubject.next(null);
        return loginService.refreshToken().pipe(
          switchMap((response) => {
            isRefreshing = false;
            tokenService.setToken(response.token);
            refreshService.scheduleNext();
            refreshSubject.next(response.token);
            const retryRequest = reqWithCredentials.clone({
              setHeaders: { Authorization: `Bearer ${response.token}` }
            });
            return next(retryRequest);
          }),
          catchError((refreshError) => {
            isRefreshing = false;
            refreshSubject.error(refreshError);
            console.error('[Auth] Refresh falló, redirigiendo a login:', refreshError);
            tokenService.removeToken();
            loginService.logout().subscribe({ error: () => {} });
            router.navigate(['/login']);
            return throwError(() => refreshError);
          })
        );
      }

      return refreshSubject.pipe(
        filter(token => token !== null),
        take(1),
        switchMap((newToken) => {
          const retryRequest = reqWithCredentials.clone({
            setHeaders: { Authorization: `Bearer ${newToken}` }
          });
          return next(retryRequest);
        })
      );
    })
  );
};
