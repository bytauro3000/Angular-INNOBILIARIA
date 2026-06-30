import { Injectable, inject, NgZone, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { LoginService } from './login.service';
import { TokenService } from './token.service';
import { ToastrService } from 'ngx-toastr';

@Injectable({
  providedIn: 'root'
})
export class IdleTimeoutService implements OnDestroy {
  private readonly IDLE_TIMEOUT_MS = 60 * 60 * 1000; // 1 hora
  private readonly WARNING_BEFORE_MS = 10 * 1000; // 10 segundos antes
  private readonly ACTIVITY_EVENTS = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];

  private readonly loginService = inject(LoginService);
  private readonly tokenService = inject(TokenService);
  private readonly router = inject(Router);
  private readonly toastr = inject(ToastrService);
  private readonly ngZone = inject(NgZone);

  private timerId: ReturnType<typeof setTimeout> | null = null;
  private warningTimerId: ReturnType<typeof setTimeout> | null = null;
  private listeners: (() => void)[] = [];
  private isWatching = false;

  startWatching(): void {
    if (this.isWatching) {
      return;
    }

    if (!this.tokenService.getToken()) {
      return;
    }

    this.isWatching = true;

    this.ngZone.runOutsideAngular(() => {
      const resetHandler = () => this.resetTimer();

      this.ACTIVITY_EVENTS.forEach(eventName => {
        document.addEventListener(eventName, resetHandler, { passive: true });
        this.listeners.push(() => document.removeEventListener(eventName, resetHandler));
      });

      this.resetTimer();
    });
  }

  stopWatching(): void {
    if (!this.isWatching) {
      return;
    }

    this.isWatching = false;

    this.clearTimers();
    this.listeners.forEach(remove => remove());
    this.listeners = [];
  }

  ngOnDestroy(): void {
    this.stopWatching();
  }

  private clearTimers(): void {
    if (this.timerId) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
    if (this.warningTimerId) {
      clearTimeout(this.warningTimerId);
      this.warningTimerId = null;
    }
  }

  private resetTimer(): void {
    this.clearTimers();

    const warningMs = this.IDLE_TIMEOUT_MS - this.WARNING_BEFORE_MS;

    // Mostrar advertencia antes del cierre
    this.warningTimerId = setTimeout(() => {
      this.ngZone.run(() => {
        this.toastr.warning(
          'Tu sesión se cerrará en 10 segundos por inactividad',
          'Sesión próxima a expirar',
          { timeOut: 8000, progressBar: true }
        );
      });
    }, warningMs);

    // Cerrar sesión
    this.timerId = setTimeout(() => {
      this.ngZone.run(() => {
        this.stopWatching();
        this.toastr.info('Sesión cerrada por inactividad', 'Sesión expirada');
        this.loginService.logout().subscribe({ error: () => {} });
        this.tokenService.removeToken();
        this.router.navigate(['/login']);
      });
    }, this.IDLE_TIMEOUT_MS);
  }
}
