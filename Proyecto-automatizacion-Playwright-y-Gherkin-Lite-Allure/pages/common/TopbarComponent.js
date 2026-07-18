// pages/components/TopbarComponent.js
import { expect } from '@playwright/test';

export class TopbarComponent {
  constructor(page) {
    this.page = page;
    // Contenedor principal de la barra de navegación horizontal
    this.topbar = page.locator('.oxd-topbar-body-nav');
    // El título de la página para confirmar que llegamos
    this.headerTitle = page.locator('.oxd-topbar-header-breadcrumb-module');
  }

  /**
   * Navega a través de los combos de la barra superior que tienen opciones desplegables.
   * @param {string} menuName - Nombre del tab principal (ej: 'Organization')
   * @param {string} optionName - Nombre de la sub-opción (ej: 'Locations')
   */
  async selectComboOption(menuName, optionName) {
    // 1. Localizar explícitamente el tab principal (nav-tab)
    const menuTab = this.topbar.locator('.oxd-topbar-body-nav-tab').filter({ hasText: menuName });
    await menuTab.waitFor({ state: 'visible' });
    await menuTab.click();

    // 2. ESPERA DINÁMICA: Esperar a que el submenú con rol menuitem aparezca
    const subOption = this.page.getByRole('menuitem', { name: optionName });
    await subOption.waitFor({ state: 'visible', timeout: 3000 });

    // 3. ACCIÓN: Clickear la opción final
    await subOption.click();
  }

  /**
   * Navega haciendo click en tabs que NO despliegan sub-menú (ej: 'Nationalities').
   * @param {string} tabName - Nombre del tab principal
   */
  async selectTab(tabName) {
    const menuTab = this.topbar.locator('.oxd-topbar-body-nav-tab').filter({ hasText: tabName });
    await menuTab.waitFor({ state: 'visible' });
    await menuTab.click();
  }
}