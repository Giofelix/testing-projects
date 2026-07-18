import { expect } from '@playwright/test';

export class Contribuyentes {
  constructor(page) {
    this.page = page;

    // --- Diálogo "Nuevo Registro" ---
    this.dialogoNuevoRegistro = page.getByRole('dialog', { name: 'Nuevo Registro' });
    this.selectorNombre = this.dialogoNuevoRegistro.getByRole('listbox', { name: 'Nombre' });
    this.mensajeCampoObligatorio = this.dialogoNuevoRegistro.locator('[role=alert]').filter({ hasText: 'Campo obligatorio' });
    this.inputMatricula = this.dialogoNuevoRegistro.getByRole('textbox', { name: 'Matrícula', exact: true });
    this.inputFechaMatricula = this.dialogoNuevoRegistro.getByRole('textbox', { name: 'Fecha matrícula' });
    this.btnAbrirCalendario = this.dialogoNuevoRegistro.getByRole('button', { name: 'Open calendar' });
    this.btnLimpiarFecha = this.dialogoNuevoRegistro.locator('mat-form-field').filter({ hasText: 'Fecha matrícula' }).getByRole('button').filter({ hasText: 'close' });

    // --- Diálogo selector de Terceros ---
    // Las pestañas muestran "DATOS" y "FILTROS" en mayúsculas en el DOM accesible.
    // Se usan locators insensibles a mayúsculas para el tabpanel.
    this.dialogoSelectorTerceros = page.getByRole('dialog').filter({ has: page.locator('mat-tab-group') });
    this.tabDatosTerceros = page.getByRole('tab', { name: /datos/i });
    this.tabFiltrosTerceros = page.getByRole('tab', { name: /filtros/i });
    this.inputFiltroNit = page.locator('mat-tab-group').getByRole('textbox', { name: /nit/i });
    this.inputFiltroNombre = page.locator('mat-tab-group').getByRole('textbox', { name: /nombre/i });
    this.btnAplicarFiltro = page.getByRole('button', { name: 'Aplicar' });
    // Las celdas de la grilla del selector de Terceros están dentro de mat-bottom-sheet-container.
    // NO usar 'div.panel mat-row' porque ese selector también matchea la tabla principal de
    // Contribuyentes (cuando el NIT ya existe como contribuyente), haciendo que .first() retorne
    // la fila equivocada y el bottom-sheet nunca se cierre.
    this.gridTercerosCeldaNit = (nit) => page.locator('mat-bottom-sheet-container mat-row').filter({
      has: page.locator('mat-cell.cdk-column-NIT', { hasText: nit })
    }).first();
    this.gridTercerosCeldaNombre = (nombre) => page.locator('mat-bottom-sheet-container mat-row').filter({
      has: page.locator('mat-cell', { hasText: nombre })
    }).first();

    // --- Diálogo "Búsqueda por:" ---
    this.dialogoBusqueda = page.getByRole('dialog', { name: 'Búsqueda por:' });
    this.inputBusquedaNit = page.getByRole('dialog', { name: 'Búsqueda por:' }).getByRole('textbox', { name: 'NIT' });
    this.inputBusquedaNombre = page.getByRole('dialog', { name: 'Búsqueda por:' }).getByRole('textbox', { name: 'Nombre' });

    // --- Página de detalle ---
    this.btnMenuProcesos = page.getByRole('button').filter({ hasText: 'more_vert' });
    this.menuProcesos = page.getByRole('menu');
    this.tabDetalleContribuyente = page.getByRole('tab').filter({ hasText: 'Contribuyente :' });
    this.inputNit = page.getByRole('textbox', { name: 'Nit del propietario' });
    this.inputNombre = page.getByRole('textbox', { name: 'Nombre' });
    this.inputMatriculaDetalle = page.getByRole('textbox', { name: 'Matricula' });
    this.inputFechaMatriculaDetalle = page.getByRole('textbox', { name: 'Fecha Matricula' });
    this.inputEstado = page.getByRole('textbox', { name: 'Estado' });
    this.inputDireccion = page.getByRole('textbox', { name: 'Dirección' });
    this.inputTelefonos = page.getByRole('textbox', { name: 'Teléfonos' });
    this.inputTipoRegimen = page.getByRole('textbox', { name: 'Tipo de régimen' });
    this.inputCiudad = page.getByRole('textbox', { name: 'Ciudad' });
    this.inputNaturaleza = page.getByRole('textbox', { name: 'Naturaleza' });
    this.inputDireccionEmail = page.getByRole('textbox', { name: 'Dirección email' });
    this.inputCodigosCiiu = page.locator('textarea[name="TxtCodigosCiiu"]');

    // --- Ítems del menú more_vert ---
    this.menuItemDeclaraciones = page.getByRole('menuitem', { name: 'Declaraciones' });
    this.menuItemActualizarOtrosImpuestos = page.getByRole('menuitem', { name: 'Actualizar otros impuestos' });
    this.menuItemEmplazamientoNoDeclara = page.getByRole('menuitem', { name: 'Emplazamiento por no declarar' });
    this.menuItemPagosParciales = page.getByRole('menuitem', { name: 'Pagos parciales' });
    this.menuItemEdicionAbonos = page.getByRole('menuitem', { name: 'Edicion de abonos' });
    this.menuItemTercerosAsociados = page.getByRole('menuitem', { name: 'Terceros asociados' });
    this.menuItemDocumentosRit = page.getByRole('menuitem', { name: 'Documentos RIT' });
    this.menuItemActivar = page.getByRole('menuitem', { name: 'Activar' });
    this.menuItemBitacoraEstado = page.getByRole('menuitem', { name: 'Bitacora estado' });
    this.menuItemFacturas = page.getByRole('menuitem', { name: 'Facturas' });
    this.menuItemEstadoCuenta = page.getByRole('menuitem', { name: 'Estado de cuenta' });
    this.menuItemGenerarRit = page.getByRole('menuitem', { name: 'Generar RIT' });
    this.menuItemGenerarRic = page.getByRole('menuitem', { name: 'Generar RIC' });
    this.menuItemHistoricoDeclaraciones = page.getByRole('menuitem', { name: 'Histórico de declaraciones' });
  }

