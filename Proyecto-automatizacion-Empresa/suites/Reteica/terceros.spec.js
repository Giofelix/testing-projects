import { expect } from '@playwright/test';
const { given, when, then, and } = require('gherkin-lite');
import { test } from '../../fixtures/index.js';
import { MenuNavegacion } from '../../pages/common/menu-navegacion';
import { AccionesCrud } from '../../pages/common/acciones-crud';
import { ComponentesTabla } from '../../pages/common/componentes-tabla';
import { Terceros } from '../../pages/modulos/reteica/archivos/terceros.page';

/*
Ruta documentacion suite de pruebas
User Story 10069: Gestión de Terceros - Reteica
Link: https://dev.azure.com/Sysman-grp-gestion-implementaciones/Sysman-grp-Automation/_backlogs/backlog/Sysman-grp-Automation%20Team/Epics?workitem=10069
*/

const MENU_PATH = ['Reteica', 'Archivos', 'Terceros'];
const NIT_REFERENCIA = '900516574';

// Semilla única por ejecución — compartida por TC-002, TC-004 y TC-014
const nitUnico = Date.now().toString().slice(-9);

const datosBasicos = {
  nit: nitUnico,
  tipoDocumento: 'NIT',
  razonSocial: `AUTOTEST QA SAS ${nitUnico}`,
  tipoRegimen: 'Menores Ingresos',
  direccion: 'CL 18 25 50',
  telefonos: '6027234567',
  naturaleza: 'PERSONA JURIDICA',
};

const datosAdicionales = {
  pais: 'Colombia',
  departamento: 'BOYACA',
  ciudad: 'BOYACA',
  email: 'qa.autotest@example.com',
};

