// pages/components/TopbarComponent.js
import { expect } from '@playwright/test';

export class TopbarComponent {
  constructor(page) {
    this.page = page;
    // El contenedor de la barra superior
    this.topbar = page.getByLabel('Topbar Menu');
    // El título de la página para confirmar que llegamos
    this.headerTitle = page.locator('.oxd-topbar-header-breadcrumb-module');
  }

  /**
   * Navega a través de los combos de la barra superior.
   * @param {string} menuName - Nombre del combo (ej: 'Organization')
   * @param {string} optionName - Nombre de la sub-opción (ej: 'Locations')
   */
  async selectComboOption(menuName, optionName) {
    // 1. Localizar y clickear el menú principal (ej: Organization)
    const menu = this.topbar.getByText(menuName);
    await menu.waitFor({ state: 'visible' });
    await menu.click();

    // 2. ESPERA DINÁMICA: Esperar a que el submenú aparezca
    const subOption = this.page.getByRole('menuitem', { name: optionName });
    await subOption.waitFor({ state: 'visible', timeout: 3000 });

    // 3. ACCIÓN: Clickear la opción final
    await subOption.click();
  }
}