import { Injectable, NgZone, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, filter, switchMap, take, tap, throwError } from 'rxjs';
import { jwtDecode } from 'jwt-decode';
import { TokenService } from './token.service';
import { LoginService } from './login.service';

@Injectable({
  providedIn: 'root'
})
export class TokenRefreshService implements OnDestroy {
  private static readonly SAFETY_MARGIN_MS = 30_000;

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

  /** Refresca el token si es necesario, o se suscribe a uno en curso. */
  refreshToken(): Observable<string> {
    if (!this.isRefreshing) {
      this.isRefreshing = true;
      this.refreshSubject.next(null);
      this.loginService.refreshToken().pipe(
        tap({
          next: (response) => {
            this.isRefreshing = false;
            this.tokenService.setToken(response.token);
            this.refreshSubject.next(response.token);
            this.scheduleNext();
          },
          error: () => {
            this.isRefreshing = false;
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
