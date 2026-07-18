class UserManagementPage {
    constructor(page) {
        this.page = page;

        // --- Elementos del Formulario de Filtros de Búsqueda ---
        // Se utiliza :has() para asociar el input a su Label (muy robusto)
        this.usernameInput = page.locator('.oxd-input-group:has(label:text-is("Username")) input');
        this.userRoleDropdown = page.locator('.oxd-input-group:has(label:text-is("User Role")) .oxd-select-wrapper');
        // El placeholder es único para este input de autocompletado
        this.employeeNameInput = page.getByPlaceholder('Type for hints...');
        this.statusDropdown = page.locator('.oxd-input-group:has(label:text-is("Status")) .oxd-select-wrapper');

        // --- Botones de Acción ---
        this.searchButton = page.getByRole('button', { name: 'Search' });
        this.resetButton = page.getByRole('button', { name: 'Reset' });
        this.addButton = page.getByRole('button', { name: 'Add' });

        // --- Elementos de la Tabla (Grid de Resultados) ---
        this.userTable = page.locator('.oxd-table');
        // Este localizador es para el texto "(X) Records Found"
        this.recordsFoundText = page.locator('.orangehrm-horizontal-padding > .oxd-text').first();
    }

    /**
     * Realiza una búsqueda rápida enviando el Username.
     * @param {string} username - Nombre del usuario exacto a buscar en la tabla
     */
    async searchByUsername(username) {
        await this.usernameInput.clear();
        await this.usernameInput.fill(username);
        await this.searchButton.click();
    }

    /**
     * Limpia todos los filtros actuales en el formulario.
     */
    async resetForm() {
        await this.resetButton.click();
    }

    /**
     * Presiona "+ Add" para ir a la vista de creación de usuario.
     */
    async clickAddRecord() {
        await this.addButton.click();
    }

    /**
     * Localiza la fila de la tabla correspondiente a un usuario.
     * @param {string} username - Nombre del usuario exacto a buscar en la tabla
     * @returns {import('@playwright/test').Locator} El localizador de la fila (card)
     */
    getUserRow(username) {
        return this.page.locator('.oxd-table-card').filter({ hasText: username });
    }

    /**
     * Hace clic en el botón de Editar (icono de lápiz) para el usuario especificado.
     * @param {string} username - Nombre del usuario
     */
    async clickEditUser(username) {
        const row = this.getUserRow(username);
        // El botón usa de icono principal la clase .bi-pencil-fill
        await row.locator('.bi-pencil-fill').click();
    }

    /**
     * Hace clic en el botón de Eliminar (icono de papelera) para el usuario especificado.
     * @param {string} username - Nombre del usuario
     */
    async clickDeleteUser(username) {
        const row = this.getUserRow(username);
        // El botón usa de icono principal la clase .bi-trash
        await row.locator('.bi-trash').click();
    }
}

// Mantengo tu exportación usando module.exports, aunque si los otros archivos usan 'export class', 
// puedes cambiar esto por `export class UserManagementPage`
module.exports = { UserManagementPage };