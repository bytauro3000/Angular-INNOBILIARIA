import { Injectable, NgZone, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, filter, take, tap, throwError } from 'rxjs';
import { jwtDecode } from 'jwt-decode';
import { TokenService } from './token.service';
import { LoginService } from './login.service';

@Injectable({
  providedIn: 'root'
})
export class TokenRefreshService implements OnDestroy {
  private static readonly SAFETY_MARGIN_MS = 30_000;
  private static readonly LOCK_KEY = 'mr_refresh_lock';
  private static readonly LOCK_TIMEOUT_MS = 15_000;

  private pendingTimer: ReturnType<typeof setTimeout> | null = null;
  private isRefreshing = false;
  private refreshSubject = new BehaviorSubject<string | null>(null);

  constructor(
    private tokenService: TokenService,
    private loginService: LoginService,
    private router: Router,
    private ngZone: NgZone,
  ) {}

  start(): void {
    this.scheduleNext();
  }

  stop(): void {
    this.clearTimer();
  }

  ngOnDestroy(): void {
    this.stop();
  }

  /** Refresca el token si es necesario, o se suscribe a uno en curso.
   *  Con bloqueo cross-tab: solo una pestaña ejecuta el refresh; las demás esperan. */
  refreshToken(): Observable<string> {
    if (this.tryAcquireLock()) {
      return this.doRefresh();
    }
    return this.waitForOtherTab();
  }

  private doRefresh(): Observable<string> {
    if (!this.isRefreshing) {
      this.isRefreshing = true;
      this.refreshSubject.next(null);
      this.loginService.refreshToken().pipe(
        tap({
          next: (response) => {
            this.isRefreshing = false;
            localStorage.removeItem(TokenRefreshService.LOCK_KEY);
            this.tokenService.setToken(response.token);
            this.refreshSubject.next(response.token);
            this.scheduleNext();
          },
          error: () => {
            this.isRefreshing = false;
            localStorage.removeItem(TokenRefreshService.LOCK_KEY);
            this.refreshSubject.error(null);
            this.refreshSubject = new BehaviorSubject<string | null>(null);
          }
        })
      ).subscribe();
    }

    return this.refreshSubject.pipe(
      filter(token => token !== null),
      take(1)
    );
  }

  /** Espera a que otra pestaña termine el refresh y devuelve el token actualizado. */
  private waitForOtherTab(): Observable<string> {
    return new Observable<string>(subscriber => {
      const startToken = this.tokenService.getToken();
      const startExp = startToken ? TokenRefreshService.getExpMs(startToken) : 0;

      const timer = setInterval(() => {
        const lock = localStorage.getItem(TokenRefreshService.LOCK_KEY);
        const currentToken = this.tokenService.getToken();
        const currentExp = currentToken ? TokenRefreshService.getExpMs(currentToken) : 0;

        if (!lock && currentToken && currentExp > startExp) {
          // Otra pestaña terminó y actualizó el token
          clearInterval(timer);
          this.scheduleNext();
          subscriber.next(currentToken);
          subscriber.complete();
          return;
        }
        if (!lock) {
          // Sin lock y token sin actualizar (otra pestaña falló o no hizo nada)
          clearInterval(timer);
          if (currentToken) {
            subscriber.next(currentToken);
          } else {
            subscriber.error(null);
          }
          subscriber.complete();
        }
      }, 250);

      setTimeout(() => {
        clearInterval(timer);
        const t = this.tokenService.getToken();
        if (t) {
          subscriber.next(t);
        } else {
          subscriber.error(null);
        }
        subscriber.complete();
      }, TokenRefreshService.LOCK_TIMEOUT_MS);
    });
  }

  scheduleNext(): void {
    this.clearTimer();

    const token = this.tokenService.getToken();
    if (!token) return;

    let expMs: number;
    try {
      const decoded: { exp: number } = jwtDecode(token);
      expMs = decoded.exp * 1000;
    } catch {
      return;
    }

    const now = Date.now();
    const delay = expMs - now - TokenRefreshService.SAFETY_MARGIN_MS;

    if (delay <= 0) {
      this.refreshToken().subscribe({ error: () => this.logout() });
      return;
    }

    this.ngZone.runOutsideAngular(() => {
      this.pendingTimer = setTimeout(() => {
        this.ngZone.run(() => this.refreshToken().subscribe({ error: () => this.logout() }));
      }, delay);
    });
  }

  private tryAcquireLock(): boolean {
    const now = Date.now();
    const raw = localStorage.getItem(TokenRefreshService.LOCK_KEY);
    if (raw) {
      const lockTime = Number(raw);
      if (now - lockTime < TokenRefreshService.LOCK_TIMEOUT_MS) {
        return false; // otra pestaña tiene el lock
      }
      // lock vencido por timeout → tomarlo
    }
    localStorage.setItem(TokenRefreshService.LOCK_KEY, String(now));
    return true;
  }

  private static getExpMs(token: string): number {
    try {
      const decoded: { exp: number } = jwtDecode(token);
      return decoded.exp * 1000;
    } catch {
      return 0;
    }
  }

  private logout(): void {
    this.tokenService.removeToken();
    this.loginService.logout().subscribe({ error: () => {} });
    this.router.navigate(['/login']);
  }

  private clearTimer(): void {
    if (this.pendingTimer !== null) {
      clearTimeout(this.pendingTimer);
      this.pendingTimer = null;
    }
  }
}
