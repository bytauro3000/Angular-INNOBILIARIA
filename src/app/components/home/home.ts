import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LandingComponent } from '../landing/landing.component';
import { LandingMerruicComponent } from '../landing-merruic/landing-merruic';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, LandingComponent, LandingMerruicComponent],
  template: `
    <app-landing *ngIf="!isMerruic"></app-landing>
    <app-landing-merruic *ngIf="isMerruic"></app-landing-merruic>
  `
})
export class HomeComponent {
  isMerruic = environment.apiUrl.includes('ms-gateway-latest');
}
