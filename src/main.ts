import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';
 
import { registerLocaleData } from '@angular/common';
import localeEs   from '@angular/common/locales/es';
import localeEsPe from '@angular/common/locales/es-PE';
 
// Registrar ambos: 'es' (usado en pipes del template) y 'es-PE' (locale regional)
registerLocaleData(localeEs,   'es');
registerLocaleData(localeEsPe, 'es-PE');
 
bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));
 