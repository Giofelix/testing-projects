const { expect } = require('@playwright/test');


class AccionesDeclaracionRenta {

    /** @param {import('@playwright/test').Page} page */
    constructor(page) {
        this.page = page;

        this.botonMasOpciones = page.locator(
            'button.mat-menu-trigger[ng-reflect-message="Abrir menú"]'
        );

        // El panel del more_vert no lleva la clase UsuarioMenu (que sí tiene el menú de sesión).
        this.panelMenu = page.locator('.mat-menu-panel:not(.UsuarioMenu)');
    }

    async abrirMenu() {
        await this.botonMasOpciones.click();
        await this.panelMenu.waitFor({ state: 'visible', timeout: 10000 });
    }

    async cerrarMenu() {
        await this.page.keyboard.press('Escape');
        await this.panelMenu.waitFor({ state: 'hidden', timeout: 5000 });
    }

    /**
     * Selecciona cualquier opción del menú more_vert por su texto exacto.
     * @param {string} nombreOpcion - Texto visible de la opción (ej. 'Declaraciones')
     */
    async seleccionarOpcion(nombreOpcion) {
        await this.page.getByRole('menuitem', { name: nombreOpcion, exact: true }).click();
    }

}

module.exports = { AccionesDeclaracionRenta };