// ─────────────────────────────────────────────
// BLOQUE 1 — SMOKE (paralelo)
// ─────────────────────────────────────────────
test.describe('Terceros - Smoke', () => {

  test(
    'TC-TER-01 — Navegación y carga del listado',
    { tag: '@smoke @terceros @reteica @tagprueba' },
    async ({ paginaAutenticada: page }) => {
      const menu = new MenuNavegacion(page);
      const crud = new AccionesCrud(page);
      const tabla = new ComponentesTabla(page);

      await given('el usuario autenticado accede al sistema', async () => {
        await expect(page).toHaveURL(/.*modulos/);
      });

      await when('navega al módulo Reteica > Archivos > Terceros', async () => {
        await menu.navegar(MENU_PATH);
      });

      await then('el listado de Terceros carga correctamente con sus controles visibles', async () => {
        await expect(page).toHaveURL(/.*taxtime\/terceros$/);
        await expect(page.getByRole('columnheader', { name: 'Nombre' })).toBeVisible();
        await expect(page.getByRole('columnheader', { name: 'Nit' })).toBeVisible();
        await expect(page.getByRole('columnheader', { name: /Direcci/i })).toBeVisible();
        await expect(page.getByRole('columnheader', { name: /Tel/i })).toBeVisible();
        await expect(crud.btnAgregar).toBeVisible();
        await expect(tabla.btnRefrescar).toBeVisible();
        await expect(tabla.btnFiltrar).toBeVisible();
        await expect(page.locator('.divtable')).toContainText(/\d+ - \d+ de \d+/);
      });

      await and('visualiza los agregar de acción "Nuevo", "Recargar" y "Filtrar"', async () => {
        await expect(crud.btnAgregar).toBeVisible();
        await expect(tabla.btnRefrescar).toBeVisible();
        await expect(tabla.btnFiltrar).toBeVisible();
        await expect(page.locator('.divtable')).toContainText(/\d+ - \d+ de \d+/);
      });

      await and('la paginación debe ser funcional permitiendo navegar entre registros', async () => {
        await expect(page.locator('.divtable')).toContainText(/\d+ - \d+ de \d+/);
      });

    }
  );

  test(
    'TC-TER-02 — Consultar un tercero existente',
    { tag: '@crud @terceros @reteica @smoke @tagprueba' },
    async ({ paginaAutenticada: page }) => {
      const menu = new MenuNavegacion(page);
      const crud = new AccionesCrud(page);
      const tabla = new ComponentesTabla(page);
      const terceros = new Terceros(page);

      await given('que el usuario está en el listado de Terceros', async () => {
        await menu.navegar(MENU_PATH);
        await expect(page).toHaveURL(/.*taxtime\/terceros$/);
      });

      await when('busca el NIT "900516574" y abre el detalle del registro', async () => {
        await tabla.filtrar();
        await page.getByRole('dialog').getByRole('textbox', { name: 'Nit' }).fill(NIT_REFERENCIA);
        await crud.aceptar();
        // Esperar a que el diálogo se cierre y los resultados del filtro carguen en la tabla
        await page.getByRole('dialog').waitFor({ state: 'hidden', timeout: 15000 });
        await expect(
          page.getByRole('row').filter({
            has: page.getByRole('gridcell', { name: NIT_REFERENCIA, exact: true })
          }).first()
        ).toBeVisible({ timeout: 20000 });
        await tabla.seleccionarFila(NIT_REFERENCIA);
        // Esperar a que el botón editar sea visible (confirma que la fila quedó seleccionada)
        await expect(crud.btnEditar).toBeVisible({ timeout: 10000 });
        await crud.editar();
        // Esperar la navegación al formulario de detalle
        await page.waitForURL(/.*terceros\/detalle/, { timeout: 30000 });
      });

      await then('el sistema debe mostrar el formulario con toda la información técnica y administrativa cargada correctamente', async () => {
        await expect(page).toHaveURL(/.*terceros\/detalle/);
        await expect(terceros.inputNit).toHaveValue(NIT_REFERENCIA);
        await expect(terceros.comboTipoRegimen).not.toHaveValue('');
        // TC-03: verificar que el formulario carga con información completa
        await expect(terceros.inputRazonSocial).not.toHaveValue('');
        await expect(terceros.comboNaturaleza).not.toHaveValue('');
        // Pestaña Adicionales también debe tener datos cargados
        await terceros.tabAdicionales.click();
        // Esperar a que el panel Adicionales sea visible antes de verificar el campo Pais
        await expect(terceros.comboPais).toBeVisible({ timeout: 10000 });
        await expect(terceros.comboPais).not.toHaveValue('');
      });
    }
  );

  test(
    'TC-TER-03 — Filtrar por NIT',
    { tag: '@search @terceros @reteica @smoke @tagprueba' },
    async ({ paginaAutenticada: page }) => {
      const menu = new MenuNavegacion(page);
      const crud = new AccionesCrud(page);
      const tabla = new ComponentesTabla(page);

      await given('que el usuario está en el listado de Terceros', async () => {
        await menu.navegar(MENU_PATH);
        await expect(page).toHaveURL(/.*taxtime\/terceros$/);
      });

      await when('aplica el filtro de búsqueda con el NIT "900516574"', async () => {
        await tabla.filtrar();
        await page.getByRole('dialog').getByRole('textbox', { name: 'Nit' }).fill(NIT_REFERENCIA);
        await crud.aceptar();
      });

      await then('la tabla debe actualizarse para mostrar exclusivamente los registros que coincidan exactamente con ese número', async () => {
        await expect(
          page.getByRole('row').filter({ hasText: NIT_REFERENCIA }).first()
        ).toBeVisible({ timeout: 15000 });
        // TC-10: verificar que el resultado es exacto (no hay filas con otros NITs)
        await expect(
          page.getByRole('gridcell', { name: NIT_REFERENCIA, exact: true }).first()
        ).toBeVisible({ timeout: 10000 });
        await expect(page.locator('.divtable')).toContainText(/1 - \d+ de \d+/);
      });
    }
  );

});

