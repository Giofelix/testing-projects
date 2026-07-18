import { expect } from '@playwright/test';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import { test as contribuyenteBase, navegarAContribuyentes, cerrarDrawerSiVisible } from './contribuyente.fixture.js';
import { AccionesCrud } from '../../pages/common/acciones-crud.js';
import { ComponentesTabla } from '../../pages/common/componentes-tabla.js';
import { Contribuyentes } from '../../pages/modulos/reteica/archivos/contribuyentes/contribuyentes.page.js';
import { Establecimientos } from '../../pages/modulos/reteica/archivos/contribuyentes/menu-procesos-contribuyentes/establecimientos.page.js';

const authFile = resolve(__dirname, '../../playwright/.auth/user.json');
const BASE_URL = process.env.BASE_URL || 'http://172.17.1.214:9080/pasto/';

// --- Contexto autenticado (mismo patrón que los demás fixtures de la cadena) ---

async function crearContextoAuth(browser) {
  const authData = JSON.parse(readFileSync(authFile, 'utf8'));
  const context = await browser.newContext({
    locale: 'es-ES',
    timezoneId: 'America/Bogota',
    extraHTTPHeaders: { 'Accept-Language': 'es-ES,es;q=0.9' }
  });
  const page = await context.newPage();
  await page.addInitScript((sessionData) => {
    for (const [key, value] of Object.entries(sessionData)) {
      window.sessionStorage.setItem(key, value);
    }
  }, authData.sessionStorage);
  await page.goto(BASE_URL, { timeout: 60000, waitUntil: 'domcontentloaded' });
  await page.waitForURL('**/modulos**', { timeout: 30000 });
  return { context, page };
}

// --- Helpers exportados (reutilizables desde specs) ---

export async function navegarAEstablecimientos(page, seed) {
  const tabla = new ComponentesTabla(page);
  const contribuyentes = new Contribuyentes(page);

  await navegarAContribuyentes(page);
  await cerrarDrawerSiVisible(page);

  // Filtrar por NIT para ubicar el contribuyente
  await tabla.filtrar();
  const dialogoBusqueda = page.getByRole('dialog', { name: 'Búsqueda por:' });
  await dialogoBusqueda.waitFor({ state: 'visible', timeout: 10000 });
  await dialogoBusqueda.getByRole('textbox', { name: 'NIT' }).fill(seed);
  await dialogoBusqueda.getByRole('button', { name: 'Aceptar' }).click();
  await page.getByRole('dialog').waitFor({ state: 'hidden', timeout: 15000 });
  await page.waitForLoadState('networkidle', { timeout: 30000 });

  // Abrir detalle del contribuyente (segunda celda de la fila = Nombre)
  const fila = page.getByRole('row').filter({
    has: page.getByRole('gridcell', { name: seed, exact: true })
  }).first();
  await fila.waitFor({ state: 'visible', timeout: 30000 });
  await fila.getByRole('gridcell').nth(1).click();
  await page.waitForLoadState('networkidle', { timeout: 30000 });

  // Ir a Establecimientos desde el menú more_vert del detalle del contribuyente
  await contribuyentes.irAProcesoDesdeMenu('Establecimientos');

  await Promise.race([
    page.getByRole('grid').waitFor({ state: 'visible', timeout: 20000 }),
    page.getByText('No existe información').waitFor({ state: 'visible', timeout: 20000 }),
  ]).catch(() => {});
}

export async function cerrarDialogoErrorApiSiVisible(page) {
  const dialogo = page.locator('.swal2-popup').filter({ hasText: 'Error!' });
  const visible = await dialogo.isVisible({ timeout: 3000 }).catch(() => false);
  if (visible) {
    await dialogo.getByRole('button', { name: 'Aceptar' }).click();
    await dialogo.waitFor({ state: 'hidden', timeout: 10000 });
  }
}

export async function crearEstablecimientoConBrowser(browser, seed) {
  const { context, page } = await crearContextoAuth(browser);
  try {
    const crud = new AccionesCrud(page);
    const establecimientos = new Establecimientos(page);

    await navegarAEstablecimientos(page, seed);
    await crud.agregar();
    await cerrarDialogoErrorApiSiVisible(page);
    await expect(establecimientos.inputNombre).toBeVisible({ timeout: 15000 });

    await establecimientos.inputNombre.fill(`autotest_EST_${seed}`);
    await establecimientos.inputTelefono.fill('3100000000');
    await establecimientos.seleccionarPais('Colombia');
    await establecimientos.seleccionarDepartamento('NARIÑO');
    await establecimientos.seleccionarCiudad('PASTO');
    // Barrio: primera opción disponible en el combo
    await establecimientos.btnBarrio.click();
    await page.waitForSelector('mat-option', { state: 'visible', timeout: 10000 });
    await page.locator('mat-option').first().click();
    await establecimientos.inputDireccion.fill('CALLE 18 # 24-30');
    await establecimientos.inputCorreoElectronico.fill(`autotest_${seed}@correo.com`);
    await establecimientos.inputInicioActividad.fill('1/1/2024');
    await establecimientos.inputInicioActividad.press('Tab');
    await establecimientos.cerrarDatepickerSiAbierto();

    await crud.guardar();
    await cerrarDialogoErrorApiSiVisible(page);
    await expect(establecimientos.inputNombre).not.toBeVisible({ timeout: 30000 });
    await page.waitForLoadState('networkidle', { timeout: 30000 });
  } finally {
    await context.close().catch(() => {});
  }
}

export async function eliminarEstablecimientoConBrowser(browser, seed) {
  if (!existsSync(authFile)) return;
  const { context, page } = await crearContextoAuth(browser);
  try {
    const crud = new AccionesCrud(page);
    const tabla = new ComponentesTabla(page);
    const establecimientos = new Establecimientos(page);

    await navegarAEstablecimientos(page, seed);

    await tabla.filtrar();
    await establecimientos.completarFiltros({ nombre: `autotest_EST_${seed}` });

    // Buscar por seed dentro del nombre (la app puede transformar a mayúsculas)
    const fila = page.getByRole('row').filter({
      has: page.getByRole('gridcell').filter({ hasText: seed })
    }).first();

    if (await fila.isVisible({ timeout: 10000 }).catch(() => false)) {
      await fila.getByRole('checkbox').first().click({ force: true });
      await crud.eliminar();
      const popup = page.locator('.swal2-popup');
      await popup.waitFor({ state: 'visible', timeout: 15000 });
      await crud.aceptar();
      await popup.waitFor({ state: 'hidden', timeout: 10000 });
    }
  } finally {
    await context.close().catch(() => {});
  }
}

// --- Fixture: establecimientoData (scope worker, depende de contribuyenteData) ---
// Teardown LIFO garantizado por Playwright:
//   establecimientoData → contribuyenteData → terceroData
// El establecimiento se elimina primero, luego el contribuyente, luego el tercero.

const test = contribuyenteBase.extend({
  establecimientoData: [async ({ browser, contribuyenteData }, use) => {
    const { seed } = contribuyenteData;
    const nombreEstablecimiento = `autotest_EST_${seed}`;
    if (!existsSync(authFile)) {
      await use({ ...contribuyenteData, nombreEstablecimiento });
      return;
    }
    await crearEstablecimientoConBrowser(browser, seed);
    await use({ ...contribuyenteData, nombreEstablecimiento });
    await eliminarEstablecimientoConBrowser(browser, seed).catch(() => {});
  }, { scope: 'worker' }]
});

export { test };
