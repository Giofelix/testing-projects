import { expect } from '@playwright/test';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import { test as terceroBase } from './tercero.fixture.js';
import { MenuNavegacion } from '../../pages/common/menu-navegacion.js';
import { AccionesCrud } from '../../pages/common/acciones-crud.js';
import { ComponentesTabla } from '../../pages/common/componentes-tabla.js';
import { Contribuyentes } from '../../pages/modulos/reteica/archivos/contribuyentes/contribuyentes.page.js';

const authFile = resolve(__dirname, '../../playwright/.auth/user.json');
const BASE_URL = process.env.BASE_URL || 'http://172.17.1.214:9080/pasto/';
const MENU_CONTRIBUYENTES = ['Reteica', 'Archivos', 'Contribuyentes'];

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

// --- Helpers de navegación exportados (reutilizables desde specs) ---

export async function navegarAContribuyentes(page) {
  const menu = new MenuNavegacion(page);
  const url = page.url();

  // Early return solo cuando estamos en el listado exacto (no en sub-rutas como detallecontribuyente)
  if (url.includes('/taxtime/contribuyentes') && !url.includes('/detallecontribuyente')) {
    await Promise.race([
      page.getByRole('grid').waitFor({ state: 'visible', timeout: 10000 }),
      page.getByText('No existe información').waitFor({ state: 'visible', timeout: 10000 }),
    ]).catch(() => {});
    return;
  }

  if (!url.includes('/modulos') || url.includes('/taxtime')) {
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForURL('**/modulos**', { timeout: 30000 });
  }

  await page.locator('.mat-drawer-inner-container').waitFor({ state: 'visible', timeout: 20000 });
  await menu.navegar(MENU_CONTRIBUYENTES);
  await page.waitForURL('**/taxtime/contribuyentes**', { timeout: 30000 });
  await Promise.race([
    page.getByRole('grid').waitFor({ state: 'visible', timeout: 20000 }),
    page.getByText('No existe información').waitFor({ state: 'visible', timeout: 20000 }),
  ]).catch(() => {});
}

export async function cerrarDrawerSiVisible(page) {
  const backdrop = page.locator('.mat-drawer-backdrop.mat-drawer-shown');
  try {
    await backdrop.waitFor({ state: 'visible', timeout: 5000 });
    await backdrop.evaluate(el => el.click());
    await backdrop.waitFor({ state: 'hidden', timeout: 10000 });
    await page.waitForTimeout(400);
  } catch {
    // drawer ya cerrado
  }
}

// --- Helpers exportados (reutilizables desde specs) ---

export async function crearContribuyenteConBrowser(browser, seed) {
  const { context, page } = await crearContextoAuth(browser);
  try {
    const crud = new AccionesCrud(page);
    const contribuyentes = new Contribuyentes(page);

    await navegarAContribuyentes(page);
    await cerrarDrawerSiVisible(page);
    await crud.agregar();
    await expect(contribuyentes.dialogoNuevoRegistro).toBeVisible({ timeout: 15000 });
    await contribuyentes.selectorNombre.click();
    await expect(contribuyentes.dialogoSelectorTerceros).toBeVisible({ timeout: 15000 });
    await contribuyentes.seleccionarTerceroPorNit(seed);
    await contribuyentes.inputMatricula.fill(`MAT-${seed}`);
    await contribuyentes.aceptarNuevoRegistro();
    await contribuyentes.dialogoNuevoRegistro.waitFor({ state: 'hidden', timeout: 30000 });
    await contribuyentes.verificarContribuyenteEnTabla(seed);
  } finally {
    await context.close().catch(() => {});
  }
}

export async function eliminarContribuyenteConBrowser(browser, seed) {
  if (!existsSync(authFile)) return;
  const { context, page } = await crearContextoAuth(browser);
  try {
    const crud = new AccionesCrud(page);
    const tabla = new ComponentesTabla(page);

    await navegarAContribuyentes(page);
    await cerrarDrawerSiVisible(page);
    await tabla.filtrar();

    const dialogoBusqueda = page.getByRole('dialog', { name: 'Búsqueda por:' });
    await dialogoBusqueda.waitFor({ state: 'visible', timeout: 10000 });
    await dialogoBusqueda.getByRole('textbox', { name: 'NIT' }).fill(seed);
    await dialogoBusqueda.getByRole('button', { name: 'Aceptar' }).click();
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

// --- Fixture: contribuyenteData (scope worker, depende de terceroData) ---
// Playwright garantiza teardown LIFO: contribuyente se elimina primero, tercero después.

const test = terceroBase.extend({
  contribuyenteData: [async ({ browser, terceroData }, use) => {
    if (!existsSync(authFile)) {
      await use({ ...terceroData, matricula: `MAT-${terceroData.seed}` });
      return;
    }
    await crearContribuyenteConBrowser(browser, terceroData.seed);
    await use({ ...terceroData, matricula: `MAT-${terceroData.seed}` });
    await eliminarContribuyenteConBrowser(browser, terceroData.seed).catch(() => {});
  }, { scope: 'worker' }]
});

export { test };