  // --- Acciones: creación de contribuyente ---

  async completarNuevoRegistro(datos) {
    await this.selectorNombre.click();
    await this.seleccionarTerceroPorNit(datos.nitTercero);
    if (datos.matricula !== undefined) {
      await this.inputMatricula.fill(datos.matricula);
    }
    if (datos.fecha !== undefined) {
      await this.inputFechaMatricula.fill(datos.fecha);
      await this.inputFechaMatricula.press('Tab');
    }
  }

  async seleccionarTerceroPorNit(nit) {
    await this.tabFiltrosTerceros.click();
    await this.inputFiltroNit.fill(nit);
    await this.btnAplicarFiltro.click();
    await this.tabDatosTerceros.click();
    const celdaNit = this.gridTercerosCeldaNit(nit);
    await celdaNit.waitFor({ state: 'visible', timeout: 15000 });
    // El mat-tab-label intercepta pointer events sobre el grid recién activado.
    // Se usa force:true para bypassear el interception de Angular Material.
    await celdaNit.click({ force: true });
    // Tras hacer click en la fila, el mat-bottom-sheet se cierra pero el overlay
    // cdk-global-overlay-wrapper retiene pointer-events bloqueando el diálogo padre.
    // Se espera que mat-bottom-sheet-container desaparezca del DOM.
    await this.page.locator('mat-bottom-sheet-container').waitFor({ state: 'detached', timeout: 15000 }).catch(() => {});
  }

  async seleccionarTerceroPorNombre(nombre) {
    await this.tabFiltrosTerceros.click();
    await this.inputFiltroNombre.fill(nombre);
    await this.btnAplicarFiltro.click();
    await this.tabDatosTerceros.click();
    const celdaNombre = this.gridTercerosCeldaNombre(nombre);
    await celdaNombre.waitFor({ state: 'visible', timeout: 15000 });
    await celdaNombre.click({ force: true });
    await this.page.locator('mat-bottom-sheet-container').waitFor({ state: 'detached', timeout: 15000 }).catch(() => {});
  }

