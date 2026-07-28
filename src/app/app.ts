import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { IdleTimeoutService } from './auth/idle-timeout.service';
import { TokenRefreshService } from './auth/token-refresh.service';
import { EmpresaService } from './services/empresa.service';
import { Title, Meta } from '@angular/platform-browser';


@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit {

  constructor(
    private idleTimeoutService: IdleTimeoutService,
    private tokenRefreshService: TokenRefreshService,
    private empresaService: EmpresaService,
    private titleService: Title,
    private metaService: Meta,
  ) {}

  ngOnInit(): void {
    this.idleTimeoutService.startWatching();
    this.tokenRefreshService.start();
    this.empresaService.obtenerEmpresa().subscribe(e => {
      if (!e) return;
      const nombre = e.nombreComercial || 'Inmobiliaria Ivan';
      this.titleService.setTitle(nombre + ' - Venta de Lotes');
      this.metaService.updateTag({ name: 'description', content: e.nombreLegal + ' - Venta de lotes de vivienda con título de propiedad, financiamiento directo y servicios básicos.' });
      this.metaService.updateTag({ name: 'keywords', content: 'lotes, terrenos, inmobiliaria, venta de lotes, ' + nombre });
      this.metaService.updateTag({ property: 'og:title', content: nombre + ' - Lotes en Venta' });
      this.metaService.updateTag({ property: 'og:description', content: 'Venta de lotes de vivienda con título de propiedad. Financiamiento directo.' });
      const favicon = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
      if (favicon && (e.logoSmallUrl || e.logoUrl)) favicon.href = e.logoSmallUrl || e.logoUrl;
    });
  }
}