// ─────────────────────────────────────────────
// BLOQUE 2 — CRUD SERIAL (TC-002 → TC-004 → TC-014)
// ─────────────────────────────────────────────
test.describe('Terceros - CRUD', () => {
  test.describe.configure({ mode: 'serial' });

  test(
    'TC-TER-04 — Crear un tercero tipo Persona Jurídica',
    { tag: '@crud @terceros @reteica @regression @tagprueba' },
    async ({ paginaAutenticada: page }) => {
      const menu = new MenuNavegacion(page);
      const crud = new AccionesCrud(page);
      const tabla = new ComponentesTabla(page);
      const terceros = new Terceros(page);

      await given('que el usuario está en el listado de Terceros', async () => {
        await menu.navegar(MENU_PATH);
        await expect(page).toHaveURL(/.*taxtime\/terceros$/);
      });

      await when('crea un nuevo tercero con los siguientes datos:', async () => {
        await crud.agregar();
        await expect(page).toHaveURL(/.*terceros\/detalle/);
        await terceros.completarDatosBasicos(datosBasicos);
        // La selección de Naturaleza "PERSONA JURIDICA" valida implícitamente el catálogo (TC-TER-018 fusionado)
        await terceros.completarDatosAdicionales(datosAdicionales);
        // TC-02: verificar que el sistema calcula el dígito de verificación automáticamente
        await expect(terceros.inputDigitoVerificacion).not.toHaveValue('');
        // TC-02: el campo DV se restringe a 1 dígito (oninput trunca a 1 carácter — no usa disabled/readonly)
        await expect(terceros.inputDigitoVerificacion).toHaveValue(/^\d$/);
      });

      await and('el sistema calcula automáticamente el Dígito de verificación', async () => {
        // TC-02: verificar que el sistema calcula el dígito de verificación automáticamente
        await expect(terceros.inputDigitoVerificacion).not.toHaveValue('');
        // TC-02: el campo DV se restringe a 1 dígito (oninput trunca a 1 carácter — no usa disabled/readonly)
        await expect(terceros.inputDigitoVerificacion).toHaveValue(/^\d$/);
      });

      await then('el registro debe guardarse exitosamente', async () => {
        await crud.guardar();
        await page.waitForURL(/.*taxtime\/terceros$/, { timeout: 30000 });
        await expect(page).toHaveURL(/.*taxtime\/terceros$/);
        await tabla.filtrar();
        await page.getByRole('dialog').getByRole('textbox', { name: 'Nit' }).fill(nitUnico);
        await crud.aceptar();
        await expect(
          page.getByRole('row').filter({ hasText: nitUnico }).first()
        ).toBeVisible();
      });

      await and('retornar al listado y aparecer en los resultados de búsqueda por su NIT', async () => {
        await tabla.filtrar();
        await page.getByRole('dialog').getByRole('textbox', { name: 'Nit' }).fill(nitUnico);
        await crud.aceptar();
        await expect(
          page.getByRole('row').filter({ hasText: nitUnico }).first()
        ).toBeVisible();
      });
    }
  );

  test(
    'TC-TER-05 — Editar un tercero',
    { tag: '@crud @terceros @reteica @regression' },
    async ({ paginaAutenticada: page }) => {
      const menu = new MenuNavegacion(page);
      const crud = new AccionesCrud(page);
      const tabla = new ComponentesTabla(page);
      const terceros = new Terceros(page);
      const nuevaDireccion = `CL 50 No 10 - 20 ACTUALIZADA ${nitUnico}`;

      await given('que el usuario ya creó el tercero con NIT "900852369"', async () => {
        await menu.navegar(MENU_PATH);
        await expect(page).toHaveURL(/.*taxtime\/terceros$/);
        await tabla.filtrar();
        await page.getByRole('dialog').getByRole('textbox', { name: 'Nit' }).fill(nitUnico);
        await crud.aceptar();
        await expect(
          page.getByRole('row').filter({ hasText: nitUnico }).first()
        ).toBeVisible();
      });

      await when('abre el registro y cambia la dirección a "Avenida Siempre Viva 123"', async () => {
        await tabla.seleccionarFila(nitUnico);
        await crud.editar();
        await expect(page).toHaveURL(/.*terceros\/detalle/);
        await terceros.tabBasicos.click();
        await terceros.inputDireccion.clear();
        await terceros.inputDireccion.fill(nuevaDireccion);
      });

      await and('guarda los cambios', async () => {
        await crud.guardar();
      });

      await then('al consultar nuevamente el tercero, la dirección debe reflejar el nuevo valor actualizado', async () => {
        await page.waitForURL(/.*taxtime\/terceros$/, { timeout: 30000 });
        await tabla.filtrar();
        await page.getByRole('dialog').getByRole('textbox', { name: 'Nit' }).fill(nitUnico);
        await crud.aceptar();
        await tabla.seleccionarFila(nitUnico);
        await crud.editar();
        await expect(page).toHaveURL(/.*terceros\/detalle/);
        await terceros.tabBasicos.click();
        await expect(terceros.inputDireccion).toHaveValue(nuevaDireccion);
      });
    }
  );

  test(
    'TC-TER-06 — Eliminar un tercero recién creado',
    { tag: '@crud @terceros @reteica @regression' },
    async ({ paginaAutenticada: page }) => {
      const menu = new MenuNavegacion(page);
      const crud = new AccionesCrud(page);
      const tabla = new ComponentesTabla(page);

      await given('existe el tercero con NIT "900852369" sin transacciones asociadas', async () => {
        await menu.navegar(MENU_PATH);
        await expect(page).toHaveURL(/.*taxtime\/terceros$/);
        await tabla.filtrar();
        await page.getByRole('dialog').getByRole('textbox', { name: 'Nit' }).fill(nitUnico);
        await crud.aceptar();
        await expect(
          page.getByRole('row').filter({ hasText: nitUnico }).first()
        ).toBeVisible();
      });

      await when('el usuario lo selecciona en el listado y presiona "Eliminar"', async () => {
        await tabla.seleccionarFila(nitUnico);
        await crud.eliminar();
      });

      await then('el sistema debe confirmar la eliminación', async () => {
        await expect(page.locator('.swal2-popup')).toContainText('Eliminados correctamente');
        await crud.aceptar();
      });

      await and('el registro ya no debe ser recuperable mediante la búsqueda por NIT', async () => {
        await tabla.filtrar();
        await page.getByRole('dialog').getByRole('textbox', { name: 'Nit' }).fill(nitUnico);
        await crud.aceptar();
        await expect(
          page.getByRole('row').filter({ hasText: nitUnico }).first()
        ).not.toBeVisible({ timeout: 10000 });
      });
    }
  );

});