  // --- Acciones: diálogo Nuevo Registro ---

  // El cdk-global-overlay-wrapper con panelAcciones puede permanecer como overlay
  // bloqueante después de cerrar el selector de Terceros (mat-bottom-sheet). Se usa
  // force:true para garantizar el click en el botón Aceptar del diálogo padre.
  async aceptarNuevoRegistro() {
    await this.dialogoNuevoRegistro.getByRole('button', { name: 'Aceptar' }).click({ force: true });
  }

  async cancelarNuevoRegistro() {
    // Si el mat-bottom-sheet-container sigue abierto (selector de Terceros sin selección),
    // cerrarlo con Escape antes de cancelar el diálogo Nuevo Registro.
    const bottomSheet = this.page.locator('mat-bottom-sheet-container');
    const bottomSheetVisible = await bottomSheet.isVisible({ timeout: 500 }).catch(() => false);
    if (bottomSheetVisible) await this.page.keyboard.press('Escape');
    await bottomSheet.waitFor({ state: 'detached', timeout: 5000 }).catch(() => {});
    await this.dialogoNuevoRegistro.getByRole('button', { name: 'Cancelar' }).click({ force: true });
  }

  // --- Acciones: filtrado de la lista principal ---

  async completarFiltros(filtros) {
    if (filtros.nit) await this.inputBusquedaNit.fill(filtros.nit);
    if (filtros.nombre) await this.inputBusquedaNombre.fill(filtros.nombre);
    await this.page.getByRole('button', { name: 'Aceptar' }).click();
    await this.page.waitForLoadState('networkidle', { timeout: 30000 });
  }

  // --- Acciones: página de detalle ---

  async abrirMenuProcesos() {
    await this.btnMenuProcesos.click();
    await this.menuProcesos.waitFor({ state: 'visible', timeout: 10000 });
  }

  async irAProcesoDesdeMenu(nombreOpcion) {
    await this.abrirMenuProcesos();
    await this.page.getByRole('menuitem', { name: nombreOpcion, exact: true }).click();
    await this.page.waitForLoadState('networkidle', { timeout: 30000 });
  }

  // --- Verificaciones ---

  async verificarContribuyenteEnTabla(nit) {
    // La tabla de Contribuyentes tiene paginación; filtrar por NIT antes de verificar la fila.
    const filaEnPagina = this.page.getByRole('gridcell', { name: nit, exact: true }).first();
    const yaVisible = await filaEnPagina.isVisible({ timeout: 3000 }).catch(() => false);
    if (!yaVisible) {
      // Filtrar por NIT para encontrar el registro
      await this.page.locator('mat-icon:has-text("filter_list")').click();
      // El diálogo de búsqueda se llama "Búsqueda por:"
      const dialogoBusqueda = this.page.getByRole('dialog', { name: 'Búsqueda por:' });
      await dialogoBusqueda.waitFor({ state: 'visible', timeout: 10000 });
      await dialogoBusqueda.getByRole('textbox', { name: 'NIT' }).fill(nit);
      await dialogoBusqueda.getByRole('button', { name: 'Aceptar' }).click();
      await this.page.getByRole('dialog').waitFor({ state: 'hidden', timeout: 15000 });
    }
    await expect(
      this.page.getByRole('gridcell', { name: nit, exact: true }).first()
    ).toBeVisible({ timeout: 15000 });
  }

  async verificarDatosDetalle(datos) {
    if (datos.nit !== undefined) await expect(this.inputNit).toHaveValue(datos.nit);
    if (datos.nombre !== undefined) await expect(this.inputNombre).toHaveValue(datos.nombre);
    if (datos.estado !== undefined) await expect(this.inputEstado).toHaveValue(datos.estado);
    if (datos.direccion !== undefined) await expect(this.inputDireccion).toHaveValue(datos.direccion);
    if (datos.telefonos !== undefined) await expect(this.inputTelefonos).toHaveValue(datos.telefonos);
  }

  async verificarNombreEnTab(nombre) {
    await expect(
      this.page.getByRole('tab', { name: `Contribuyente : ${nombre}` })
    ).toBeVisible({ timeout: 10000 });
  }
}
