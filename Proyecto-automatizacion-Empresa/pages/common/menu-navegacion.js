const { expect } = require('@playwright/test');

class MenuNavegacion {
  constructor(page) {
    this.page = page;
    this.container = page.locator('.mat-drawer-inner-container');
    this.contextoActual = this.container;
  }

  async navegar(rutaOpciones) {
    this.contextoActual = this.container;
    for (const nombreOpcion of rutaOpciones) {
      await this.seleccionarOpcion(nombreOpcion);
    }
  }

async seleccionarOpcion(nombreOpcion) {
    // 1. Buscamos el elemento dentro del contexto actual
    // Usamos .locator() pero asegurándonos de que Playwright lo trate como una búsqueda fresca
    const opcion = this.contextoActual
      .locator('button, mat-panel-title, .btnMenu, .spanAcordeon, span')
      .filter({ hasText: new RegExp(`^${nombreOpcion}$`, 'i') })
      .first();

    // 2. LOG DE DEPURACIÓN (Opcional, para que veas qué está buscando en la consola)
    // console.log(`Buscando: ${nombreOpcion}`);

    // 3. Esperar y asegurar que el elemento sea visible
    await opcion.scrollIntoViewIfNeeded();
    // Bajamos un poco el timeout y usamos un retry manual si falla
    await expect(opcion).toBeVisible({ timeout: 5000 });

    const esAcordeon = await opcion.evaluate(node => {
      return !!node.closest('mat-expansion-panel-header');
    });

    // 4. Capturar el contenedor del panel antes del click
    let idPanel = '';
    if (esAcordeon) {
      // Si el panel no tiene ID propio, asignamos uno temporal para evitar el encadenamiento infinito de locators
      idPanel = await opcion.evaluate(node => {
        const panel = node.closest('mat-expansion-panel');
        if (!panel) return '';
        if (!panel.id) {
          panel.id = 'pw-nav-' + Math.random().toString(36).substr(2, 9);
        }
        return panel.id;
      });
    }

    // 5. Clic
    await opcion.click({ force: true });

    // 6. Actualizar Contexto
    if (esAcordeon) {
      // Si el panel tiene ID, lo usamos para refrescar el contexto y evitar el error de "Received: hidden"
      if (idPanel) {
        this.contextoActual = this.page.locator(`#${idPanel} .mat-expansion-panel-content`);
      } else {
        // Si no tiene ID, usamos el ancestro pero limitamos la profundidad
        this.contextoActual = opcion.locator('xpath=ancestor::mat-expansion-panel').locator('.mat-expansion-panel-content').first();
      }
      // Tiempo para la animación de Angular
      await this.page.waitForTimeout(800);
    } else {
      this.contextoActual = this.container;
      await this.page.waitForLoadState('networkidle');
    }
  }
}

module.exports = { MenuNavegacion };