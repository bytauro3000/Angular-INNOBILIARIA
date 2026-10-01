import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import { environment } from './environments/environment';
 
import { registerLocaleData } from '@angular/common';
import localeEs   from '@angular/common/locales/es';
import localeEsPe from '@angular/common/locales/es-PE';
 
// Registrar ambos: 'es' (usado en pipes del template) y 'es-PE' (locale regional)
registerLocaleData(localeEs,   'es');
registerLocaleData(localeEsPe, 'es-PE');

// PWA multi-marca: el meta theme-color de index.html es el de IVAN (#20291F);
// en el build de MERRUIC se reemplaza por el navy de la marca.
if (environment.apiUrl.includes('ms-gateway-latest')) {
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute('content', '#0B2A3B');
}

bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));
 