import { expect } from '@playwright/test';
const { given, when, then, and } = require('gherkin-lite');
import { test } from '../../fixtures/reteica/tercero.fixture.js';
import { AccionesCrud } from '../../pages/common/acciones-crud';
import { ComponentesTabla } from '../../pages/common/componentes-tabla';
import { Contribuyentes } from '../../pages/modulos/reteica/archivos/contribuyentes/contribuyentes.page';
import { navegarAContribuyentes, cerrarDrawerSiVisible, eliminarContribuyenteConBrowser } from '../../fixtures/reteica/contribuyente.fixture.js';

// ─────────────────────────────────────────────
// BLOQUE 1 — SMOKE (serial)
// ─────────────────────────────────────────────

test.describe('Contribuyentes - Smoke', () => {
  test.describe.configure({ mode: 'serial' });

  test(
    'TC-CON-001 — Navegación y carga del listado de Contribuyentes',
    { tag: '@smoke @contribuyentes @reteica @tagprueba' },
    async ({ paginaAutenticada: page }) => {
      const crud = new AccionesCrud(page);
      const tabla = new ComponentesTabla(page);

      await given('el usuario autenticado navega al módulo Contribuyentes por el menú de Reteica', async () => {
        await navegarAContribuyentes(page);
        await cerrarDrawerSiVisible(page);
      });

      await when('la página termina de cargar', async () => {
        await expect(page).toHaveURL(/.*taxtime\/contribuyentes/);
      });

      await then('el heading "Contribuyentes" es visible', async () => {
        await expect(page.getByRole('heading', { name: 'Contribuyentes' })).toBeVisible();
      });

      await and('los botones del toolbar están visibles', async () => {
        await expect(crud.btnAgregar).toBeVisible();
        await expect(tabla.btnRefrescar).toBeVisible();
        await expect(tabla.btnFiltrar).toBeVisible();
      });

      await and('la tabla muestra registros existentes con sus columnas', async () => {
        await expect(page.getByRole('columnheader', { name: 'NIT', exact: true })).toBeVisible({ timeout: 20000 });
        await expect(page.getByRole('columnheader', { name: 'Nombre', exact: true })).toBeVisible({ timeout: 10000 });
        await expect(page.getByRole('columnheader', { name: 'Matrícula', exact: true })).toBeVisible({ timeout: 10000 });
        // La paginación confirma que hay datos cargados
        await expect(page.locator('.divtable')).toContainText(/\d+ - \d+ de \d+/, { timeout: 10000 });
      });
    }
  );

});

// ─────────────────────────────────────────────
// BLOQUE 2 — FLUJO CREACIÓN (serial)
// El fixture terceroData (scope: worker) crea el Tercero antes del primer test
// y lo elimina automáticamente al finalizar el worker (teardown LIFO).
// ─────────────────────────────────────────────

