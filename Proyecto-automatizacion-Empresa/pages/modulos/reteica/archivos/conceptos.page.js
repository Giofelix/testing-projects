export class Conceptos {
  constructor(page) {
    this.page = page;

    // --- Listado ---
    this.tituloConceptos = page.getByRole('heading', { name: 'Conceptos', exact: true });
    this.mensajeValidacion = page.locator('[role=alert]', { hasText: 'Campo obligatorio' });

    // --- Formulario Concepto (diálogo Nuevo Registro / Editar) ---
    this.inputCodigoConcepto = page.getByRole('spinbutton', { name: 'Codigo concepto' });

    this.comboClaseConcepto = page.getByRole('combobox', { name: 'Clase concepto' });
    this.btnClaseConcepto = page.locator('mat-form-field').filter({ hasText: 'Clase concepto' }).getByRole('button');

    this.inputNombreConcepto = page.getByRole('textbox', { name: 'Nombre' });

    // mat-select: todos exponen role=listbox con su label ARIA en el diálogo
    this.selectSuma = page.getByRole('listbox', { name: 'Suma' });
    this.selectRecalcular = page.getByRole('listbox', { name: 'Recalcular concepto en declaración de interes' });
    this.selectManualActividad = page.getByRole('listbox', { name: 'Manual por actividad' });
    this.selectVisible = page.getByRole('listbox', { name: 'Visible' });
    this.selectBloqueado = page.getByRole('listbox', { name: 'Bloqueado' });

    this.inputPosicionExcel = page.getByRole('spinbutton', { name: 'Posición en plantilla excel' });

    // --- Detalle ("Deatalle concepto" — typo real del sistema) ---
    this.tituloDeatalle = page.getByRole('heading', { name: 'Deatalle concepto', exact: true });

    // --- Formulario Detalle ---
    this.comboAnio = page.getByRole('combobox', { name: 'Año' });
    this.btnAnio = page.locator('mat-form-field').filter({ hasText: 'Año' }).getByRole('button');

    this.inputOrdenCalculo = page.getByRole('spinbutton', { name: 'Orden cálculo' });
    this.inputValorMinimo = page.getByRole('textbox', { name: 'Valor minimo' });
    this.selectPasarAprivada = page.getByRole('listbox', { name: 'Pasar a privada' });
  }

  // --- Acciones ---

  async seleccionarOpcionSelect(selectLocator, valorOpcion) {
    await selectLocator.click();
    await this.page.waitForSelector('[role=option]', { state: 'visible' });
    // .first() evita strict-mode violation cuando Angular deja overlays previos en el DOM
    await this.page.getByRole('option', { name: valorOpcion, exact: true }).first().click();
  }

  async seleccionarOpcionDropdown(btnLocator, valorOpcion) {
    await btnLocator.click();
    await this.page.waitForSelector('[role=option]', { state: 'visible' });
    await this.page.getByRole('option', { name: valorOpcion, exact: true }).first().click();
  }

  async llenarFormularioConcepto(datos) {
    await this.inputCodigoConcepto.fill(datos.codigo);
    await this.seleccionarOpcionDropdown(this.btnClaseConcepto, datos.clase);
    await this.inputNombreConcepto.fill(datos.nombre);
    await this.seleccionarOpcionSelect(this.selectSuma, datos.suma);
    await this.seleccionarOpcionSelect(this.selectRecalcular, datos.recalcular);
    await this.seleccionarOpcionSelect(this.selectManualActividad, datos.manualActividad);
    await this.seleccionarOpcionSelect(this.selectVisible, datos.visible);
    await this.seleccionarOpcionSelect(this.selectBloqueado, datos.bloqueado);
    await this.inputPosicionExcel.fill(datos.posicionExcel);
  }

  async llenarFormularioDetalle(datos) {
    await this.seleccionarOpcionDropdown(this.btnAnio, datos.anio);
    await this.inputOrdenCalculo.fill(datos.ordenCalculo);
    await this.inputValorMinimo.fill(datos.valorMinimo);
    await this.seleccionarOpcionSelect(this.selectPasarAprivada, datos.pasarAprivada);
  }

  async verificarEnListado() {
    await this.page.waitForURL(/conceptos_anio(?!\/detalle)/, { timeout: 15000 });
    await this.tituloConceptos.waitFor({ state: 'visible', timeout: 10000 });
  }

  async verificarEnDetalle() {
    await this.page.waitForURL(/conceptos_anio\/detalle/, { timeout: 15000 });
    await this.tituloDeatalle.waitFor({ state: 'visible', timeout: 10000 });
  }

  async verificarMensajeValidacion() {
    await this.mensajeValidacion.first().waitFor({ state: 'visible', timeout: 10000 });
  }
}
