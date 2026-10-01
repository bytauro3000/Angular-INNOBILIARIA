const fs = require('fs');
const path = require('path');

const apiUrl = process.env.API_URL || 'http://localhost:8080';
const wsUrl = process.env.WS_URL || apiUrl.replace('https://', 'wss://').replace('http://', 'ws://');

const content = `export const environment = {
    production: true,
    apiUrl: '${apiUrl}',
    wsUrl: '${wsUrl}'
};
`;

const envPath = path.join(__dirname, '..', 'src', 'environments', 'environment.ts');
fs.writeFileSync(envPath, content);
console.log(`environment.ts generado con apiUrl: ${apiUrl}`);

// ── PWA: manifest e iconos por marca ─────────────────────────────────────────
// Misma regla que usa la app (isMerruic): la marca se deduce de la URL del
// gateway, asi cada despliegue (proyecto de Vercel) instala su propia app con
// su nombre, sus colores y sus iconos.
const esMerruic = apiUrl.includes('ms-gateway-latest');

const marcas = {
  ivan: {
    name: 'Inmobiliaria Ivan',
    short_name: 'Inmobiliaria',
    description:
      'Portal de Inmobiliaria Constructora Ivan E.I.R.L: consulta de lotes, letras y pagos en un solo lugar.',
    background_color: '#20291F',
    theme_color: '#20291F',
    iconDir: 'icons/ivan',
  },
  merruic: {
    name: 'Inmobiliaria Merruic',
    short_name: 'Merruic',
    description:
      'Portal de Inmobiliaria Merruic: consulta de lotes, letras y pagos en un solo lugar.',
    background_color: '#0B2A3B',
    theme_color: '#0B2A3B',
    iconDir: 'icons/merruic',
  },
};

const marca = esMerruic ? marcas.merruic : marcas.ivan;

const manifest = {
  name: marca.name,
  short_name: marca.short_name,
  description: marca.description,
  id: '/',
  start_url: '/',
  scope: '/',
  display: 'standalone',
  background_color: marca.background_color,
  theme_color: marca.theme_color,
  lang: 'es',
  dir: 'ltr',
  categories: ['business', 'finance'],
  icons: [
    { src: `${marca.iconDir}/icon-192.png`, sizes: '192x192', type: 'image/png', purpose: 'any' },
    { src: `${marca.iconDir}/icon-512.png`, sizes: '512x512', type: 'image/png', purpose: 'any' },
    {
      src: `${marca.iconDir}/icon-maskable-512.png`,
      sizes: '512x512',
      type: 'image/png',
      purpose: 'maskable',
    },
  ],
};

const publicDir = path.join(__dirname, '..', 'public');
fs.writeFileSync(path.join(publicDir, 'manifest.webmanifest'), JSON.stringify(manifest, null, 2));
console.log(`manifest.webmanifest generado para la marca: ${marca.name}`);

// iOS lee un icono desde una ruta fija declarada en index.html: se copia el de
// la marca activa antes del build.
const touchSrc = path.join(publicDir, marca.iconDir, 'apple-touch-icon.png');
const touchDest = path.join(publicDir, 'icons', 'apple-touch-icon.png');
if (fs.existsSync(touchSrc)) {
  fs.copyFileSync(touchSrc, touchDest);
  console.log(`apple-touch-icon.png copiado desde ${marca.iconDir}/`);
} else {
  console.warn(`ADVERTENCIA: no se encontro ${touchSrc}`);
}
