import { Component, OnInit, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { IdleTimeoutService } from './auth/idle-timeout.service';


@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit {
  protected readonly title = signal('frontend');

  constructor(private idleTimeoutService: IdleTimeoutService) {}

  ngOnInit(): void {
    this.idleTimeoutService.startWatching();
  }
}