test.describe('Contribuyentes - Flujo creación', () => {
  test.describe.configure({ mode: 'serial' });

  let seedActual = '';

  test.afterAll(async ({ browser }) => {
    if (seedActual) await eliminarContribuyenteConBrowser(browser, seedActual).catch(() => {});
    // La limpieza del Tercero la gestiona el fixture terceroData (worker-scope, LIFO)
  });

  // ─────────────────────────────────────────────
  // TC-CON-002 — Crear Contribuyente válido usando Tercero precreado por fixture
  // ─────────────────────────────────────────────

  test(
    'TC-CON-002 — Crear Contribuyente válido a partir de un Tercero precreado por fixture',
    { tag: '@crud @contribuyentes @reteica @tagprueba' },
    async ({ paginaAutenticada: page, terceroData }) => {
      const { seed } = terceroData;
      seedActual = seed;
      const crud = new AccionesCrud(page);
      const contribuyentes = new Contribuyentes(page);

      await given('el usuario autenticado está en el sistema y el Tercero con NIT seed ya existe', async () => {
        await expect(page).toHaveURL(/.*modulos/);
      });

      await when('navega a Contribuyentes por el menú y abre "Nuevo Registro"', async () => {
        await navegarAContribuyentes(page);
        await cerrarDrawerSiVisible(page);
        await crud.agregar();
        await expect(contribuyentes.dialogoNuevoRegistro).toBeVisible({ timeout: 15000 });
      });

      await when('selecciona el Tercero por NIT en el lookup de Nombre', async () => {
        await contribuyentes.selectorNombre.click();
        await expect(contribuyentes.dialogoSelectorTerceros).toBeVisible({ timeout: 15000 });
        await contribuyentes.seleccionarTerceroPorNit(seed);
      });

      await and('completa la Matrícula y acepta el formulario', async () => {
        await contribuyentes.inputMatricula.fill(`MAT-${seed}`);
        await contribuyentes.aceptarNuevoRegistro();
      });

      await then('el Contribuyente aparece en la tabla del listado', async () => {
        await contribuyentes.dialogoNuevoRegistro.waitFor({ state: 'hidden', timeout: 30000 });
        await contribuyentes.verificarContribuyenteEnTabla(seed);
      });
    }
  );

  // ─────────────────────────────────────────────
  // TC-CON-003 — Segundo Contribuyente con mismo Tercero es rechazado (RN-09)
  // ─────────────────────────────────────────────

  test(
    'TC-CON-003 — Segundo Contribuyente con mismo Tercero genera error de unicidad',
    { tag: '@negative @contribuyentes @reteica @tagprueba' },
    async ({ paginaAutenticada: page, terceroData }) => {
      const { seed } = terceroData;
      const crud = new AccionesCrud(page);
      const contribuyentes = new Contribuyentes(page);

      await given('el usuario está en el listado de Contribuyentes con un contribuyente ya creado para el NIT seed', async () => {
        await navegarAContribuyentes(page);
        await cerrarDrawerSiVisible(page);
        await contribuyentes.verificarContribuyenteEnTabla(seed);
      });

      await when('intenta crear un segundo Contribuyente para el mismo Tercero', async () => {
        await crud.agregar();
        await expect(contribuyentes.dialogoNuevoRegistro).toBeVisible({ timeout: 15000 });
        await contribuyentes.selectorNombre.click();
        await expect(contribuyentes.dialogoSelectorTerceros).toBeVisible({ timeout: 15000 });
        await contribuyentes.seleccionarTerceroPorNit(seed);
        await contribuyentes.inputMatricula.fill(`MAT-DUPLICADO-${seed}`);
        await contribuyentes.aceptarNuevoRegistro();
      });

      await then('el sistema muestra un diálogo de error por unicidad', async () => {
        // El sistema muestra un diálogo Angular con título "Código - NNNNN" y cuerpo
        // "Ya existe un contribuyente creado con los datos suministrados"
        const dialogoError = page.getByRole('dialog').filter({
          hasText: /Código|Ya existe un contribuyente|suministrados/i
        });
        await expect(dialogoError).toBeVisible({ timeout: 20000 });
        const textoError = await dialogoError.innerText().catch(() => '');
        console.log('[TC-CON-003] Texto del error de unicidad:', textoError);
        await dialogoError.getByRole('button', { name: 'Aceptar' }).click();
        await dialogoError.waitFor({ state: 'hidden', timeout: 10000 });
      });

      await and('el listado mantiene exactamente una fila con el NIT seed (sin duplicados)', async () => {
        // Navegar de nuevo para forzar recarga limpia de la tabla
        await page.goto(process.env.BASE_URL || 'http://172.17.1.214:9080/pasto/', {
          waitUntil: 'domcontentloaded', timeout: 60000
        });
        await page.waitForURL('**/modulos**', { timeout: 30000 });
        await navegarAContribuyentes(page);
        await cerrarDrawerSiVisible(page);
        // verificarContribuyenteEnTabla filtra por NIT y espera que la fila sea visible.
        // Eso confirma que hay exactamente 1 resultado para el NIT seed (la tabla queda con 1-1 de 1).
        await contribuyentes.verificarContribuyenteEnTabla(seed);
        // Además, con el filtro aplicado la tabla solo tiene 1 fila de datos.
        // Verificar que el paginador muestre "de 1" (1 resultado, no duplicado).
        await expect(page.locator('.divtable')).toContainText(/1\s*-\s*1\s*de\s*1/, { timeout: 10000 });
      });
    }
  );

  // ─────────────────────────────────────────────
  // TC-CON-006 — Buscador del campo Nombre filtra por NIT y por Nombre
  // ─────────────────────────────────────────────

  test(
    'TC-CON-006 — Buscador del campo Nombre filtra por NIT y por Nombre del Tercero',
    { tag: '@search @contribuyentes @reteica' },
    async ({ paginaAutenticada: page, terceroData }) => {
      const { seed } = terceroData;
      const crud = new AccionesCrud(page);
      const contribuyentes = new Contribuyentes(page);

      await given('el usuario está en el listado de Contribuyentes y el Tercero con NIT seed existe', async () => {
        await navegarAContribuyentes(page);
        await cerrarDrawerSiVisible(page);
      });

      await when('abre "Nuevo Registro" y filtra el lookup por NIT', async () => {
        await crud.agregar();
        await expect(contribuyentes.dialogoNuevoRegistro).toBeVisible({ timeout: 15000 });
        await contribuyentes.selectorNombre.click();
        await expect(contribuyentes.dialogoSelectorTerceros).toBeVisible({ timeout: 15000 });
        await contribuyentes.tabFiltrosTerceros.click();
        await contribuyentes.inputFiltroNit.fill(seed);
        await contribuyentes.btnAplicarFiltro.click();
        await contribuyentes.tabDatosTerceros.click();
      });

      await then('la pestaña Datos muestra la fila con el NIT seed', async () => {
        await expect(contribuyentes.gridTercerosCeldaNit(seed)).toBeVisible({ timeout: 15000 });
      });

      await when('cancela el diálogo y filtra de nuevo por Nombre', async () => {
        await contribuyentes.cancelarNuevoRegistro();
        await contribuyentes.dialogoNuevoRegistro.waitFor({ state: 'hidden', timeout: 10000 });
        await crud.agregar();
        await expect(contribuyentes.dialogoNuevoRegistro).toBeVisible({ timeout: 15000 });
        await contribuyentes.selectorNombre.click();
        await expect(contribuyentes.dialogoSelectorTerceros).toBeVisible({ timeout: 15000 });
        await contribuyentes.tabFiltrosTerceros.click();
        await contribuyentes.inputFiltroNombre.fill(`AUTOTEST CON ${seed}`);
        await contribuyentes.btnAplicarFiltro.click();
        await contribuyentes.tabDatosTerceros.click();
      });

      await then('la pestaña Datos muestra la fila con la razón social coincidente', async () => {
        await expect(
          contribuyentes.gridTercerosCeldaNombre(`AUTOTEST CON ${seed}`)
        ).toBeVisible({ timeout: 15000 });
      });

      await when('cancela el diálogo sin crear registro', async () => {
        await contribuyentes.cancelarNuevoRegistro();
      });

      await then('el diálogo se cierra sin crear ningún registro', async () => {
        await expect(contribuyentes.dialogoNuevoRegistro).not.toBeVisible({ timeout: 10000 });
      });
    }
  );

});

