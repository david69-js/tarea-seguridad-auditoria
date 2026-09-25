/**
 * Regenera las capturas de pantalla de la documentación.
 *
 *   docker compose up -d
 *   npm install puppeteer-core
 *   node docs/capturas/generar.mjs [url]        (por defecto http://localhost:8091)
 *
 * Si se define OPENWEATHER_API_KEY en el contenedor, la captura del dashboard
 * saldrá con el clima real; si no, con el aviso de "clima no disponible".
 */
import puppeteer from 'puppeteer-core';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const BASE = process.argv[2] || 'http://localhost:8091';
const DIR  = dirname(fileURLToPath(import.meta.url));
const CHROME = process.env.CHROME_PATH ||
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

const browser = await puppeteer.launch({
  executablePath: CHROME, headless: 'new',
  args: ['--no-sandbox', '--hide-scrollbars'], protocolTimeout: 30000,
});
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });
const pausa = ms => new Promise(r => setTimeout(r, ms));
const captura = async (nombre) => {
  await pausa(1400);
  await page.screenshot({ path: join(DIR, nombre + '.png') });
  console.log('  ✓', nombre + '.png');
};

// Login (sin credenciales a la vista)
await page.goto(BASE + '/login', { waitUntil: 'networkidle2' });
await captura('00-login');

// Sesión de administrador. Se teclea en los campos (en vez de asignar
// .value) porque React solo ve lo que llega por eventos de teclado.
await page.type('#correo', 'admin@tienda.com');
await page.type('#password', 'admin123');
await Promise.all([page.waitForSelector('.sidebar'), page.click('button[type=submit]')]);

for (const [ruta, nombre] of [
  ['/dashboard', '01-dashboard'], ['/pos', '02-pos'], ['/productos', '03-inventario'],
  ['/ventas', '04-ventas'], ['/reportes', '05-reportes'], ['/clientes', '06-clientes'],
  ['/usuarios', '07-usuarios'],
]) {
  await page.goto(BASE + ruta, { waitUntil: 'networkidle2' });
  await captura(nombre);
}

// Detalle de una venta (la tienda no emite facturas)
await page.goto(BASE + '/ventas', { waitUntil: 'networkidle2' });
await page.click('tbody tr .btn-outline-primary');
await page.waitForSelector('.modal.show');
await captura('08-detalle-venta');

// Vista móvil (diseño responsivo)
await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true });
await page.goto(BASE + '/pos', { waitUntil: 'networkidle2' });
await captura('09-movil-pos');

await browser.close();