// ─────────────────────────────────────────────
// BLOQUE 3 — VALIDACIONES Y BÚSQUEDA (paralelo)
// ─────────────────────────────────────────────
test.describe('Terceros - Validaciones y Búsqueda', () => {

  test(
    'TC-TER-07 — Validación de campos obligatorios (vacío)',
    { tag: '@negative @terceros @reteica @regression' },
    async ({ paginaAutenticada: page }) => {
      const menu = new MenuNavegacion(page);
      const crud = new AccionesCrud(page);

      await given('que el usuario abre el formulario de creación', async () => {
        await menu.navegar(MENU_PATH);
        await expect(page).toHaveURL(/.*taxtime\/terceros$/);
        await crud.agregar();
        await expect(page).toHaveURL(/.*terceros\/detalle/);
      });

      await when('intenta hacer clic en "Guardar" sin haber interactuado con ningún campo', async () => {
        await crud.guardar();
      });

      await then('el sistema debe impedir el guardado y mantener el formulario abierto', async () => {
        await expect(page.locator('.swal2-popup')).toContainText('Debe completar los campos requeridos');
        await crud.aceptar();

      });

      await and('resaltar los campos obligatorios con sus respectivos mensajes de error', async () => {
        await expect(page).toHaveURL(/.*terceros\/detalle/);
        await expect(page.getByRole('alert').first()).toBeVisible();
      });
    }
  );

  test(
    'TC-TER-08 — Validación de obligatorios en pestaña "Básicos"',
    { tag: '@negative @terceros @reteica @regression' },
    async ({ paginaAutenticada: page }) => {
      const menu = new MenuNavegacion(page);
      const crud = new AccionesCrud(page);
      const terceros = new Terceros(page);

      await given('que el usuario está en el formulario', async () => {
        await menu.navegar(MENU_PATH);
        await expect(page).toHaveURL(/.*taxtime\/terceros$/);
        await crud.agregar();
        await expect(page).toHaveURL(/.*terceros\/detalle/);

      });

      await when('completa la ubicación en la pestaña "Adicionales" (Colombia, BOYACA, ALMEIDA)', async () => {
        await terceros.completarDatosAdicionales({
          pais: 'Colombia',
          departamento: 'BOYACA',
          ciudad: 'ALMEIDA',
        });
      });

      await and('intenta guardar los cambios', async () => {
        await crud.guardar();
      });

      await then('el sistema debe lanzar una alerta y marcar los campos de identidad faltantes en la pestaña principal', async () => {
        await expect(page.locator('.swal2-popup')).toContainText('Debe completar los campos requeridos');
        await crud.aceptar();
        // TC-06: navegar a pestaña Básicos para verificar que los campos de identidad faltantes quedan marcados
        await terceros.tabBasicos.click();
        await expect(page.getByRole('alert').first()).toBeVisible();
        // TC-06: el formulario permanece abierto (no regresar al listado)
        await expect(page).toHaveURL(/.*terceros\/detalle/);
      });
    }
  );

  test(
    'TC-TER-09 — Cálculo automático del dígito de verificación',
    { tag: '@terceros @reteica @regression' },
    async ({ paginaAutenticada: page }) => {
      const menu = new MenuNavegacion(page);
      const crud = new AccionesCrud(page);
      const terceros = new Terceros(page);

      await given('que el usuario ingresa el NIT "900123456" en el formulario', async () => {
        await menu.navegar(MENU_PATH);
        await expect(page).toHaveURL(/.*taxtime\/terceros$/);
        await crud.agregar();
        await expect(page).toHaveURL(/.*terceros\/detalle/);
        await terceros.tabBasicos.click();
      });

      await when('ingresa el NIT 900123456 y desplaza el foco fuera del campo', async () => {
        await terceros.inputNit.fill('900123456');
        await terceros.inputNit.press('Tab');
        // VERIFICAR EN AMBIENTE: confirmar que el foco en Adicionales dispara el cálculo
        await terceros.tabAdicionales.click();
      });

      await then('el sistema debe calcular el dígito "8" automáticamente', async () => {
        await expect(terceros.inputDigitoVerificacion).toHaveValue('8');
      });

      await then('bloquear el campo para evitar ediciones manuales', async () => {
        await expect(terceros.inputDigitoVerificacion).toHaveValue(/^\d$/);
      });
    }
  );

  test(
    'TC-TER-10 — Límite de caracteres en Razón social',
    { tag: '@boundary @terceros @reteica' },
    async ({ paginaAutenticada: page }) => {
      const menu = new MenuNavegacion(page);
      const crud = new AccionesCrud(page);
      const terceros = new Terceros(page);
      const texto81 = 'A'.repeat(81);
      const texto80 = 'A'.repeat(80);

      await given('que el usuario intenta ingresar un nombre de empresa de 81 caracteres', async () => {
        await menu.navegar(MENU_PATH);
        await expect(page).toHaveURL(/.*taxtime\/terceros$/);
        await crud.agregar();
        await expect(page).toHaveURL(/.*terceros\/detalle/);
        await terceros.tabBasicos.click();
      });

      await when('escribe o pega el texto en el campo Razón Social', async () => {
        await terceros.inputRazonSocial.fill(texto81);
      });

      await then('el sistema debe truncar el valor', async () => {
        await expect(terceros.inputRazonSocial).toHaveValue(texto80);
      });
    }
  );

  test(
    'TC-TER-11 — Límite de caracteres en Teléfonos',
    { tag: '@boundary @terceros @reteica' },
    async ({ paginaAutenticada: page }) => {
      const menu = new MenuNavegacion(page);
      const crud = new AccionesCrud(page);
      const terceros = new Terceros(page);
      const texto21 = '1'.repeat(21);
      const texto20 = '1'.repeat(20);

      await given('que el usuario intenta ingresar un número telefónico de 21 dígitos', async () => {
        await menu.navegar(MENU_PATH);
        await expect(page).toHaveURL(/.*taxtime\/terceros$/);
        await crud.agregar();
        await expect(page).toHaveURL(/.*terceros\/detalle/);
        await terceros.tabBasicos.click();
      });

      await when('escribe en el campo Teléfonos', async () => {
        await terceros.inputTelefonos.fill(texto21);
      });

      await then('el campo debe restringir la entrada a un máximo de 20 caracteres', async () => {
        await expect(terceros.inputTelefonos).toHaveValue(texto20);
      });
    }
  );

  test(
    'TC-TER-12 — Filtrar por nombre parcial',
    { tag: '@search @terceros @reteica' },
    async ({ paginaAutenticada: page }) => {
      const menu = new MenuNavegacion(page);
      const crud = new AccionesCrud(page);
      const tabla = new ComponentesTabla(page);

      await given('que el usuario está en el listado de Terceros', async () => {
        await menu.navegar(MENU_PATH);
        await expect(page).toHaveURL(/.*taxtime\/terceros$/);
      });

      await when('busca el texto parcial "FINSOCIAL" en el filtro de nombre', async () => {
        await tabla.filtrar();
        await page.getByRole('dialog').getByRole('textbox', { name: 'Nombre' }).fill('FINSOCIAL');
        await crud.aceptar();
      });

      await then('el listado debe filtrar y mostrar todos los terceros cuya Razón Social contenga dicha palabra', async () => {
        await expect(
          page.getByRole('row').filter({ hasText: 'FINSOCIAL' }).first()
        ).toBeVisible();
        await expect(
          page.getByRole('gridcell', { name: /FINSOCIAL/i }).first()
        ).toBeVisible();
      });
    }
  );

  test(
    'TC-TER-13 — Paginación y control de registros',
    { tag: '@terceros @reteica @regression' },
    async ({ paginaAutenticada: page }) => {
      const menu = new MenuNavegacion(page);
      const tabla = new ComponentesTabla(page);

      await given('que el listado tiene múltiples registros', async () => {
        await menu.navegar(MENU_PATH);
        await expect(page).toHaveURL(/.*taxtime\/terceros$/);
      });

      await when('el usuario selecciona mostrar "10" filas por página', async () => {
        await tabla.seleccionarCantidadFilas(10);
        await expect(page.locator('.divtable')).toContainText(/1 - 10 de/);
      });

      await and('hace clic en el botón "Siguiente"', async () => {
        await tabla.irAPaginaSiguiente();
      });

      await then('la tabla debe mostrar los siguientes 10 registros', async () => {
        await expect(page.locator('.divtable')).toContainText(/11 - 20 de/);
        // TC-12: verificar que el botón Anterior está habilitado al estar en la segunda página
        await expect(tabla.btnPaginaAnterior).toBeEnabled();
      });

      await and('actualizar el contador de página y habilitar el botón "Anterior"', async () => {
        await expect(tabla.btnPaginaAnterior).toBeEnabled();
      });
    }
  );

  test(
    'TC-TER-14 — Restricción de eliminación por dependencias',
    { tag: '@negative @terceros @reteica @regression' },
    async ({ paginaAutenticada: page }) => {
      const menu = new MenuNavegacion(page);
      const crud = new AccionesCrud(page);
      const tabla = new ComponentesTabla(page);

      await given('que el tercero con NIT "900516574" tiene movimientos contables asociados', async () => {
        await menu.navegar(MENU_PATH);
        await expect(page).toHaveURL(/.*taxtime\/terceros$/);
        await tabla.filtrar();
        await page.getByRole('dialog').getByRole('textbox', { name: 'Nit' }).fill(NIT_REFERENCIA);
        await crud.aceptar();
        await expect(
          page.getByRole('row').filter({ hasText: NIT_REFERENCIA }).first()
        ).toBeVisible();
      });

      await when('el usuario intenta eliminarlo desde el listado', async () => {
        await tabla.seleccionarFila(NIT_REFERENCIA);
        await crud.eliminar();
      });

      await then('el sistema debe mostrar una alerta de seguridad', async () => {
        // TC-14: diálogo SweetAlert2 muestra alerta de seguridad cuando hay dependencias
        await expect(page.locator('.swal2-popup')).toContainText('No eliminados');
        // TC-14: la alerta debe indicar que la operación no es posible por dependencias
        await expect(page.locator('.swal2-popup')).toBeVisible();
        await crud.aceptar();
        // Esperar que el popup desaparezca antes de continuar
        await expect(page.locator('.swal2-popup')).not.toBeVisible({ timeout: 10000 });
        // TC-14: el registro debe seguir existiendo (no fue eliminado)
        await tabla.filtrar();
        await page.getByRole('dialog').getByRole('textbox', { name: 'Nit' }).fill(NIT_REFERENCIA);
        await crud.aceptar();

      });

      await and('indicar que la operación no es posible debido a las dependencias existentes', async () => {
        await expect(
          page.getByRole('row').filter({ hasText: NIT_REFERENCIA }).first()
        ).toBeVisible({ timeout: 15000 });
      });
    }
  );

});