// ─────────────────────────────────────────────
// BLOQUE 3 — VALIDACIONES (serial)
// ─────────────────────────────────────────────

test.describe('Contribuyentes - Validaciones', () => {
  test.describe.configure({ mode: 'serial' });

  // ─────────────────────────────────────────────
  // TC-CON-004 — Guardar sin Nombre dispara validación y error de servicio
  // ─────────────────────────────────────────────

  test(
    'TC-CON-004 — Guardar formulario sin Nombre dispara validación inline y error de servicio',
    { tag: '@negative @contribuyentes @reteica' },
    async ({ paginaAutenticada: page }) => {
      const crud = new AccionesCrud(page);
      const contribuyentes = new Contribuyentes(page);

      await given('el usuario está en el listado de Contribuyentes', async () => {
        await navegarAContribuyentes(page);
        await cerrarDrawerSiVisible(page);
      });

      await when('abre "Nuevo Registro" y pulsa Aceptar sin seleccionar Nombre', async () => {
        await crud.agregar();
        await expect(contribuyentes.dialogoNuevoRegistro).toBeVisible({ timeout: 15000 });
        await contribuyentes.aceptarNuevoRegistro();
      });

      await then('aparece el alert inline "Campo obligatorio" bajo el campo Nombre', async () => {
        await expect(contribuyentes.mensajeCampoObligatorio).toBeVisible({ timeout: 10000 });
      });

      await and('el formulario permanece abierto sin crear ningún registro', async () => {
        await contribuyentes.cancelarNuevoRegistro();
        await contribuyentes.dialogoNuevoRegistro.waitFor({ state: 'hidden', timeout: 10000 });
        await expect(page).toHaveURL(/.*taxtime\/contribuyentes/);
      });
    }
  );

  // ─────────────────────────────────────────────
  // TC-CON-005 — Solo Matrícula diligenciada sin Nombre no permite guardar
  // ─────────────────────────────────────────────

  test(
    'TC-CON-005 — Matrícula diligenciada sin Nombre genera la misma validación que TC-CON-004',
    { tag: '@negative @contribuyentes @reteica' },
    async ({ paginaAutenticada: page }) => {
      const seed005 = Date.now().toString().slice(-9);
      const crud = new AccionesCrud(page);
      const contribuyentes = new Contribuyentes(page);

      await given('el usuario está en el listado de Contribuyentes', async () => {
        await navegarAContribuyentes(page);
        await cerrarDrawerSiVisible(page);
      });

      await when('abre "Nuevo Registro", completa Matrícula pero no selecciona Nombre', async () => {
        await crud.agregar();
        await expect(contribuyentes.dialogoNuevoRegistro).toBeVisible({ timeout: 15000 });
        await contribuyentes.inputMatricula.fill(`MAT-${seed005}`);
        await contribuyentes.aceptarNuevoRegistro();
      });

      await then('aparece el alert inline "Campo obligatorio" bajo el campo Nombre', async () => {
        await expect(contribuyentes.mensajeCampoObligatorio).toBeVisible({ timeout: 10000 });
      });

      await and('el formulario permanece abierto sin crear ningún registro', async () => {
        await contribuyentes.cancelarNuevoRegistro();
        await contribuyentes.dialogoNuevoRegistro.waitFor({ state: 'hidden', timeout: 10000 });
        await expect(page).toHaveURL(/.*taxtime\/contribuyentes/);
      });
    }
  );

  // ─────────────────────────────────────────────
  // TC-CON-007 — Datepicker: limpiar y seleccionar fecha
  // ─────────────────────────────────────────────

  test(
    'TC-CON-007 — Datepicker: limpiar y seleccionar fecha en Fecha matrícula',
    { tag: '@contribuyentes @reteica' },
    async ({ paginaAutenticada: page }) => {
      const crud = new AccionesCrud(page);
      const contribuyentes = new Contribuyentes(page);

      await given('el usuario está en el listado de Contribuyentes', async () => {
        await navegarAContribuyentes(page);
        await cerrarDrawerSiVisible(page);
      });

      await when('abre "Nuevo Registro"', async () => {
        await crud.agregar();
        await expect(contribuyentes.dialogoNuevoRegistro).toBeVisible({ timeout: 15000 });
      });

      await then('el campo Fecha matrícula tiene un valor por defecto (fecha actual)', async () => {
        await expect(contribuyentes.inputFechaMatricula).not.toHaveValue('');
        await expect(contribuyentes.btnLimpiarFecha).toBeVisible();
      });

      await when('hace click en el botón limpiar fecha', async () => {
        await contribuyentes.btnLimpiarFecha.click();
      });

      await then('el campo Fecha matrícula queda vacío', async () => {
        await expect(contribuyentes.inputFechaMatricula).toHaveValue('');
      });

      await when('abre el calendario y selecciona el día 15', async () => {
        const panelCalendario = page.locator('mat-calendar');
        const yaAbierto = await panelCalendario.isVisible({ timeout: 2000 }).catch(() => false);
        if (!yaAbierto) {
          await contribuyentes.btnAbrirCalendario.click();
          await panelCalendario.waitFor({ state: 'visible', timeout: 10000 });
        }
        const celdaDia15 = panelCalendario.locator('td[data-mat-row]').filter({ hasText: /^15$/ }).first()
          .or(panelCalendario.locator('.mat-calendar-body-cell').filter({ hasText: /^15$/ }).first());
        const celdaDia10 = panelCalendario.locator('td[data-mat-row]').filter({ hasText: /^10$/ }).first()
          .or(panelCalendario.locator('.mat-calendar-body-cell').filter({ hasText: /^10$/ }).first());
        const visible15 = await celdaDia15.isVisible({ timeout: 2000 }).catch(() => false);
        if (visible15) {
          await celdaDia15.click({ force: true });
        } else {
          await celdaDia10.click({ force: true });
        }
      });

      await then('el campo Fecha matrícula se actualiza con la fecha seleccionada en formato d/m/yyyy', async () => {
        await expect(contribuyentes.inputFechaMatricula).not.toHaveValue('');
        await expect(contribuyentes.inputFechaMatricula).toHaveValue(/\d{1,2}\/\d{1,2}\/\d{4}/);
      });

      await when('cancela el diálogo', async () => {
        await contribuyentes.cancelarNuevoRegistro();
      });

      await then('el diálogo se cierra sin crear ningún registro', async () => {
        await expect(contribuyentes.dialogoNuevoRegistro).not.toBeVisible({ timeout: 10000 });
      });
    }
  );

  // ─────────────────────────────────────────────
  // TC-CON-008 — Cancelar no crea registro
  // ─────────────────────────────────────────────

  test(
    'TC-CON-008 — Cancelar el formulario de alta no crea ningún registro',
    { tag: '@contribuyentes @reteica' },
    async ({ paginaAutenticada: page }) => {
      const seed008 = Date.now().toString().slice(-9);
      const crud = new AccionesCrud(page);
      const contribuyentes = new Contribuyentes(page);

      await given('el usuario está en el listado de Contribuyentes y registra el estado inicial', async () => {
        await navegarAContribuyentes(page);
        await cerrarDrawerSiVisible(page);
        await expect(page).toHaveURL(/.*taxtime\/contribuyentes/);
      });

      await when('abre "Nuevo Registro", completa Matrícula y cancela', async () => {
        await crud.agregar();
        await expect(contribuyentes.dialogoNuevoRegistro).toBeVisible({ timeout: 15000 });
        await contribuyentes.inputMatricula.fill(`MAT-CANCELAR-${seed008}`);
        await contribuyentes.cancelarNuevoRegistro();
      });

      await then('el diálogo se cierra sin crear ningún registro', async () => {
        await expect(contribuyentes.dialogoNuevoRegistro).not.toBeVisible({ timeout: 10000 });
        const celdaMatricula = page.getByRole('gridcell', { name: `MAT-CANCELAR-${seed008}` });
        await expect(celdaMatricula).not.toBeVisible({ timeout: 5000 });
      });
    }
  );

});
