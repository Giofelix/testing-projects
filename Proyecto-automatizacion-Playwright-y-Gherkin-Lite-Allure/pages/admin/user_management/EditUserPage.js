const { AddUserPage } = require('./AddUserPage');

/**
 * EditUserPage hereda de AddUserPage porque los formularios de OrangeHRM 
 * para agregar y editar comparten el 95% de los selectores.
 * 
 * Aplicar Herencia aquí (Inheritance en POM) evita duplicación masiva de código
 * y si el formulario base cambia, solo debemos actualizar el AddUserPage.
 */
class EditUserPage extends AddUserPage {
    constructor(page) {
        // Llamamos al constructor del padre que inicializa su `page` y todos los inputs/botones básicos
        super(page);

        // --- Elementos únicos y exclusivos de la Edición ---

        // Limpiamos los selectores. La forma más segura en frameworks modernos es interactuar con el <label>.
        // El label envuelve al checkbox y al texto "Yes". Dar click al label en HTML5 transfiere el evento nativamente.
        this.changePasswordLabel = page.locator('.oxd-checkbox-wrapper label').filter({ hasText: 'Yes' });
        this.changePasswordNativeInput = page.locator('.oxd-checkbox-wrapper input[type="checkbox"]');

        // Sobrescribimos el título para aserciones si es necesario
        this.headingTitle = page.getByRole('heading', { name: 'Edit User' });
    }

    /**
     * Determina si se quiere marcar o desmarcar la casilla de cambiar password.
     * @param {boolean} shouldEnable - true para activar el cambio, false para ignorarlo
     */
    async toggleChangePassword(shouldEnable) {
        // Obtenemos el booleano nativo de Playwright sobre el input
        const isCurrentlyChecked = await this.changePasswordNativeInput.isChecked();

        if (isCurrentlyChecked !== shouldEnable) {
            console.log(`[EditUserPage] Cambiando estado de Change Password a: ${shouldEnable}`);
            // Hacemos un clic orgánico estricto, sin { force: true } para asegurar la reacción natural del UI
            await this.changePasswordLabel.click();

            // Pausamos para asegurar que el DOM dibuje de forma descendente los ocultos
            await this.page.waitForTimeout(1500);
        } else {
            console.log(`[EditUserPage] El Checkbox ya estaba en el estado deseado: ${shouldEnable}`);
        }
    }

    /**
     * Llena completamente el formulario de edición de usuario.
     * Reutilizamos la lógica del padre, pero comprobando primero el estado especial de la contraseña.
     *
     * @param {Object} data 
     */
    async fillEditUserForm(data) {
        // ¿El usuario envió info de password para actualizar?
        if (data.password || data.confirmPassword) {
            // Activamos el checkbox para revelar los campos ocultos
            await this.toggleChangePassword(true);
        } else if (data.hasOwnProperty('password')) {
            // Si envia password en undefined o nulo explicitamente, destildamos
            await this.toggleChangePassword(false);
        }

        // Llamamos a la función genérica heredada de AddUserPage (¡código 100% reutilizado!)
        await this.fillAddUserForm(data);
    }
}

module.exports = { EditUserPage };
