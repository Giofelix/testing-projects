import { expect } from '@playwright/test';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import { test as authBase } from '../auth.fixture.js';
import { MenuNavegacion } from '../../pages/common/menu-navegacion.js';
import { AccionesCrud } from '../../pages/common/acciones-crud.js';
import { ComponentesTabla } from '../../pages/common/componentes-tabla.js';
import { Terceros } from '../../pages/modulos/reteica/archivos/terceros.page.js';

const authFile = resolve(__dirname, '../../playwright/.auth/user.json');
const BASE_URL = process.env.BASE_URL || 'http://172.17.1.214:9080/pasto/';
const MENU_TERCEROS = ['Reteica', 'Archivos', 'Terceros'];

// --- Contexto autenticado reutilizable ---

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

export async function crearTerceroConBrowser(browser, seed, razonSocialPrefix = 'AUTOTEST CON') {
  const { context, page } = await crearContextoAuth(browser);
  try {
    const menu = new MenuNavegacion(page);
    const crud = new AccionesCrud(page);
    const terceros = new Terceros(page);

    await menu.navegar(MENU_TERCEROS);
    await expect(page).toHaveURL(/.*taxtime\/terceros$/);
    await crud.agregar();
    await expect(page).toHaveURL(/.*terceros\/detalle/);

    await terceros.completarDatosBasicos({
      nit: seed,
      tipoDocumento: 'NIT',
      razonSocial: `${razonSocialPrefix} ${seed}`,
      tipoRegimen: 'Menores Ingresos',
      naturaleza: 'PERSONA JURIDICA',
      direccion: 'CL 18 25 50',
      telefonos: '6027234567',
    });
    await terceros.completarDatosAdicionales({
      pais: 'Colombia',
      departamento: 'BOYACA',
      ciudad: 'BOYACA',
    });
    await crud.guardar();
    await page.waitForURL(/.*taxtime\/terceros$/, { timeout: 30000 });
  } finally {
    // context.close() puede lanzar ENOENT si el directorio de traces aún no fue creado por Playwright
    await context.close().catch(() => {});
  }
}

export async function eliminarTerceroConBrowser(browser, seed) {
  if (!existsSync(authFile)) return;
  const { context, page } = await crearContextoAuth(browser);
  try {
    const menu = new MenuNavegacion(page);
    const crud = new AccionesCrud(page);
    const tabla = new ComponentesTabla(page);

    await menu.navegar(MENU_TERCEROS);
    await expect(page).toHaveURL(/.*taxtime\/terceros$/);
    await tabla.filtrar();
    await page.getByRole('dialog').getByRole('textbox', { name: 'Nit' }).fill(seed);
    await crud.aceptar();
    await page.getByRole('dialog').waitFor({ state: 'hidden', timeout: 15000 });

    const fila = page.getByRole('row').filter({
      has: page.getByRole('gridcell', { name: seed, exact: true })
    }).first();
    if (await fila.isVisible({ timeout: 10000 }).catch(() => false)) {
      await tabla.seleccionarFila(seed);
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

// --- Fixture: terceroData (scope worker = corre una vez por suite serial) ---

const test = authBase.extend({
  terceroData: [async ({ browser }, use) => {
    const seed = Date.now().toString().slice(-9);
    if (!existsSync(authFile)) {
      await use({ seed, nit: seed, razonSocial: `AUTOTEST CON ${seed}` });
      return;
    }
    await crearTerceroConBrowser(browser, seed);
    await use({ seed, nit: seed, razonSocial: `AUTOTEST CON ${seed}` });
    await eliminarTerceroConBrowser(browser, seed).catch(() => {});
  }, { scope: 'worker' }]
});

export { test };
