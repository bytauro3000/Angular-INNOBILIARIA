import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

// 1. IMPORTAR la función que falta y el set de datos de Perú
import { registerLocaleData } from '@angular/common'; // <-- Esta línea faltaba
import localeEsPe from '@angular/common/locales/es-PE';

// 2. REGISTRAR los datos de localización
registerLocaleData(localeEsPe);

bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));