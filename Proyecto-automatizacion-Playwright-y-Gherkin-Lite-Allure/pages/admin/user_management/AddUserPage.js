class AddUserPage {
    constructor(page) {
        this.page = page;

        // --- Encabezado de la página ---
        this.headingTitle = page.getByRole('heading', { name: 'Add User' });

        // --- Elementos del Formulario (Inputs y Dropdowns) ---
        // Se utiliza :has(label:text-is("...")) para asociar cada campo exclusivamente a su etiqueta exacta.
        this.userRoleDropdown = page.locator('.oxd-input-group:has(label:text-is("User Role")) .oxd-select-wrapper');

        // El input de empleado usa autocompletado con un placeholder único
        this.employeeNameInput = page.getByPlaceholder('Type for hints...');

        this.statusDropdown = page.locator('.oxd-input-group:has(label:text-is("Status")) .oxd-select-wrapper');

        this.usernameInput = page.locator('.oxd-input-group:has(label:text-is("Username")) input');

        // Match exacto del label para asegurar que "Password" no encuentre a "Confirm Password"
        this.passwordInput = page.locator('.oxd-input-group:has(label:text-is("Password")) input');
        this.confirmPasswordInput = page.locator('.oxd-input-group:has(label:text-is("Confirm Password")) input');

        // --- Botones de Acción ---
        this.saveButton = page.getByRole('button', { name: 'Save' });
        this.cancelButton = page.getByRole('button', { name: 'Cancel' });
    }

    /**
     * Función auxiliar para seleccionar opciones en los Dropdowns personalizados de OrangeHRM.
     * @param {import('@playwright/test').Locator} dropdownLocator - El localizador del select
     * @param {string} optionText - El texto exacto de la opción a seleccionar
     */
    async selectDropdownOption(dropdownLocator, optionText) {
        await dropdownLocator.click();
        // Al hacer click, el menú de opciones con rol 'option' aparece flotando en el DOM
        await this.page.getByRole('option', { name: optionText }).click();
    }

    /**
     * Llena completamente el formulario de nuevo usuario.
     * Puedes enviar un objeto parcial y solo llenará los campos provistos.
     * 
     * @typedef {Object} UserData
     * @property {string} [userRole] - 'ESS' o 'Admin'
     * @property {string} [employeeName] - Nombre del empleado existente para el autocompletado
     * @property {string} [status] - 'Enabled' o 'Disabled'
     * @property {string} [username] - Nuevo nombre de usuario
     * @property {string} [password] - Nueva contraseña
     * @property {string} [confirmPassword] - Confirmar la contraseña
     * 
     * @param {UserData} data
     */
    async fillAddUserForm(data) {
        if (data.userRole) {
            await this.selectDropdownOption(this.userRoleDropdown, data.userRole);
        }

        if (data.employeeName) {
            // Usamos pressSequentially para simular tipeo real y desencadenar el evento de búsqueda
            await this.employeeNameInput.pressSequentially(data.employeeName, { delay: 150 });

            // El servidor Demo de OrangeHRM es notoriamente lento (tarda ~2 segundos en quitar "Searching...")
            // Una espera estática pequeña aquí es valiosa y preferible a lidiar con el Loading spinner.
            await this.page.waitForTimeout(3000);

            // Recolectamos todas las opciones renderizadas finales
            const options = this.page.getByRole('option');
            const count = await options.count();

            if (count > 0) {
                // Seleccionamos matemáticamente una opción aleatoria de la lista devuelta
                const randomIndex = Math.floor(Math.random() * count);
                await options.nth(randomIndex).click();
            } else {
                console.log('No se cargaron opciones de empleado válidas. Intente con otra letra.');
            }
        }

        if (data.status) {
            await this.selectDropdownOption(this.statusDropdown, data.status);
        }

        if (data.username) {
            await this.usernameInput.fill(data.username);
        }

        if (data.password) {
            await this.passwordInput.fill(data.password);
        }

        if (data.confirmPassword) {
            await this.confirmPasswordInput.fill(data.confirmPassword);
        }
    }

    /**
     * Confirma el formulario dando clic en Guardar.
     */
    async confirmSave() {
        await this.saveButton.click();
    }

    /**
     * Cancela la creación del usuario.
     */
    async clickCancel() {
        await this.cancelButton.click();
    }
}

module.exports = { AddUserPage };
