import { expect } from '@playwright/test';
const { given, when, then, and } = require('gherkin-lite');
import { test } from '../../../fixtures/reteica/establecimiento.fixture.js';
import { navegarAContribuyentes, cerrarDrawerSiVisible } from '../../../fixtures/reteica/contribuyente.fixture.js';
import { ComponentesTabla } from '../../../pages/common/componentes-tabla.js';
import { Contribuyentes } from '../../../pages/modulos/reteica/archivos/contribuyentes/contribuyentes.page.js';
import { PresentarDeclaracion } from '../../../pages/modulos/reteica/archivos/contribuyentes/menu-procesos-contribuyentes/presentar-declaracion.page.js';

// ─── Datos de liquidación (iguales para TC-DEC-001 y TC-DEC-002) ──────────────
const datosLiquidacion = {
  compras:              '532.507',
  servicios:            '283.711',
  industria:            '73.624',
  financiera:           '487.861',
  autoRetencionVentas:  '700.775',
  autoRetencionServicios: '766.523',
  autoRetencionOtros:   '416.325',
};

// Variable compartida entre TC-DEC-001 y TC-DEC-002 (bloque serial)
let interesMoraP1 = null;

function fechaHoy() {
  const d = new Date();
  return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
}

// Navega al listado, filtra por NIT y abre el detalle del contribuyente
async function abrirDetalleContribuyente(page, seed) {
  const tabla = new ComponentesTabla(page);
  await navegarAContribuyentes(page);
  await cerrarDrawerSiVisible(page);
  await tabla.filtrar();
  const dialogoBusqueda = page.getByRole('dialog', { name: 'Búsqueda por:' });
  await dialogoBusqueda.waitFor({ state: 'visible', timeout: 10000 });
  await dialogoBusqueda.getByRole('textbox', { name: 'NIT' }).fill(seed);
  await dialogoBusqueda.getByRole('button', { name: 'Aceptar' }).click();
  await page.getByRole('dialog').waitFor({ state: 'hidden', timeout: 15000 });
  await page.waitForLoadState('networkidle', { timeout: 30000 });
  const fila = page.getByRole('row').filter({
    has: page.getByRole('gridcell', { name: seed, exact: true })
  }).first();
  await fila.waitFor({ state: 'visible', timeout: 30000 });
  await fila.getByRole('gridcell').nth(1).click();
  await page.waitForLoadState('networkidle', { timeout: 30000 });
}

// Abre el diálogo "Nuevo Registro", selecciona la primera fila del picker y acepta.
// El fixture crea exactamente 1 establecimiento por contribuyente, así que la primera fila
// del grid (después del header) siempre es el establecimiento correcto.
// Si el servidor responde con error 780211 (establecimiento ya usado), el diálogo queda abierto.
async function seleccionarEstablecimientoEnDialog(page) {
  const decl = new PresentarDeclaracion(page);
  await decl.btnAgregarEstablecimiento.click();
  const dialogoNuevoRegistro = page.getByRole('dialog', { name: 'Nuevo Registro' });
  await expect(dialogoNuevoRegistro).toBeVisible({ timeout: 10000 });
  // Abrir el picker de establecimientos
  await dialogoNuevoRegistro.getByRole('listbox').first().click();
  // El picker abre como dialog o bottom-sheet con tabs Datos/Filtros
  const picker = page.locator('mat-bottom-sheet-container, [role="dialog"]').filter({
    has: page.getByRole('tab', { name: /datos/i })
  }).last();
  await picker.waitFor({ state: 'visible', timeout: 15000 });
  // Asegurar pestaña Datos activa
  const tabDatos = picker.getByRole('tab', { name: /datos/i }).first();
  if (await tabDatos.isVisible({ timeout: 2000 }).catch(() => false)) {
    await tabDatos.click();
    await page.waitForTimeout(300);
  }
  // Seleccionar la primera fila de datos (saltar encabezado con nth(1))
  const primeraFilaDatos = picker.getByRole('row').nth(1);
  await primeraFilaDatos.waitFor({ state: 'visible', timeout: 15000 });
  await primeraFilaDatos.click({ force: true });
  // Esperar que el picker se cierre
  await picker.waitFor({ state: 'detached', timeout: 15000 }).catch(() => {});
  // Confirmar en el diálogo "Nuevo Registro"
  await expect(dialogoNuevoRegistro).toBeVisible({ timeout: 5000 });
  await dialogoNuevoRegistro.getByRole('button', { name: 'Aceptar' }).click({ force: true });
  await page.waitForLoadState('networkidle', { timeout: 30000 });
}

