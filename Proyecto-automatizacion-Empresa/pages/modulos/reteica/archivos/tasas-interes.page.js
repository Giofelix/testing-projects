// pages/modulos/reteica/archivos/tasas-interes.page.js

export class TasasInteresPage {
  constructor(page) {
    this.page = page;

    // === FORMULARIO NUEVO / EDITAR REGISTRO ===
    this.dialogoNuevoRegistro = page.getByRole('dialog', { name: 'Nuevo Registro' });

    this.inputFechaInicial = page.getByRole('dialog', { name: 'Nuevo Registro' })
      .getByRole('textbox', { name: 'Fecha inicial' });
    this.btnCalendarioFechaInicial = page.getByRole('dialog', { name: 'Nuevo Registro' })
      .locator('mat-form-field').filter({ hasText: 'Fecha inicial' })
      .getByRole('button', { name: 'Open calendar' });
    this.btnLimpiarFechaInicial = page.getByRole('dialog', { name: 'Nuevo Registro' })
      .locator('mat-form-field').filter({ hasText: 'Fecha inicial' })
      .locator('button').filter({ hasText: 'close' });

    this.inputFechaFinal = page.getByRole('dialog', { name: 'Nuevo Registro' })
      .getByRole('textbox', { name: 'Fecha final' });
    this.btnCalendarioFechaFinal = page.getByRole('dialog', { name: 'Nuevo Registro' })
      .locator('mat-form-field').filter({ hasText: 'Fecha final' })
      .getByRole('button', { name: 'Open calendar' });
    this.btnLimpiarFechaFinal = page.getByRole('dialog', { name: 'Nuevo Registro' })
      .locator('mat-form-field').filter({ hasText: 'Fecha final' })
      .locator('button').filter({ hasText: 'close' });

    this.inputTasaAnual = page.getByRole('dialog', { name: 'Nuevo Registro' })
      .getByRole('textbox', { name: 'Tasa anual' });
  }

  // --- Acciones del formulario ---

  async completarFormulario(datos) {
    if (datos.fechaInicial) await this.inputFechaInicial.fill(datos.fechaInicial);
    if (datos.fechaFinal) await this.inputFechaFinal.fill(datos.fechaFinal);
    if (datos.tasaAnual) await this.inputTasaAnual.fill(datos.tasaAnual);
  }
}
