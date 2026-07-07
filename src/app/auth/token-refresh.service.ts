import { Injectable, NgZone, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
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
      this.doRefresh();
      return;
    }

    this.ngZone.runOutsideAngular(() => {
      this.pendingTimer = setTimeout(() => {
        this.ngZone.run(() => this.doRefresh());
      }, delay);
    });
  }

  private doRefresh(): void {
    if (this.isRefreshing) return;
    this.isRefreshing = true;

    this.loginService.refreshToken().subscribe({
      next: (response) => {
        this.isRefreshing = false;
        this.tokenService.setToken(response.token);
        this.scheduleNext();
      },
      error: (err) => {
        this.isRefreshing = false;
        console.error('[TokenRefresh] Error al renovar token:', err);
        this.tokenService.removeToken();
        this.loginService.logout().subscribe({ error: () => {} });
        this.router.navigate(['/login']);
      }
    });
  }

  private clearTimer(): void {
    if (this.pendingTimer !== null) {
      clearTimeout(this.pendingTimer);
      this.pendingTimer = null;
    }
  }
}
