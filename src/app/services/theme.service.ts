import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly STORAGE_KEY = 'protection-mode';
  private isActiveSubject = new BehaviorSubject<boolean>(false);
  isActive$: Observable<boolean> = this.isActiveSubject.asObservable();

  constructor(@Inject(PLATFORM_ID) private platformId: object) {
    if (isPlatformBrowser(this.platformId)) {
      const saved = localStorage.getItem(this.STORAGE_KEY) === 'true';
      this.setActive(saved);
    }
  }

  toggle(): void {
    this.setActive(!this.isActiveSubject.value);
  }

  private setActive(active: boolean): void {
    this.isActiveSubject.next(active);
    if (isPlatformBrowser(this.platformId)) {
      document.body.classList.toggle('protection-mode', active);
      localStorage.setItem(this.STORAGE_KEY, String(active));
    }
  }
}
