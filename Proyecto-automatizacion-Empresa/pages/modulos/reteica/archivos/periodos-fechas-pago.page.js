export class PeriodosFechasPago {
  constructor(page) {
    this.page = page;

    // === FORMULARIO NUEVO / EDITAR REGISTRO ===

    // Vigencia (A) — obligatorio; componente app-combo con play_arrow
    this.comboVigencia = page.getByRole('combobox', { name: 'Vigencia (A)' });
    this.btnVigencia = page.locator('mat-form-field').filter({ hasText: 'Vigencia (A)' }).getByRole('button');

    // Periodo (M) — obligatorio; componente app-combo con play_arrow
    this.comboPeriodo = page.getByRole('combobox', { name: 'Periodo (M)' });
    this.btnPeriodo = page.locator('mat-form-field').filter({ hasText: 'Periodo (M)' }).getByRole('button');

    // Fecha límite — input text con formControlName="fechaLimite" + datepicker
    this.inputFechaLimite = page.getByRole('textbox', { name: 'Fecha límite' });
    this.btnCalendario = page.getByRole('button', { name: 'Open calendar' });

    // Régimen contribuyente (R) — obligatorio; componente app-combo con play_arrow
    this.comboRegimen = page.getByRole('combobox', { name: 'Régimen contribuyente (R)' });
    this.btnRegimen = page.locator('mat-form-field').filter({ hasText: 'Régimen contribuyente (R)' }).getByRole('button');

    // Tipo persona (P) — obligatorio; componente app-combo con play_arrow
    this.comboTipoPersona = page.getByRole('combobox', { name: 'Tipo persona (P)' });
    this.btnTipoPersona = page.locator('mat-form-field').filter({ hasText: 'Tipo persona (P)' }).getByRole('button');

    // Dígito de verificación (D) — spinbutton, formControlName="digito", opcional, max 1 dígito
    this.inputDigitoVerificacion = page.getByRole('spinbutton', { name: 'Dígito de verificación (D)' });

    // Últimos dígitos NIT (N) — spinbutton, formControlName="ultimosDigitos", opcional, max 5 dígitos
    this.inputUltimosDigitosNit = page.getByRole('spinbutton', { name: 'Últimos dígitos NIT (N)' });

    // === DIÁLOGO DE FILTRO "Búsqueda por:" ===

    this.dialogoBusqueda = page.getByRole('dialog', { name: 'Búsqueda por:' });

    this.filtroVigencia = page.getByRole('dialog', { name: 'Búsqueda por:' })
      .getByRole('textbox', { name: 'Vigencia (A)' });

    this.filtroPeriodo = page.getByRole('dialog', { name: 'Búsqueda por:' })
      .getByRole('textbox', { name: 'Periodo (M)' });

    this.filtroRegimen = page.getByRole('dialog', { name: 'Búsqueda por:' })
      .getByRole('textbox', { name: 'Régimen contribuyente (R)' });

    this.filtroTipoPersona = page.getByRole('dialog', { name: 'Búsqueda por:' })
      .getByRole('textbox', { name: 'Tipo persona (P)' });

    this.filtroUltimosDigitosNit = page.getByRole('dialog', { name: 'Búsqueda por:' })
      .getByRole('spinbutton', { name: 'Últimos dígitos NIT (N)' });

    // === DIÁLOGO PRINCIPAL (Nuevo Registro / Editar) ===
    this.dialogoRegistro = page.getByRole('dialog', { name: 'Nuevo Registro' });
  }

  // --- Acciones ---

  async seleccionarVigencia(valor) {
    await this.btnVigencia.click();
    await this.page.getByRole('option', { name: valor, exact: true }).click();
  }

  async seleccionarPeriodo(valor) {
    await this.btnPeriodo.click();
    await this.page.getByRole('option', { name: valor, exact: true }).click();
  }

  async seleccionarRegimen(valor) {
    await this.btnRegimen.click();
    await this.page.getByRole('option', { name: valor, exact: true }).click();
  }

  async seleccionarTipoPersona(valor) {
    await this.btnTipoPersona.click();
    await this.page.getByRole('option', { name: valor, exact: true }).click();
  }

  async completarFormulario(datos) {
    await this.seleccionarVigencia(datos.vigencia);
    await this.seleccionarPeriodo(datos.periodo);
    if (datos.fechaLimite) await this.inputFechaLimite.fill(datos.fechaLimite);
    await this.seleccionarRegimen(datos.regimen);
    await this.seleccionarTipoPersona(datos.tipoPersona);
    if (datos.digito !== undefined) await this.inputDigitoVerificacion.fill(String(datos.digito));
    if (datos.ultimosDigitos !== undefined) await this.inputUltimosDigitosNit.fill(String(datos.ultimosDigitos));
  }

  async aplicarFiltro(datos) {
    if (datos.vigencia) await this.filtroVigencia.fill(datos.vigencia);
    if (datos.periodo) await this.filtroPeriodo.fill(datos.periodo);
    if (datos.regimen) await this.filtroRegimen.fill(datos.regimen);
    if (datos.tipoPersona) await this.filtroTipoPersona.fill(datos.tipoPersona);
    if (datos.ultimosDigitos) await this.filtroUltimosDigitosNit.fill(String(datos.ultimosDigitos));
    await this.page.getByRole('dialog', { name: 'Búsqueda por:' })
      .getByRole('button', { name: 'Aceptar' }).click();
  }
}
