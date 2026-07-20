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

  private retryCount = 0;
  private static readonly MAX_RETRIES = 2;
  private static readonly RETRY_DELAY_MS = 15_000;

  private doRefresh(): void {
    if (this.isRefreshing) return;
    this.isRefreshing = true;

    this.loginService.refreshToken().subscribe({
      next: (response) => {
        this.isRefreshing = false;
        this.retryCount = 0;
        this.tokenService.setToken(response.token);
        this.scheduleNext();
      },
      error: (err) => {
        this.isRefreshing = false;
        this.retryCount++;
        console.error(`[TokenRefresh] Error (intento ${this.retryCount}):`, err);

        if (this.retryCount < TokenRefreshService.MAX_RETRIES) {
          this.ngZone.runOutsideAngular(() => {
            this.pendingTimer = setTimeout(() => {
              this.ngZone.run(() => this.doRefresh());
            }, TokenRefreshService.RETRY_DELAY_MS);
          });
          return;
        }

        this.retryCount = 0;
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
