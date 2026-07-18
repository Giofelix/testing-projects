// pages/components/SidebarComponent.js
import { expect } from '@playwright/test'; // Importamos expect para las aserciones dinámicas

export class SidebarComponent {
  constructor(page) {
    this.page = page;
    // Localizador del buscador (mejor usar getByPlaceholder para los inputs con placeholder explícito)
    this.searchInput = page.getByPlaceholder('Search');
    // Localizador del título de la página (el encabezado que confirma la navegación)
    this.headerTitle = page.locator('.oxd-topbar-header-breadcrumb-module');
    // Localizador general para las opciones de menú (útil por si quieres iterar o contar los links del sidebar)
    this.optionsList = page.locator('.oxd-main-menu-item');
  }

  /**
   * Navega a cualquier opción del menú lateral y espera dinámicamente la carga.
   */
  async selectOption(optionName) {
    // 1. Localizador dinámico para la opción del menú
    const option = this.page.getByRole('link', { name: optionName });

    // 2. ESPERA DINÁMICA INICIAL: Asegurar que la opción sea visible antes de clickear
    await option.waitFor({ state: 'visible', timeout: 5000 });

    // 3. ACCIÓN
    await option.click();

    // 4. ESPERA DINÁMICA DE CONFIRMACIÓN: 
    // En lugar de sleep(6000), esperamos a que el título de la cabecera sea el correcto.
    // toHaveText tiene un reintento automático integrado (polling).
    await expect(this.headerTitle).toHaveText(optionName, { timeout: 10000 });
  }

  /**
   * Usa el buscador del sidebar para encontrar una opción rápido.
   */
  async searchInMenu(term) {
    await this.searchInput.clear();
    await this.searchInput.fill(term);

    // Opcional: Esperar a que los resultados se filtren (espera dinámica)
    // Podríamos esperar a que solo aparezca el link que buscamos
    await this.page.getByRole('link', { name: term }).waitFor({ state: 'visible' });
  }
}