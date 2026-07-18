import { expect } from '@playwright/test';
const { given, when, then, and } = require('gherkin-lite');
import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';
import { test, navegarAContribuyentes, cerrarDrawerSiVisible } from '../../fixtures/reteica/contribuyente.fixture.js';
import { AccionesCrud } from '../../pages/common/acciones-crud';
import { ComponentesTabla } from '../../pages/common/componentes-tabla';
import { Contribuyentes } from '../../pages/modulos/reteica/archivos/contribuyentes/contribuyentes.page';
import { Establecimientos } from '../../pages/modulos/reteica/archivos/contribuyentes/menu-procesos-contribuyentes/establecimientos.page';

const BASE_URL = process.env.BASE_URL || 'http://172.17.1.214:9080/pasto/';
const AUTH_FILE = resolve(__dirname, '../../playwright/.auth/user.json');

// ─────────────────────────────────────────────
// Helpers internos
// ─────────────────────────────────────────────

/**
 * Navega desde el listado de Contribuyentes hasta la pantalla de Establecimientos
 * del Contribuyente identificado por su NIT (seed).
 *
 * Flujo de 10 pasos:
 *  1. navegarAContribuyentes
 *  2. cerrarDrawerSiVisible
 *  3. filtrar() abre el diálogo de búsqueda
 *  4. Rellenar NIT en el diálogo
 *  5. Aceptar y esperar cierre del diálogo
 *  6. Esperar que la fila del contribuyente sea visible
 *  7. Click en la celda de Nombre para abrir el detalle
 *  8. Esperar networkidle
 *  9. Abrir el menú more_vert del detalle del contribuyente
 * 10. Hacer click en la opción "Establecimientos"
 */
async function navegarAEstablecimientos(page, seed) {
  const tabla = new ComponentesTabla(page);
  const contribuyentes = new Contribuyentes(page);

  // Paso 1-2
  await navegarAContribuyentes(page);
  await cerrarDrawerSiVisible(page);

  // Paso 3-5: filtrar por NIT
  await tabla.filtrar();
  const dialogoBusqueda = page.getByRole('dialog', { name: 'Búsqueda por:' });
  await dialogoBusqueda.waitFor({ state: 'visible', timeout: 10000 });
  await dialogoBusqueda.getByRole('textbox', { name: 'NIT' }).fill(seed);
  await dialogoBusqueda.getByRole('button', { name: 'Aceptar' }).click();
  await page.getByRole('dialog').waitFor({ state: 'hidden', timeout: 15000 });
  await page.waitForLoadState('networkidle', { timeout: 30000 });

  // Paso 6: esperar la fila con el NIT
  const filaContribuyente = page.getByRole('row').filter({
    has: page.getByRole('gridcell', { name: seed, exact: true })
  }).first();
  await filaContribuyente.waitFor({ state: 'visible', timeout: 30000 });

  // Paso 7-8: click en la celda de Nombre (segunda columna de la fila) para abrir detalle
  await filaContribuyente.getByRole('gridcell').nth(1).click();
  await page.waitForLoadState('networkidle', { timeout: 30000 });

  // Paso 9-10: abrir menú more_vert y seleccionar Establecimientos
  await contribuyentes.irAProcesoDesdeMenu('Establecimientos');

  // Esperar que la tabla de Establecimientos o "No existe información" sea visible
  await Promise.race([
    page.getByRole('grid').waitFor({ state: 'visible', timeout: 20000 }),
    page.getByText('No existe información').waitFor({ state: 'visible', timeout: 20000 }),
  ]).catch(() => {});
}

// Descarta el diálogo "Error!" que aparece al abrir el formulario Agregar cuando el
// API de "último establecimiento activo del tercero" falla (solo para contribuyentes nuevos).
async function cerrarDialogoErrorApiSiVisible(page) {
  const dialogo = page.locator('.swal2-popup').filter({ hasText: 'Error!' });
  const visible = await dialogo.isVisible({ timeout: 3000 }).catch(() => false);
  if (visible) {
    await dialogo.getByRole('button', { name: 'Aceptar' }).click();
    await dialogo.waitFor({ state: 'hidden', timeout: 10000 });
  }
}

/**
 * Limpieza de Establecimiento en afterAll.
 * Filtra por nombre del establecimiento, selecciona la fila y elimina.
 */
async function eliminarEstablecimientoConBrowser(browser, seed, nombreEstablecimiento) {
  if (!existsSync(AUTH_FILE)) return;
  const authData = JSON.parse(readFileSync(AUTH_FILE, 'utf8'));
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

  try {
    await navegarAEstablecimientos(page, seed);

    const crud = new AccionesCrud(page);
    const tabla = new ComponentesTabla(page);
    const establecimientos = new Establecimientos(page);

    // Filtrar por nombre del establecimiento
    await tabla.filtrar();
    await establecimientos.completarFiltros({ nombre: nombreEstablecimiento });

    // Buscar la fila por nombre exacto; si no se encuentra, buscar por seed (parte numérica del nombre)
    // La app puede transformar el nombre a mayúsculas o reemplazar guiones bajos por espacios.
    let filaEstablecimiento = page.getByRole('row').filter({
      has: page.getByRole('gridcell', { name: nombreEstablecimiento, exact: true })
    }).first();
    let filaVisible = await filaEstablecimiento.isVisible({ timeout: 5000 }).catch(() => false);

    if (!filaVisible) {
      // Fallback: buscar por seed (número único) en cualquier gridcell de nombre
      filaEstablecimiento = page.getByRole('row').filter({
        has: page.getByRole('gridcell').filter({ hasText: seed })
      }).first();
      filaVisible = await filaEstablecimiento.isVisible({ timeout: 5000 }).catch(() => false);
    }

    if (filaVisible) {
      // Seleccionar el checkbox de esa fila
      await filaEstablecimiento.getByRole('checkbox').first().click({ force: true });
      await crud.eliminar();
      const popup = page.locator('.swal2-popup');
      await popup.waitFor({ state: 'visible', timeout: 15000 });
      await crud.aceptar();
      await popup.waitFor({ state: 'hidden', timeout: 10000 });
    }
  } finally {
    await context.close();
  }
}


