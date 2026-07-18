const { expect } = require('@playwright/test');

class AccionesCrud {

    constructor(page) {
        this.page = page;
        this.btnAgregar = page.getByText('add', { exact: true });
        this.btnGuardar = page.locator('mat-icon:has-text("save")');
        this.btnEditar = page.locator('mat-icon:has-text("edit")');
        this.btnEliminar = page.locator('mat-icon:has-text("delete")');
        this.btnAceptar = page.getByRole('button', { name: 'Aceptar' });
        this.btnCancelar = page.getByRole('button', { name: 'Cancelar' });
    }

    async agregar() {
        await this.btnAgregar.click();
    }

    async guardar() {
        await this.btnGuardar.click();
    }

    async editar() {
        await this.btnEditar.click();
    }

    async eliminar() {
        await this.btnEliminar.click();
    }

    async aceptar() {
        await this.btnAceptar.click();
    }

    async cancelar() {
        await this.btnCancelar.click();
    }

}

module.exports = { AccionesCrud };