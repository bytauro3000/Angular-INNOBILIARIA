import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class NotificationSoundService {
  private audioContext: AudioContext | null = null;

  playMessageReceived(): void {
    try {
      this.audioContext = this.audioContext || new AudioContext();
      const ctx = this.audioContext;
      const now = ctx.currentTime;

      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(880, now);
      oscillator.frequency.setValueAtTime(1100, now + 0.1);

      gainNode.gain.setValueAtTime(0.3, now);
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.4);

      oscillator.start(now);
      oscillator.stop(now + 0.4);
    } catch {
      // Audio no disponible
    }
  }
}