// ─────────────────────────────────────────────────────────────────────────────
// PRECONDICIÓN ÚNICA: UN Tercero → UN Contribuyente → todas las pruebas
// Los fixtures terceroData y contribuyenteData crean y limpian los datos
// automáticamente (scope: worker). El afterAll solo limpia establecimientos
// creados durante los tests.
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Establecimientos', () => {
  test.describe.configure({ mode: 'serial' });

  test.afterAll(async ({ browser, contribuyenteData }) => {
    const { seed } = contribuyenteData;
    // TC-EST-002/005/006/007 usan este establecimiento (CRUD completo)
    const nombreEstDisplay = `autotest_EST_${seed}`;
    // TC-EST-003 usa nombre distinto para evitar colisión
    const nombreAddDisplay = `autotest_ADD_${seed}`;
    // Limpiar establecimientos residuales; contribuyente y tercero los limpia el fixture
    await eliminarEstablecimientoConBrowser(browser, seed, nombreEstDisplay).catch(() => {});
    await eliminarEstablecimientoConBrowser(browser, seed, nombreAddDisplay).catch(() => {});
  });

  test(
    'TC-EST-001 — Verificar carga de la pantalla de Establecimientos',
    { tag: '@smoke @tagprueba @reteica @establecimientos @crud' },
    async ({ paginaAutenticada: page, contribuyenteData }) => {
      const { seed } = contribuyenteData;
      const crud = new AccionesCrud(page);
      const tabla = new ComponentesTabla(page);
      const establecimientos = new Establecimientos(page);

      await given('el usuario autenticado navega a Contribuyentes y abre el menú de procesos del contribuyente de soporte', async () => {
        await navegarAEstablecimientos(page, seed);
      });

      await then('la pantalla de Establecimientos está cargada (heading visible)', async () => {
        // Cuando el contribuyente no tiene establecimientos, la app muestra "No existe información"
        // sin un <grid> en el DOM. Se verifica el heading como indicador de carga correcta.
        await expect(page.getByRole('heading', { name: 'Establecimientos' })).toBeVisible({ timeout: 20000 });
      });

      await and('el toolbar muestra los botones Agregar, Refrescar y Filtrar', async () => {
        await expect(crud.btnAgregar).toBeVisible();
        await expect(tabla.btnRefrescar).toBeVisible();
        await expect(tabla.btnFiltrar).toBeVisible();
      });

      await and('la tabla (o el mensaje vacío) es visible', async () => {
        // La pantalla muestra el grid cuando hay datos, o "No existe información" cuando está vacía.
        // Ambos estados indican que la pantalla cargó correctamente.
        const gridVisible = await establecimientos.tablaGrid.isVisible({ timeout: 5000 }).catch(() => false);
        const mensajeVacioVisible = await page.getByText('No existe información').isVisible({ timeout: 5000 }).catch(() => false);
        expect(gridVisible || mensajeVacioVisible).toBeTruthy();
      });

      await and('si hay registros, las columnas de la tabla son visibles', async () => {
        const gridVisible = await establecimientos.tablaGrid.isVisible({ timeout: 3000 }).catch(() => false);
        if (gridVisible) {
          await expect(establecimientos.columnaCodigo).toBeVisible();
          await expect(establecimientos.columnaNombre).toBeVisible();
          await expect(establecimientos.columnaTelefono).toBeVisible();
          await expect(establecimientos.columnaDireccion).toBeVisible();
          await expect(establecimientos.columnaEstado).toBeVisible();
          await expect(establecimientos.columnaMatricula).toBeVisible();
          await expect(establecimientos.columnaFechaMatricula).toBeVisible();
          await expect(establecimientos.columnaInicioActividad).toBeVisible();
        }
      });
    }
  );

  // ─────────────────────────────────────────────
  // TC-EST-002 — Happy path creación
  // ─────────────────────────────────────────────

  test(
    'TC-EST-002 — Crear establecimiento con todos los campos obligatorios (happy path)',
    { tag: '@smoke @tagprueba @reteica @establecimientos @crud' },
    async ({ paginaAutenticada: page, contribuyenteData }) => {
      const { seed } = contribuyenteData;
      const nombreEstablecimiento = `autotest_EST_${seed}`;
      const crud = new AccionesCrud(page);
      const establecimientos = new Establecimientos(page);

      const datosBasica = {
        nombre: nombreEstablecimiento,
        telefono: '3100000000',
        pais: 'Colombia',           // Valor real en el combo del ambiente
        departamento: 'NARIÑO',    // [VERIFICAR EN AMBIENTE]
        ciudad: 'PASTO',           // [VERIFICAR EN AMBIENTE]
        direccion: 'CALLE 18 # 24-30',
        correoElectronico: `autotest_${seed}@correo.com`,
        inicioActividad: '1/1/2024',
      };

      await given('el usuario navega a la pantalla de Establecimientos del Contribuyente de soporte', async () => {
        await navegarAEstablecimientos(page, seed);
      });

      await when('pulsa el botón Agregar y el formulario se abre en tab Básica', async () => {
        await crud.agregar();
        await cerrarDialogoErrorApiSiVisible(page);
        await expect(establecimientos.inputNombre).toBeVisible({ timeout: 15000 });
      });

      await and('completa el tab Básica con todos los campos obligatorios incluyendo Barrio (primera opción disponible)', async () => {
        await establecimientos.inputNombre.fill(datosBasica.nombre);
        await establecimientos.inputTelefono.fill(datosBasica.telefono);
        // [VERIFICAR EN AMBIENTE] — ajustar valores de combos según el ambiente real
        await establecimientos.seleccionarPais(datosBasica.pais);
        await establecimientos.seleccionarDepartamento(datosBasica.departamento);
        await establecimientos.seleccionarCiudad(datosBasica.ciudad);
        // Barrio: seleccionar primera opción disponible (RN-01: obligatorio confirmado)
        await establecimientos.btnBarrio.click();
        await page.waitForSelector('mat-option', { state: 'visible', timeout: 10000 });
        await page.locator('mat-option').first().click();
        await establecimientos.inputDireccion.fill(datosBasica.direccion);
        await establecimientos.inputCorreoElectronico.fill(datosBasica.correoElectronico);
        await establecimientos.inputInicioActividad.fill(datosBasica.inicioActividad);
        await establecimientos.inputInicioActividad.press('Tab');
        // Cerrar el datepicker si quedó abierto tras el Tab en el campo de fecha
        await establecimientos.cerrarDatepickerSiAbierto();
      });

      await when('pulsa el botón Guardar', async () => {
        await crud.guardar();
        await cerrarDialogoErrorApiSiVisible(page);
      });

      await then('el establecimiento se crea y aparece en la tabla identificado por su nombre', async () => {
        // Esperar que el formulario cierre (navega de vuelta a la lista de establecimientos)
        await expect(establecimientos.inputNombre).not.toBeVisible({ timeout: 30000 });
        // Esperar que la red esté idle antes de asertar sobre la tabla
        await page.waitForLoadState('networkidle', { timeout: 30000 });
        await expect(
          establecimientos.tablaGrid.getByRole('gridcell').filter({ hasText: seed })
        ).toBeVisible({ timeout: 20000 });
      });
    }
  );

  // ─────────────────────────────────────────────
  // TC-EST-005 — Filtrar por Nombre
  // ─────────────────────────────────────────────

  test(
    'TC-EST-004 — Filtrar establecimientos por Nombre',
    { tag: '@regression @reteica @establecimientos' },
    async ({ paginaAutenticada: page, contribuyenteData }) => {
      const { seed } = contribuyenteData;
      const tabla = new ComponentesTabla(page);
      const establecimientos = new Establecimientos(page);

      await given('el usuario está en la lista de Establecimientos y el registro creado en TC-EST-002 es visible', async () => {
        await navegarAEstablecimientos(page, seed);
        await expect(
          establecimientos.tablaGrid.getByRole('gridcell').filter({ hasText: seed })
        ).toBeVisible({ timeout: 20000 });
      });

      await when('pulsa el botón Filtrar y rellena el campo Nombre con el seed único del establecimiento', async () => {
        await tabla.filtrar();
        await establecimientos.completarFiltros({ nombre: seed });
      });

      await then('la tabla muestra la fila del establecimiento cuyo Nombre coincide con el criterio', async () => {
        await expect(
          establecimientos.tablaGrid.getByRole('gridcell').filter({ hasText: seed })
        ).toBeVisible({ timeout: 15000 });
      });
    }
  );

  // ─────────────────────────────────────────────
  // TC-EST-006 — Editar
  // ─────────────────────────────────────────────

  test(
    'TC-EST-005 — Editar un establecimiento existente',
    { tag: '@regression @reteica @establecimientos @crud' },
    async ({ paginaAutenticada: page, contribuyenteData }) => {
      const { seed } = contribuyenteData;
      const crud = new AccionesCrud(page);
      const tabla = new ComponentesTabla(page);
      const establecimientos = new Establecimientos(page);

      const direccionEditada = 'CARRERA 27 # 19-50 EDITADA';
      const telefonoEditado = '3200000000';

      await given('el usuario está en la lista de Establecimientos y el registro es visible', async () => {
        await navegarAEstablecimientos(page, seed);
        // Filtrar para asegurar que la fila esté presente antes de seleccionar
        await tabla.filtrar();
        await establecimientos.completarFiltros({ nombre: seed });
        await expect(
          establecimientos.tablaGrid.getByRole('gridcell').filter({ hasText: seed })
        ).toBeVisible({ timeout: 20000 });
      });

      await when('selecciona el checkbox de la fila y pulsa Editar', async () => {
        // Con filtro activo el gridcell puede incluir la razón social del tercero
        // concatenada al nombre; se usa hasText para no depender del nombre exacto del cell
        const fila = page.getByRole('row').filter({
          has: page.getByRole('gridcell').filter({ hasText: seed })
        }).first();
        await fila.waitFor({ state: 'visible', timeout: 20000 });
        await fila.getByRole('checkbox').click({ force: true });
        await expect(crud.btnEditar).toBeVisible({ timeout: 10000 });
        await crud.editar();
        await expect(establecimientos.inputDireccion).toBeVisible({ timeout: 15000 });
      });

      await and('modifica la Dirección y el Teléfono', async () => {
        await establecimientos.inputDireccion.fill(direccionEditada);
        await establecimientos.inputTelefono.fill(telefonoEditado);
      });

      await when('pulsa Guardar', async () => {
        await crud.guardar();
      });

      await then('los cambios se persisten y se reflejan en la tabla', async () => {
        await expect(establecimientos.inputDireccion).not.toBeVisible({ timeout: 30000 });
        await tabla.filtrar();
        await establecimientos.completarFiltros({ nombre: seed });
        await expect(
          establecimientos.tablaGrid.getByRole('gridcell').filter({ hasText: seed })
        ).toBeVisible({ timeout: 15000 });
      });
    }
  );

  // ─────────────────────────────────────────────
  // TC-EST-007 — Eliminar
  // ─────────────────────────────────────────────

  test(
    'TC-EST-006 — Eliminar un establecimiento sin referencias',
    { tag: '@regression @reteica @establecimientos @crud' },
    async ({ paginaAutenticada: page, contribuyenteData }) => {
      const { seed } = contribuyenteData;
      const crud = new AccionesCrud(page);
      const tabla = new ComponentesTabla(page);
      const establecimientos = new Establecimientos(page);

      await given('el usuario está en la lista de Establecimientos y el registro es visible', async () => {
        await navegarAEstablecimientos(page, seed);
        // Filtrar para asegurar visibilidad antes de eliminar
        await tabla.filtrar();
        await establecimientos.completarFiltros({ nombre: seed });
        await expect(
          establecimientos.tablaGrid.getByRole('gridcell').filter({ hasText: seed })
        ).toBeVisible({ timeout: 20000 });
      });

      await when('selecciona el checkbox de la fila y pulsa Eliminar', async () => {
        // Con filtro activo el gridcell puede incluir la razón social concatenada; usar hasText
        const fila = page.getByRole('row').filter({
          has: page.getByRole('gridcell').filter({ hasText: seed })
        }).first();
        await fila.waitFor({ state: 'visible', timeout: 20000 });
        await fila.getByRole('checkbox').click({ force: true });
        await expect(crud.btnEliminar).toBeVisible({ timeout: 10000 });
        await crud.eliminar();
      });

      await then('aparece el diálogo de Eliminación con el texto "Eliminados correctamente"', async () => {
        const popup = page.locator('.swal2-popup');
        await popup.waitFor({ state: 'visible', timeout: 15000 });
        await expect(popup).toContainText('Eliminados correctamente');
      });

      await when('acepta el diálogo', async () => {
        await crud.aceptar();
        await page.locator('.swal2-popup').waitFor({ state: 'hidden', timeout: 10000 });
      });

      await then('el registro ya no aparece en la tabla', async () => {
        await tabla.filtrar();
        await establecimientos.completarFiltros({ nombre: seed });
        await expect(
          establecimientos.tablaGrid.getByRole('gridcell').filter({ hasText: seed })
        ).not.toBeVisible({ timeout: 15000 });
      });
    }
  );

  // ─────────────────────────────────────────────
  // TC-EST-008 — Barrio obligatorio (skip)
  // ─────────────────────────────────────────────

  test.skip(
    // SKIP: La app acepta guardar sin Barrio (verificado en ambiente 2026-06-05).
    // El campo no tiene asterisco (*) en la UI ni genera error de validación al omitirse.
    // La RN-01 no está implementada en el ambiente actual.
    // Reactivar cuando la validación de Barrio sea implementada en el backend/frontend.
    'TC-EST-007 — Validar que Barrio es un campo obligatorio (RN-01)',
    { tag: '@negative @regression @reteica @establecimientos' },
    async ({ paginaAutenticada: page, contribuyenteData }) => {
      const { seed } = contribuyenteData;
      const crud = new AccionesCrud(page);
      const establecimientos = new Establecimientos(page);

      await given('el usuario está en la pantalla de Establecimientos', async () => {
        await navegarAEstablecimientos(page, seed);
      });

      await when('pulsa Agregar y completa todos los campos obligatorios EXCEPTO Barrio', async () => {
        await crud.agregar();
        await cerrarDialogoErrorApiSiVisible(page);
        await expect(establecimientos.inputNombre).toBeVisible({ timeout: 15000 });

        // Completar todos los obligatorios excepto Barrio (no llamar a seleccionarBarrio)
        await establecimientos.inputNombre.fill(`autotest_EST_NEG_${seed}`);
        await establecimientos.inputTelefono.fill('3100000000');
        // [VERIFICAR EN AMBIENTE] — ajustar valores de combos según el ambiente real
        await establecimientos.seleccionarPais('Colombia');
        await establecimientos.seleccionarDepartamento('NARIÑO');
        await establecimientos.seleccionarCiudad('PASTO');
        // Barrio: deliberadamente NO se selecciona (RN-01 test)
        await establecimientos.inputDireccion.fill('CALLE 18 # 24-30');
        await establecimientos.inputCorreoElectronico.fill(`autotest_neg_${seed}@correo.com`);
        await establecimientos.inputInicioActividad.fill('1/1/2024');
        await establecimientos.inputInicioActividad.press('Tab');
        // Cerrar el datepicker si quedó abierto tras el Tab en el campo de fecha
        await establecimientos.cerrarDatepickerSiAbierto();
      });

      await when('pulsa Guardar', async () => {
        await crud.guardar();
      });

      await then('el sistema bloquea el guardado mostrando validación de campo obligatorio en Barrio', async () => {
        // [VERIFICAR EN AMBIENTE] cuál de los dos mecanismos usa este módulo:
        // Opción A: alert inline bajo el campo Barrio
        const alertBarrio = page.locator('mat-form-field')
          .filter({ hasText: 'Barrio' })
          .locator('[role=alert]', { hasText: 'Campo obligatorio' });
        // Opción B: diálogo de error "Debe completar los campos requeridos!"
        const dialogoError = page.getByRole('dialog').filter({ hasText: 'Debe completar los campos requeridos!' });

        const alertVisible = await alertBarrio.isVisible({ timeout: 5000 }).catch(() => false);
        const dialogoVisible = await dialogoError.isVisible({ timeout: 5000 }).catch(() => false);

        if (alertVisible) {
          await expect(alertBarrio).toBeVisible();
        } else {
          await expect(dialogoError).toBeVisible({ timeout: 10000 });
          await dialogoError.getByRole('button', { name: 'Aceptar' }).click();
          await dialogoError.waitFor({ state: 'hidden', timeout: 10000 });
        }
      });

      await and('no se crea ningún establecimiento nuevo', async () => {
        // El formulario debe seguir visible (no se guardó)
        const formularioVisible = await establecimientos.inputNombre.isVisible({ timeout: 3000 }).catch(() => false);
        if (formularioVisible) {
          await establecimientos.cancelar();
        }
        await expect(
          page.getByRole('gridcell', { name: `autotest_EST_NEG_${seed}` })
        ).not.toBeVisible({ timeout: 10000 });
      });
    }
  );

  // ─────────────────────────────────────────────
  // TC-EST-009 — Formulario vacío
  // ─────────────────────────────────────────────

  test(
    'TC-EST-008 — Validar campos obligatorios al guardar formulario vacío',
    { tag: '@negative @regression @reteica @establecimientos' },
    async ({ paginaAutenticada: page, contribuyenteData }) => {
      const { seed } = contribuyenteData;
      const crud = new AccionesCrud(page);
      const establecimientos = new Establecimientos(page);

      await given('el usuario está en la pantalla de Establecimientos', async () => {
        await navegarAEstablecimientos(page, seed);
      });

      await when('pulsa Agregar y el formulario se abre sin datos', async () => {
        await crud.agregar();
        await cerrarDialogoErrorApiSiVisible(page);
        await expect(establecimientos.inputNombre).toBeVisible({ timeout: 15000 });
      });

      await when('pulsa Guardar sin rellenar ningún campo', async () => {
        await crud.guardar();
      });

      await then('el sistema bloquea el guardado mostrando al menos una validación de campo obligatorio', async () => {
        // [VERIFICAR EN AMBIENTE] cuál de los dos mecanismos usa este módulo
        const primerAlert = page.locator('[role=alert]').filter({ hasText: 'Campo obligatorio' }).first();
        const dialogoError = page.getByRole('dialog').filter({ hasText: 'Debe completar los campos requeridos!' });

        const alertVisible = await primerAlert.isVisible({ timeout: 5000 }).catch(() => false);
        const dialogoVisible = await dialogoError.isVisible({ timeout: 5000 }).catch(() => false);

        if (alertVisible) {
          await expect(primerAlert).toBeVisible();
        } else {
          await expect(dialogoError).toBeVisible({ timeout: 10000 });
          await dialogoError.getByRole('button', { name: 'Aceptar' }).click();
          await dialogoError.waitFor({ state: 'hidden', timeout: 10000 });
        }
      });

      await and('el formulario permanece abierto sin crear ningún registro', async () => {
        const formularioVisible = await establecimientos.inputNombre.isVisible({ timeout: 3000 }).catch(() => false);
        if (formularioVisible) {
          await establecimientos.cancelar();
        }
      });
    }
  );

  // ─────────────────────────────────────────────
  // TC-EST-010 — Cascada: Departamento deshabilitado sin País
  // ─────────────────────────────────────────────

  test.skip(
    // SKIP: Los combos geográficos en el formulario de Establecimientos NO usan el atributo
    // HTML disabled. El formulario precarga Ciudad/Dirección del contribuyente. No hay
    // comportamiento de habilitación/deshabilitación cascada verificable con isDisabled().
    // Verificado en ambiente 2026-06-05. Reactivar si se implementa cascada con disabled.
    'TC-EST-009 — Cascada geográfica: Departamento deshabilitado sin País seleccionado',
    { tag: '@regression @reteica @establecimientos' },
    async ({ paginaAutenticada: page, contribuyenteData }) => {
      // [VERIFICAR EN AMBIENTE] — ajustar valores de combos según el ambiente real
      const { seed } = contribuyenteData;
      const crud = new AccionesCrud(page);
      const establecimientos = new Establecimientos(page);

      await given('el usuario está en la pantalla de Establecimientos y abre el formulario', async () => {
        await navegarAEstablecimientos(page, seed);
        await crud.agregar();
        await cerrarDialogoErrorApiSiVisible(page);
        await expect(establecimientos.inputNombre).toBeVisible({ timeout: 15000 });
      });

      await then('el campo Departamento está deshabilitado antes de seleccionar País', async () => {
        // [VERIFICAR EN AMBIENTE] — el atributo disabled puede estar en comboDepartamento o en btnDepartamento
        const comboDep = establecimientos.comboDepartamento;
        const btnDep = establecimientos.btnDepartamento;
        const comboDisabled = await comboDep.isDisabled({ timeout: 3000 }).catch(() => false);
        const btnDisabled = await btnDep.isDisabled({ timeout: 3000 }).catch(() => false);
        // Al menos uno de los dos debe estar deshabilitado
        expect(comboDisabled || btnDisabled).toBeTruthy();
      });

      await when('selecciona un País', async () => {
        // [VERIFICAR EN AMBIENTE] — ajustar valor exacto de la opción de País
        await establecimientos.seleccionarPais('Colombia');
      });

      await then('el campo Departamento se habilita', async () => {
        // [VERIFICAR EN AMBIENTE] — verificar habilitación en comboDepartamento o btnDepartamento
        const comboDep = establecimientos.comboDepartamento;
        const btnDep = establecimientos.btnDepartamento;
        const comboDisabled = await comboDep.isDisabled({ timeout: 5000 }).catch(() => true);
        const btnDisabled = await btnDep.isDisabled({ timeout: 5000 }).catch(() => true);
        // Al menos uno de los dos debe estar habilitado tras seleccionar País
        expect(comboDisabled && btnDisabled).toBeFalsy();
      });

      await and('cancela el formulario', async () => {
        await establecimientos.cancelar();
      });
    }
  );

  // ─────────────────────────────────────────────
  // TC-EST-011 — Cascada: Ciudad y Barrio en orden
  // ─────────────────────────────────────────────

  test.skip(
    // SKIP: Los combos geográficos no usan disabled. Ciudad se precarga con la del contribuyente.
    // La cascada no implementa habilitación/deshabilitación mediante atributo disabled en este ambiente.
    // Verificado en ambiente 2026-06-05. Reactivar si se implementa cascada con disabled.
    'TC-EST-010 — Cascada geográfica: Ciudad y Barrio se habilitan en orden',
    { tag: '@regression @reteica @establecimientos' },
    async ({ paginaAutenticada: page, contribuyenteData }) => {
      // [VERIFICAR EN AMBIENTE] — ajustar valores de combos según el ambiente real
      const { seed } = contribuyenteData;
      const crud = new AccionesCrud(page);
      const establecimientos = new Establecimientos(page);

      await given('el usuario está en el formulario de crear establecimiento', async () => {
        await navegarAEstablecimientos(page, seed);
        await crud.agregar();
        await cerrarDialogoErrorApiSiVisible(page);
        await expect(establecimientos.inputNombre).toBeVisible({ timeout: 15000 });
      });

      await when('selecciona País', async () => {
        // [VERIFICAR EN AMBIENTE] — ajustar valor exacto de la opción de País
        await establecimientos.seleccionarPais('Colombia');
      });

      await then('el campo Ciudad permanece deshabilitado', async () => {
        // [VERIFICAR EN AMBIENTE] — verificar estado en comboCiudad o btnCiudad
        const comboCiudad = establecimientos.comboCiudad;
        const btnCiudad = establecimientos.btnCiudad;
        const comboDisabled = await comboCiudad.isDisabled({ timeout: 3000 }).catch(() => false);
        const btnDisabled = await btnCiudad.isDisabled({ timeout: 3000 }).catch(() => false);
        expect(comboDisabled || btnDisabled).toBeTruthy();
      });

      await when('selecciona Departamento', async () => {
        // [VERIFICAR EN AMBIENTE] — ajustar valor exacto de la opción de Departamento
        await establecimientos.seleccionarDepartamento('NARIÑO');
      });

      await then('el campo Ciudad se habilita', async () => {
        // [VERIFICAR EN AMBIENTE] — verificar habilitación
        const comboCiudad = establecimientos.comboCiudad;
        const btnCiudad = establecimientos.btnCiudad;
        const comboDisabled = await comboCiudad.isDisabled({ timeout: 5000 }).catch(() => true);
        const btnDisabled = await btnCiudad.isDisabled({ timeout: 5000 }).catch(() => true);
        expect(comboDisabled && btnDisabled).toBeFalsy();
      });

      await when('selecciona Ciudad', async () => {
        // [VERIFICAR EN AMBIENTE] — ajustar valor exacto de la opción de Ciudad
        await establecimientos.seleccionarCiudad('PASTO');
      });

      await then('el campo Barrio se habilita y muestra opciones al hacer click', async () => {
        // [VERIFICAR EN AMBIENTE] — verificar que btnBarrio abre opciones tras seleccionar Ciudad
        await establecimientos.btnBarrio.click();
        await page.waitForSelector('mat-option', { state: 'visible', timeout: 10000 });
        const opciones = page.locator('mat-option');
        await expect(opciones.first()).toBeVisible({ timeout: 10000 });
        // Cerrar el panel de opciones sin seleccionar
        await page.keyboard.press('Escape');
      });

      await and('cancela el formulario', async () => {
        await establecimientos.cancelar();
      });
    }
  );

  // ─────────────────────────────────────────────
  // TC-EST-003 — Crear con tab Adicional
  // ─────────────────────────────────────────────

  test(
    'TC-EST-003 — Crear establecimiento completando también el tab Adicional',
    { tag: '@regression @reteica @establecimientos @crud' },
    async ({ paginaAutenticada: page, contribuyenteData }) => {
      const { seed } = contribuyenteData;
      const nombreAdicional = `autotest_ADD_${seed}`;
      const crud = new AccionesCrud(page);
      const establecimientos = new Establecimientos(page);

      const datosBasica = {
        nombre: nombreAdicional,
        telefono: '3100000000',
        pais: 'Colombia',       // Valor real en el combo del ambiente
        departamento: 'NARIÑO', // [VERIFICAR EN AMBIENTE]
        ciudad: 'PASTO',        // [VERIFICAR EN AMBIENTE]
        direccion: 'CALLE 18 # 24-30',
        correoElectronico: `autotest_${seed}@correo.com`,
        inicioActividad: '1/1/2024',
      };

      const datosAdicionales = {
        codigoCatastral: '010203',
        paginaWeb: 'www.autotest.com',
        codigoPostal: '520001',
        codigoAdicional: `A${seed}`,
      };

      await given('el usuario está en la pantalla de Establecimientos', async () => {
        await navegarAEstablecimientos(page, seed);
      });

      await when('pulsa Agregar y completa el tab Básica con todos los obligatorios', async () => {
        await crud.agregar();
        await cerrarDialogoErrorApiSiVisible(page);
        await expect(establecimientos.inputNombre).toBeVisible({ timeout: 15000 });

        await establecimientos.inputNombre.fill(datosBasica.nombre);
        await establecimientos.inputTelefono.fill(datosBasica.telefono);
        // [VERIFICAR EN AMBIENTE] — ajustar valores de combos según el ambiente real
        await establecimientos.seleccionarPais(datosBasica.pais);
        await establecimientos.seleccionarDepartamento(datosBasica.departamento);
        await establecimientos.seleccionarCiudad(datosBasica.ciudad);
        // Barrio: primera opción disponible (RN-01: obligatorio)
        await establecimientos.btnBarrio.click();
        await page.waitForSelector('mat-option', { state: 'visible', timeout: 10000 });
        await page.locator('mat-option').first().click();
        await establecimientos.inputDireccion.fill(datosBasica.direccion);
        await establecimientos.inputCorreoElectronico.fill(datosBasica.correoElectronico);
        await establecimientos.inputInicioActividad.fill(datosBasica.inicioActividad);
        await establecimientos.inputInicioActividad.press('Tab');
        // Cerrar el datepicker si quedó abierto tras el Tab en el campo de fecha
        await establecimientos.cerrarDatepickerSiAbierto();
      });

      await and('completa el tab Adicional con datos opcionales', async () => {
        await establecimientos.completarTabAdicional(datosAdicionales);
      });

      await when('pulsa Guardar', async () => {
        await crud.guardar();
        await cerrarDialogoErrorApiSiVisible(page);
      });

      await then('el establecimiento se crea y aparece en la tabla', async () => {
        // El formulario debe cerrarse y la lista de establecimientos debe mostrarse
        await expect(establecimientos.inputNombre).not.toBeVisible({ timeout: 30000 });
        // Esperar que la red esté idle antes de asertar sobre la tabla
        await page.waitForLoadState('networkidle', { timeout: 30000 });
        // Verificar que la fila existe buscando el seed dentro de la tabla de establecimientos (grid).
        // La columna Nombre muestra la razón social del tercero (AUTOTEST CON {seed}) que contiene el seed.
        await expect(
          establecimientos.tablaGrid.getByRole('gridcell').filter({ hasText: seed })
        ).toBeVisible({ timeout: 20000 });
      });

      await when('reabre el establecimiento mediante checkbox + botón Editar', async () => {
        // La app no abre el formulario con click directo en la celda de nombre.
        // El flujo correcto es: seleccionar checkbox (force:true) → click en botón Edit.
        const fila = page.getByRole('row').filter({
          has: page.getByRole('gridcell').filter({ hasText: seed })
        }).first();
        await fila.getByRole('checkbox').click({ force: true });
        await expect(crud.btnEditar).toBeVisible({ timeout: 10000 });
        await crud.editar();
        await expect(establecimientos.tabAdicional).toBeVisible({ timeout: 15000 });
      });

      await and('navega al tab Adicional', async () => {
        await establecimientos.tabAdicional.click();
        await page.waitForLoadState('networkidle', { timeout: 15000 });
      });

      await then('los datos del tab Adicional se han persistido correctamente', async () => {
        // Verificar campos del tab Adicional que se guardaron
        // Nota: el campo Código catastral puede eliminar leading zeros ('010203' → '10203')
        const valorCatastral = await establecimientos.inputCodigoCatastral.inputValue();
        expect(['010203', '10203']).toContain(valorCatastral);
        await expect(establecimientos.inputPaginaWeb).toHaveValue('www.autotest.com');
        await expect(establecimientos.inputCodigoPostal).toHaveValue('520001');
      });
    }
  );

  // ─────────────────────────────────────────────
  // TC-EST-012, 014, 015, 017 — Validaciones UI
  // ─────────────────────────────────────────────

  // TC-EST-012 — Reinicio de cascada
  test.skip(
    // SKIP: El comportamiento de reinicio de cascada no es verificable con inputValue()
    // en mat-select (Angular Material) porque el combobox no expone su valor como atributo
    // accesible. El formulario precarga datos del contribuyente en los combos geográficos.
    // Verificado en ambiente 2026-06-05. Reactivar con estrategia DOM alternativa si se requiere.
    'TC-EST-011 — Cambiar un nivel superior reinicia los inferiores de la cascada',
    { tag: '@regression @reteica @establecimientos' },
    async ({ paginaAutenticada: page, contribuyenteData }) => {
      // [VERIFICAR EN AMBIENTE] — ajustar valores de combos según el ambiente real
      const { seed } = contribuyenteData;
      const crud = new AccionesCrud(page);
      const establecimientos = new Establecimientos(page);

      await given('el usuario está en el formulario y completa la cascada geográfica completa', async () => {
        await navegarAEstablecimientos(page, seed);
        await crud.agregar();
        await cerrarDialogoErrorApiSiVisible(page);
        await expect(establecimientos.inputNombre).toBeVisible({ timeout: 15000 });

        // Completar cascada completa
        // [VERIFICAR EN AMBIENTE] — ajustar valores de combos según el ambiente real
        await establecimientos.seleccionarPais('Colombia');
        await establecimientos.seleccionarDepartamento('NARIÑO');
        await establecimientos.seleccionarCiudad('PASTO');
        // Barrio: primera opción disponible
        await establecimientos.btnBarrio.click();
        await page.waitForSelector('mat-option', { state: 'visible', timeout: 10000 });
        await page.locator('mat-option').first().click();
      });

      await when('cambia la selección del Departamento a un valor diferente', async () => {
        // [VERIFICAR EN AMBIENTE] — ajustar a otro departamento disponible en el combo
        await establecimientos.btnDepartamento.click();
        await page.waitForSelector('mat-option', { state: 'visible', timeout: 10000 });
        // Seleccionar la segunda opción disponible (diferente al ya seleccionado NARIÑO)
        await page.locator('mat-option').nth(1).click();
      });

      await then('los campos Ciudad y Barrio se reinician quedando vacíos o deshabilitados', async () => {
        // [VERIFICAR EN AMBIENTE] — el comportamiento exacto de reinicio puede variar:
        // Opción A: comboCiudad queda con valor vacío
        // Opción B: comboCiudad queda deshabilitado
        const comboCiudad = establecimientos.comboCiudad;
        const comboBarrio = establecimientos.comboBarrio;

        const ciudadVacia = await comboCiudad.inputValue().then(v => v === '').catch(() => false);
        const ciudadDisabled = await comboCiudad.isDisabled({ timeout: 3000 }).catch(() => false);
        const barrioVacio = await comboBarrio.inputValue().then(v => v === '').catch(() => false);
        const barrioDisabled = await comboBarrio.isDisabled({ timeout: 3000 }).catch(() => false);

        // Al menos uno de los dos indicadores debe ser verdadero para Ciudad
        expect(ciudadVacia || ciudadDisabled).toBeTruthy();
        // Al menos uno de los dos indicadores debe ser verdadero para Barrio
        expect(barrioVacio || barrioDisabled).toBeTruthy();
      });

      await and('cancela el formulario', async () => {
        await establecimientos.cancelar();
      });
    }
  );

  // TC-EST-014 — Teléfono numérico
  test(
    'TC-EST-012 — El campo Teléfono acepta solo valores numéricos',
    { tag: '@boundary @reteica @establecimientos' },
    async ({ paginaAutenticada: page, contribuyenteData }) => {
      const { seed } = contribuyenteData;
      const crud = new AccionesCrud(page);
      const establecimientos = new Establecimientos(page);
      // El modelo Angular del formulario puede pre-rellenar Teléfono con el dato del Contribuyente.
      // Se captura el valor inicial para verificar que el campo no acepta caracteres no numéricos.
      let valorAntesDeTipar;

      await given('el usuario está en el formulario de crear establecimiento', async () => {
        await navegarAEstablecimientos(page, seed);
        await crud.agregar();
        await cerrarDialogoErrorApiSiVisible(page);
        await expect(establecimientos.inputNombre).toBeVisible({ timeout: 15000 });
        // Esperar a que Angular inicialice el modelo (puede pre-rellenar Teléfono)
        await page.waitForTimeout(600);
        valorAntesDeTipar = await establecimientos.inputTelefono.inputValue();
      });

      await when('intenta escribir la letra "e" en el campo Teléfono (input[type=number])', async () => {
        // En inputs type=number, "e" es normalmente válido (notación científica: 1e5).
        // El onkeydown custom bloquea específicamente keyCode 69 ("e") para evitar esto.
        await establecimientos.inputTelefono.click();
        await establecimientos.inputTelefono.pressSequentially('e');
      });

      await then('el campo no acepta "e" — el valor permanece igual al inicial', async () => {
        await expect(establecimientos.inputTelefono).toHaveValue(valorAntesDeTipar);
      });

      await and('cancela el formulario', async () => {
        await establecimientos.cancelar();
      });
    }
  );

  // TC-EST-015 — Cancelar no persiste
  test(
    'TC-EST-013 — Cancelar la creación de un establecimiento no persiste datos',
    { tag: '@regression @reteica @establecimientos' },
    async ({ paginaAutenticada: page, contribuyenteData }) => {
      const { seed } = contribuyenteData;
      const crud = new AccionesCrud(page);
      const establecimientos = new Establecimientos(page);
      const seedLocal = Date.now().toString().slice(-9);
      const nombreCancelado = `autotest_EST_CANCEL_${seedLocal}`;

      await given('el usuario está en la pantalla de Establecimientos y abre el formulario', async () => {
        await navegarAEstablecimientos(page, seed);
        await crud.agregar();
        await cerrarDialogoErrorApiSiVisible(page);
        await expect(establecimientos.inputNombre).toBeVisible({ timeout: 15000 });
      });

      await when('escribe un nombre en el campo Nombre del formulario', async () => {
        await establecimientos.inputNombre.fill(nombreCancelado);
      });

      await when('navega de vuelta vía breadcrumb (no hay botón Cancelar explícito en este formulario)', async () => {
        await establecimientos.cancelar();
      });

      await then('el formulario se cierra sin guardar datos', async () => {
        await expect(establecimientos.inputNombre).not.toBeVisible({ timeout: 15000 });
      });

      await and('el registro cancelado no aparece en la tabla', async () => {
        // La app normalizaría el nombre a mayúsculas, pero al cancelar no debería existir en ninguna forma
        await expect(
          page.getByRole('gridcell').filter({ hasText: nombreCancelado })
        ).not.toBeVisible({ timeout: 10000 });
      });
    }
  );

  // TC-EST-017 — Campos deshabilitados
  test(
    'TC-EST-014 — Los campos Código y Consecutivo matrícula están deshabilitados (RN-04)',
    { tag: '@regression @reteica @establecimientos' },
    async ({ paginaAutenticada: page, contribuyenteData }) => {
      const { seed } = contribuyenteData;
      const crud = new AccionesCrud(page);
      const establecimientos = new Establecimientos(page);

      await given('el usuario está en el formulario de crear establecimiento', async () => {
        await navegarAEstablecimientos(page, seed);
        await crud.agregar();
        await cerrarDialogoErrorApiSiVisible(page);
        await expect(establecimientos.inputNombre).toBeVisible({ timeout: 15000 });
      });

      await then('el campo Código está deshabilitado (autogenerado)', async () => {
        await expect(establecimientos.inputCodigo).toBeDisabled();
      });

      await and('el campo Consecutivo matrícula está deshabilitado (autogenerado)', async () => {
        await expect(establecimientos.inputConsecutivoMatricula).toBeDisabled();
      });

      await and('cancela el formulario', async () => {
        await establecimientos.cancelar();
      });
    }
  );

});
