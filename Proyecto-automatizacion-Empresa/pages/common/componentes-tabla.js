const { expect } = require('@playwright/test');

class ComponentesTabla {
    constructor(page) {

        this.page = page;
        this.btnRefrescar = page.locator('mat-icon:has-text("refresh")');
        this.btnFiltrar = page.locator('mat-icon:has-text("filter_list")')
        // checkboxSeleccion: usa coincidencia exacta de celda para evitar que NITs que
        // son prefijo de otro (ej. 900516574 dentro de 9005165746) seleccionen la fila incorrecta.
        // Primero intenta localizar la fila por celda exacta; si no la encuentra, hace fallback
        // a la búsqueda por hasText + first() (comportamiento anterior).
        this.checkboxSeleccion = (textoFila) => {
            const byExactCell = page.getByRole('row').filter({
                has: page.getByRole('gridcell', { name: textoFila, exact: true })
            }).getByRole('checkbox').first();
            return byExactCell;
        };
        this.celdaDato = (textoFila) =>
            page.getByRole('row', { name: textoFila }).getByRole('gridcell').nth(1);
        this.selectorFilas = page.locator('div.mat-select-arrow');
        this.btnPrimeraPagina = page.locator('.divtable').getByRole('button', { name: 'Primer registro' });
        this.btnPaginaAnterior = page.locator('.divtable').getByRole('button', { name: 'Anterior' });
        this.btnPaginaSiguiente = page.locator('.divtable').getByRole('button', { name: 'Siguiente' });
        this.btnUltimaPagina = page.locator('.divtable').getByRole('button', { name: 'Último registro' });
    }

    async refrescar() {
        await this.btnRefrescar.click();
        await this.page.waitForLoadState('networkidle', { timeout: 30000 });
    }

    async filtrar() {
        await this.btnFiltrar.click();
        // Esperar a que el diálogo de filtro sea visible antes de interactuar con él
        await this.page.getByRole('dialog').waitFor({ state: 'visible', timeout: 15000 });
    }

    async seleccionarFila(textoFila) {
        // Esperar a que la fila con celda exacta sea visible antes de hacer click en el checkbox
        await this.page.getByRole('row').filter({
            has: this.page.getByRole('gridcell', { name: textoFila, exact: true })
        }).first().waitFor({ state: 'visible', timeout: 20000 });
        await this.checkboxSeleccion(textoFila).click({ force: true });
    }

    async abrirDetalle(textoFila) {
        await this.celdaDato(textoFila).click();
    }

    async abrirPrimerRegistro() {
        await this.page.getByRole('row').nth(1).getByRole('gridcell').nth(1).click();
    }

    async seleccionarCantidadFilas(cantidad) {
        await this.selectorFilas.click();
        await this.page.getByText(cantidad.toString(), { exact: true }).click();
    }

    async irAPrimeraPagina() {
        await this.btnPrimeraPagina.click();
    }

    async irAPaginaAnterior() {
        await this.btnPaginaAnterior.click();
    }

    async irAPaginaSiguiente() {
        await this.btnPaginaSiguiente.click();
    }

    async irAUltimaPagina() {
        await this.btnUltimaPagina.click();
    }
}

module.exports = { ComponentesTabla };