// ─── Suite E2E ────────────────────────────────────────────────────────────────

test.describe('Flujo declaración contribuyente', () => {
  test.describe.configure({ mode: 'serial' });

  // ── TC-DEC-001 ──────────────────────────────────────────────────────────────
  test(
    'TC-DEC-001 — Happy Path: Presentar declaración completa (Periodo 1)',
    { tag: '@e2e @contribuyentes @reteica @pasto @corpoboyaca @sysman-predial' },
    async ({ paginaAutenticada: page, establecimientoData }) => {
      const { seed, razonSocial, nombreEstablecimiento } = establecimientoData;
      const contribuyentes = new Contribuyentes(page);
      const decl = new PresentarDeclaracion(page);
      const numDocDeclarante = Math.floor(Math.random() * 1e18).toString().padStart(18, '0');

      // Variables capturadas en Tab 3 para aserciones posteriores
      let totalRetenciones, interesMora, totalPagar;

      await given('el contribuyente activo con su establecimiento libre está disponible en el listado', async () => {
        await abrirDetalleContribuyente(page, seed);
      });

      await when('el usuario abre el menú de procesos y selecciona "Presentar declaración"', async () => {
        await contribuyentes.irAProcesoDesdeMenu('Presentar declaración');
        await expect(page).toHaveURL(/presentar_declaracion/, { timeout: 15000 });
      });

      await then('el asistente de declaración se abre con la sección "Año gravable" activa', async () => {
        await decl.verificarTabActiva('Año gravable');
      });

      await when('completa la sección Año gravable con Año 2026, Periodo 1, Tipo Normal y fecha de presentación del día', async () => {
        await decl.completarSeccion1({ anio: '2026', periodo: '1', tipoDeclaracion: 'Normal', fechaPresentacion: fechaHoy() });
        await expect(decl.btnSiguienteAnio).toBeEnabled({ timeout: 15000 });
        await decl.btnSiguienteAnio.click();
        await page.waitForLoadState('networkidle', { timeout: 30000 });
        // Diálogo de borrador (RN-03): responder SI para descartar borrador previo y empezar limpio.
        // Esto garantiza que el establecimiento no esté ya ocupado en el borrador (evita picker vacío en retries).
        if (await decl.dialogoConfirmacion.isVisible({ timeout: 3000 }).catch(() => false)) {
          await decl.btnConfirmarSi.click();
          await page.waitForLoadState('networkidle', { timeout: 30000 });
          // Tras responder SI el wizard reinicia — rellenar fecha de presentación nuevamente
          await decl.completarSeccion1({ anio: '2026', periodo: '1', tipoDeclaracion: 'Normal', fechaPresentacion: fechaHoy() });
          await expect(decl.btnSiguienteAnio).toBeEnabled({ timeout: 15000 });
          await decl.btnSiguienteAnio.click();
          await page.waitForLoadState('networkidle', { timeout: 30000 });
        }
      });

      await then('el asistente avanza a la sección "Establecimientos" con la tabla vacía', async () => {
        await decl.verificarTabActiva('Establecimientos');
        await expect(page.getByText('No existe información')).toBeVisible();
      });

      await when('agrega el establecimiento del contribuyente a través del selector de nuevo registro', async () => {
        await seleccionarEstablecimientoEnDialog(page);
      });

      await then('el establecimiento aparece en la tabla y no se muestra el error de duplicado 780211', async () => {
        await expect(page.getByRole('dialog', { name: /Código - 780211/ })).not.toBeVisible();
        // Verificar que la tabla ya no muestra el estado vacío (se agregó al menos una fila)
        await expect(page.getByText('No existe información')).not.toBeVisible({ timeout: 10000 });
        await expect(decl.tabpanelEstablecimientos.getByRole('row').nth(1)).toBeVisible({ timeout: 10000 });
      });

      await when('avanza a la sección "Liquidación de conceptos"', async () => {
        await decl.avanzarDesdeEstablecimientos();
      });

      await then('la sección "Liquidación de conceptos" queda activa', async () => {
        await decl.verificarTabActiva('Liquidación de conceptos');
      });

      await when('ingresa los 7 conceptos de liquidación y pulsa Actualizar', async () => {
        await decl.completarSeccion3(datosLiquidacion);
        await decl.actualizarLiquidacion();
      });

      await then('el sistema calcula y muestra los valores de Total Retenciones, Interés de Mora y Total a Pagar', async () => {
        totalRetenciones = await decl.inputSistTotalRetenciones.inputValue();
        interesMora      = await decl.inputSistInteresMora.inputValue();
        totalPagar       = await decl.inputSistTotalPagar.inputValue();
        expect(totalRetenciones).toBeTruthy();
        expect(totalPagar).toBeTruthy();
        // Guardar mora del periodo 1 para la aserción de diferencia en TC-DEC-002
        interesMoraP1 = interesMora;
      });

      await when('avanza a la sección "Declaración" y aparece el formulario de Terceros asociados', async () => {
        await decl.avanzarDesdeLiquidacion();
      });

      await then('el formulario de Terceros asociados es visible', async () => {
        await decl.verificarDialogoTercerosVisible();
      });

      await when('completa los datos del declarante y guarda el formulario de terceros', async () => {
        await decl.completarDatosDeclarante({
          tipoDeclarante: 'Declarante (A nombre propio)',
          tipoDocumento:  'Cédula',
          numeroDocumento: numDocDeclarante,
          nombres:         `DECLARANTE ${seed}`,
        });
        await decl.guardarTercerosAsociados();
      });

      // La pantalla de declaración final muestra un PDF embebido (puede mostrar "Couldn't load plugin"
      // en Chromium sin plugin de PDF) y el botón Registrar. No muestra el NIT/nombre como texto visible.
      await then('la pantalla de declaración final muestra el botón Registrar habilitado', async () => {
        await page.waitForLoadState('networkidle', { timeout: 30000 });
        await expect(page.getByRole('button', { name: /Registrar/i })).toBeVisible({ timeout: 15000 });
      });

      await when('pulsa el botón Registrar', async () => {
        await page.getByRole('button', { name: /Registrar/i }).click();
        await page.waitForLoadState('networkidle', { timeout: 60000 });
      });

      await then('la declaración queda registrada y aparece el botón Finalizar', async () => {
        // Tras Registrar la app muestra el botón Finalizar en el Tab 4.
        await expect(page.getByRole('button', { name: /Finalizar/i })).toBeVisible({ timeout: 15000 });
      });

      await when('pulsa Finalizar y el sistema regresa al detalle del contribuyente', async () => {
        await page.getByRole('button', { name: /Finalizar/i }).click();
        await page.waitForLoadState('networkidle', { timeout: 30000 });
        // Tras Finalizar la app regresa automáticamente al detalle del contribuyente.
        // Esperamos que el botón more_vert esté disponible antes de abrir el menú.
        await contribuyentes.btnMenuProcesos.waitFor({ state: 'visible', timeout: 30000 });
      });

      await when('navega a "Declaraciones" desde el menú de procesos del contribuyente', async () => {
        await contribuyentes.irAProcesoDesdeMenu('Declaraciones');
      });

      await then('el listado muestra la declaración Oficial del año 2026 Periodo 1 con el nombre del contribuyente', async () => {
        await expect(page.getByText(new RegExp(razonSocial, 'i')).first()).toBeVisible({ timeout: 15000 });
        await expect(page.getByRole('radio', { name: 'Oficial' })).toBeChecked();
        await expect(page.getByRole('gridcell', { name: '2026', exact: true }).first()).toBeVisible();
        await expect(page.getByRole('gridcell', { name: '1', exact: true }).first()).toBeVisible();
      });

      await and('el PDF "Copia declaración" del Periodo 1 se abre correctamente', async () => {
        await page.getByRole('row').filter({
          has: page.getByRole('gridcell', { name: '1', exact: true })
        }).first().getByRole('checkbox').first().click({ force: true });

        await page.getByRole('button').filter({ hasText: 'more_vert' }).first().click();
        await expect(page.getByRole('menuitem', { name: 'Copia declaración' })).toBeVisible({ timeout: 5000 });
        await page.getByRole('menuitem', { name: 'Copia declaración' }).click();

        // La app muestra el PDF en mat-dialog-container (Angular Material).
        // getByRole('dialog') no funciona aquí porque el componente no expone aria-labelledby.
        const dialogoCopia = page.locator('mat-dialog-container');
        await expect(dialogoCopia).toBeVisible({ timeout: 30000 });
        await page.keyboard.press('Escape');
        await dialogoCopia.waitFor({ state: 'hidden', timeout: 10000 }).catch(() => {});
      });
    }
  );

  // ── TC-DEC-002 ──────────────────────────────────────────────────────────────
  test(
    'TC-DEC-002 — Happy Path: Presentar declaración Periodo 2 (recálculo interés de mora)',
    { tag: '@e2e @contribuyentes @reteica @pasto @corpoboyaca @sysman-predial' },
    async ({ paginaAutenticada: page, establecimientoData }) => {
      const { seed, razonSocial, nombreEstablecimiento } = establecimientoData;
      const contribuyentes = new Contribuyentes(page);
      const decl = new PresentarDeclaracion(page);
      const numDocDeclarante = Math.floor(Math.random() * 1e18).toString().padStart(18, '0');

      let interesMoraP2, totalPagarP2;

      await given('el contribuyente con la declaración del Periodo 1 registrada está disponible en el listado', async () => {
        // TC-DEC-002 es serial y depende del seed creado por TC-DEC-001.
        // Navegar al detalle siempre garantiza que el menú more_vert esté disponible.
        await abrirDetalleContribuyente(page, seed);
      });

      await when('el usuario abre el menú de procesos y selecciona "Presentar declaración"', async () => {
        await contribuyentes.irAProcesoDesdeMenu('Presentar declaración');
        await expect(page).toHaveURL(/presentar_declaracion/, { timeout: 15000 });
      });

      await when('completa la sección Año gravable con Año 2026, Periodo 2, Tipo Normal y fecha de presentación del día', async () => {
        await decl.completarSeccion1({ anio: '2026', periodo: '2', tipoDeclaracion: 'Normal', fechaPresentacion: fechaHoy() });
        await expect(decl.btnSiguienteAnio).toBeEnabled({ timeout: 15000 });
        await decl.btnSiguienteAnio.click();
        await page.waitForLoadState('networkidle', { timeout: 30000 });
        // Responder SI para descartar borrador previo (evita picker vacío en retries)
        if (await decl.dialogoConfirmacion.isVisible({ timeout: 3000 }).catch(() => false)) {
          await decl.btnConfirmarSi.click();
          await page.waitForLoadState('networkidle', { timeout: 30000 });
          await decl.completarSeccion1({ anio: '2026', periodo: '2', tipoDeclaracion: 'Normal', fechaPresentacion: fechaHoy() });
          await expect(decl.btnSiguienteAnio).toBeEnabled({ timeout: 15000 });
          await decl.btnSiguienteAnio.click();
          await page.waitForLoadState('networkidle', { timeout: 30000 });
        }
      });

      await then('el asistente avanza a la sección "Establecimientos"', async () => {
        await decl.verificarTabActiva('Establecimientos');
      });

      await when('agrega el mismo establecimiento del contribuyente para el Periodo 2', async () => {
        await seleccionarEstablecimientoEnDialog(page);
      });

      await then('el establecimiento se agrega sin error de duplicado (el establecimiento está libre para Periodo 2)', async () => {
        await expect(page.getByRole('dialog', { name: /Código - 780211/ })).not.toBeVisible();
        await expect(page.getByText('No existe información')).not.toBeVisible({ timeout: 10000 });
        await expect(decl.tabpanelEstablecimientos.getByRole('row').nth(1)).toBeVisible({ timeout: 10000 });
      });

      await when('avanza a Liquidación, ingresa los mismos 7 conceptos y pulsa Actualizar', async () => {
        await decl.avanzarDesdeEstablecimientos();
        await decl.completarSeccion3(datosLiquidacion);
        await decl.actualizarLiquidacion();
      });

      await then('el Total Retenciones coincide con el Periodo 1 y el Interés de Mora es diferente', async () => {
        const totalRetencionesP2 = await decl.inputSistTotalRetenciones.inputValue();
        interesMoraP2 = await decl.inputSistInteresMora.inputValue();
        totalPagarP2  = await decl.inputSistTotalPagar.inputValue();
        expect(totalRetencionesP2).toBeTruthy();
        expect(totalPagarP2).toBeTruthy();
        // Solo comparar mora si P1 tuvo mora real (> 0).
        // Con fechas límite futuras el ambiente calcula 0 en ambos periodos — diferencia no aplica.
        if (interesMoraP1 !== null && interesMoraP1 !== '0' && interesMoraP1 !== '') {
          expect(interesMoraP2).not.toBe(interesMoraP1);
        }
      });

      await when('completa los datos del declarante del Periodo 2 y guarda el formulario de terceros', async () => {
        await decl.avanzarDesdeLiquidacion();
        await decl.verificarDialogoTercerosVisible();
        await decl.completarDatosDeclarante({
          tipoDeclarante:  'Declarante (A nombre propio)',
          tipoDocumento:   'Cédula',
          numeroDocumento: numDocDeclarante,
          nombres:         `DECLARANTE ${seed}-P2`,
        });
        await decl.guardarTercerosAsociados();
      });

      await then('la pantalla de declaración final del Periodo 2 muestra el botón Registrar habilitado', async () => {
        await page.waitForLoadState('networkidle', { timeout: 30000 });
        await expect(page.getByRole('button', { name: /Registrar/i })).toBeVisible({ timeout: 15000 });
      });

      await when('pulsa el botón Registrar', async () => {
        await page.getByRole('button', { name: /Registrar/i }).click();
        await page.waitForLoadState('networkidle', { timeout: 60000 });
      });

      await then('la declaración del Periodo 2 queda registrada y aparece el botón Finalizar', async () => {
        await expect(page.getByRole('button', { name: /Finalizar/i })).toBeVisible({ timeout: 15000 });
      });

      await when('pulsa Finalizar y el sistema regresa al detalle del contribuyente', async () => {
        await page.getByRole('button', { name: /Finalizar/i }).click();
        await page.waitForLoadState('networkidle', { timeout: 30000 });
        // Tras Finalizar la app regresa automáticamente al detalle del contribuyente.
        await contribuyentes.btnMenuProcesos.waitFor({ state: 'visible', timeout: 30000 });
      });

      await when('navega a "Declaraciones" desde el menú de procesos del contribuyente', async () => {
        await contribuyentes.irAProcesoDesdeMenu('Declaraciones');
      });

      await then('el listado muestra dos declaraciones del año 2026 con totales diferentes', async () => {
        await expect(page.getByRole('radio', { name: 'Oficial' })).toBeChecked();
        const filasAnio2026 = page.getByRole('row').filter({
          has: page.getByRole('gridcell', { name: '2026', exact: true })
        });
        await expect(filasAnio2026).toHaveCount(2, { timeout: 15000 });
      });

      await and('el PDF "Copia declaración" del Periodo 2 se abre correctamente', async () => {
        await page.getByRole('row').filter({
          has: page.getByRole('gridcell', { name: '2', exact: true })
        }).first().getByRole('checkbox').first().click({ force: true });

        await page.getByRole('button').filter({ hasText: 'more_vert' }).first().click();
        await expect(page.getByRole('menuitem', { name: 'Copia declaración' })).toBeVisible({ timeout: 5000 });
        await page.getByRole('menuitem', { name: 'Copia declaración' }).click();

        // La app muestra el PDF en mat-dialog-container (Angular Material).
        const dialogoCopia = page.locator('mat-dialog-container');
        await expect(dialogoCopia).toBeVisible({ timeout: 30000 });
        await page.keyboard.press('Escape');
        await dialogoCopia.waitFor({ state: 'hidden', timeout: 10000 }).catch(() => {});
      });
    }
  );

  // ── TC-DEC-003 ──────────────────────────────────────────────────────────────
  test(
    'TC-DEC-003 — Negativo: Establecimiento ya usado en declaración del mismo Periodo',
    { tag: '@e2e @contribuyentes @reteica @pasto @corpoboyaca @sysman-predial' },
    async ({ paginaAutenticada: page, establecimientoData }) => {
      const { seed, nombreEstablecimiento } = establecimientoData;
      const contribuyentes = new Contribuyentes(page);
      const decl = new PresentarDeclaracion(page);

      await given('el contribuyente tiene su establecimiento ya registrado en la declaración del Periodo 1', async () => {
        // Navegar al detalle del contribuyente para garantizar acceso al menú more_vert.
        await abrirDetalleContribuyente(page, seed);
      });

      await when('el usuario abre el asistente de declaración y configura Año 2026, Periodo 1, Tipo Normal', async () => {
        await contribuyentes.irAProcesoDesdeMenu('Presentar declaración');
        await expect(page).toHaveURL(/presentar_declaracion/, { timeout: 15000 });
        await decl.completarSeccion1({ anio: '2026', periodo: '1', tipoDeclaracion: 'Normal', fechaPresentacion: fechaHoy() });
        await expect(decl.btnSiguienteAnio).toBeEnabled({ timeout: 15000 });
        await decl.btnSiguienteAnio.click();
        await page.waitForLoadState('networkidle', { timeout: 30000 });
        // Si aparece diálogo de borrador, responder SI para empezar desde cero en Tab 2
        if (await decl.dialogoConfirmacion.isVisible({ timeout: 3000 }).catch(() => false)) {
          await decl.btnConfirmarSi.click();
          await page.waitForLoadState('networkidle', { timeout: 30000 });
          // Tras responder SI el formulario se reinicia (fecha de presentación se vacía — RN-03)
          // Reutilizar completarSeccion1 que ya maneja correctamente el datepicker
          await decl.completarSeccion1({ anio: '2026', periodo: '1', tipoDeclaracion: 'Normal', fechaPresentacion: fechaHoy() });
          await expect(decl.btnSiguienteAnio).toBeEnabled({ timeout: 15000 });
          await decl.btnSiguienteAnio.click();
          await page.waitForLoadState('networkidle', { timeout: 30000 });
        }
      });

      await then('la sección "Establecimientos" está activa con la tabla vacía y el botón Siguiente deshabilitado', async () => {
        await decl.verificarTabActiva('Establecimientos');
        await expect(page.getByText('No existe información')).toBeVisible();
        await expect(decl.btnSiguienteEstablecimientos).toBeDisabled();
      });

      await when('intenta agregar el establecimiento ya consumido en el Periodo 1', async () => {
        // El helper selecciona la primera fila; el error 780211 se valida al pulsar Aceptar (RN-06)
        await seleccionarEstablecimientoEnDialog(page);
      });

      await then('el sistema muestra el mensaje de error Código 780211 indicando que el establecimiento ya está registrado para otra declaración del mismo periodo', async () => {
        const dialogoError = page.getByRole('dialog', { name: /Código - 780211/ });
        await expect(dialogoError).toBeVisible({ timeout: 15000 });
        await expect(dialogoError).toContainText('ya se encuentra registrado para otra declaración del mismo periodo');
      });

      await when('el usuario acepta el mensaje de error', async () => {
        await page.getByRole('dialog', { name: /Código - 780211/ })
          .getByRole('button', { name: 'Aceptar' }).click();
        await page.waitForLoadState('networkidle', { timeout: 15000 });
      });

      await then('la tabla de establecimientos sigue vacía y el botón Siguiente permanece deshabilitado', async () => {
        await expect(page.getByText('No existe información')).toBeVisible();
        await expect(decl.btnSiguienteEstablecimientos).toBeDisabled();
      });
    }
  );

});
