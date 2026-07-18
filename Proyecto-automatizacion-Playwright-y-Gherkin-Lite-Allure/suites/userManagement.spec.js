import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/login/LoginPage';
import { SidebarComponent } from '../pages/common/sidebarcomponent';
import { UserManagementPage } from '../pages/admin/user_management/UserManagementPage';
import { AddUserPage } from '../pages/admin/user_management/AddUserPage';
import { EditUserPage } from '../pages/admin/user_management/EditUserPage';

// Generar un sufijo aleatorio para evitar colisiones en la base de datos si múltiples pruebas se ejecutan a lo largo del tiempo
const uniqueSuffix = Date.now().toString().substring(7);
let testUsername = `AutoUser_${uniqueSuffix}`;
// Asumimos que queremos buscar a cualquier empleado válido enviando una letra común (ej. "a")
// para que el Employee Name dropdown lance la primera opción indiferentemente de la data interna.
const testEmployee = 'a'; 

test.describe.serial('Admin - Gestión Completa de Usuarios (CRUD)', () => {
    let loginPage, sidebar, userManagement, addUserPage, editUserPage;

    // Se ejecutará rigurosamente antes de CADA escenario
    test.beforeEach(async ({ page }) => {
        // 1. Instanciación de todos tus Page Object Models creados
        loginPage = new LoginPage(page);
        sidebar = new SidebarComponent(page);
        userManagement = new UserManagementPage(page);
        addUserPage = new AddUserPage(page);
        editUserPage = new EditUserPage(page);

        // 2. Loguearse siempre e ir al módulo de Admin de forma limpia
        await loginPage.goto();
        await loginPage.login('Admin', 'admin123');
        await sidebar.selectOption('Admin');

        // Punto de sincronización crítico: Esperar la tabla
        await userManagement.userTable.waitFor({ state: 'visible', timeout: 10000 });
    });

    test('1. [CREATE] Debe crear un nuevo usuario de sistema exitosamente', async ({ page }) => {
        // Clic en el botón Add
        await userManagement.clickAddRecord();
        await expect(addUserPage.headingTitle).toBeVisible();

        // Llenamos el formato usando el método automatizado
        await addUserPage.fillAddUserForm({
            userRole: 'ESS',
            employeeName: testEmployee,
            status: 'Enabled',
            username: testUsername,
            password: 'Password123!',
            confirmPassword: 'Password123!'
        });

        await addUserPage.confirmSave();

        // [Aserción Crítica]: Esperar el mensaje flotante verde que confirma que se guardó
        const toastSuccess = page.locator('.oxd-toast--success');
        await expect(toastSuccess).toBeVisible({ timeout: 10000 });
        await expect(toastSuccess).toContainText('Successfully Saved');
    });

    test('2. [READ] Debe buscar y encontrar al usuario recién creado en la tabla', async ({ page }) => {
        // Invocar filtros
        await userManagement.searchByUsername(testUsername);

        // Validar el contador de texto encontrado
        await expect(userManagement.recordsFoundText).not.toContainText('No Records Found');

        // Extraemos puntalmente la fila y validamos su presencia en pantalla
        const userRow = userManagement.getUserRow(testUsername);
        await expect(userRow).toBeVisible();
    });

    test('3. [UPDATE] Debe editar el usuario encontrado y cambiar su contraseña', async ({ page }) => {
        // Buscar el usuario para enfocar la URL en la tabla correcta
        await userManagement.searchByUsername(testUsername);
        
        // Hacemos clic en su ícono de edición individual usando el localizador dinámico
        await userManagement.clickEditUser(testUsername);
        await expect(editUserPage.headingTitle).toBeVisible();

        const updatedUsername = testUsername + '_edit';

        // Modifica visualmente el campo username y marca el Checkbox de "Change Password"
        await editUserPage.fillEditUserForm({
            username: updatedUsername,
            password: 'NewPassword123!',
            confirmPassword: 'NewPassword123!'
        });

        await editUserPage.confirmSave();

        // [Aserción Crítica]
        const toastSuccess = page.locator('.oxd-toast--success');
        await expect(toastSuccess).toBeVisible({ timeout: 10000 });
        await expect(toastSuccess).toContainText('Successfully Updated');

        // Actualizamos la variable para que el último test borre al usuario con este nuevo nombre
        testUsername = updatedUsername;
    });

    test('4. [DELETE] Debe borrar exitosamente al usuario y su registro debe desaparecer', async ({ page }) => {
        // Buscar la entidad
        await userManagement.searchByUsername(testUsername);

        // Presionar ícono de papelera de ESA Fila particular
        await userManagement.clickDeleteUser(testUsername);

        // Modal estandarizado de OrangeHRM "Are you sure?"
        const confirmDeleteButton = page.getByRole('button', { name: 'Yes, Delete' });
        await expect(confirmDeleteButton).toBeVisible();
        await confirmDeleteButton.click();

        // [Aserción Crítica] Mensaje de eliminado
        const toastSuccess = page.locator('.oxd-toast--success');
        await expect(toastSuccess).toBeVisible({ timeout: 10000 });
        await expect(toastSuccess).toContainText('Successfully Deleted');

        // Confirmación final fuerte: El username no produce resultados en la tabla
        await userManagement.resetForm();
        await userManagement.searchByUsername(testUsername);
        await expect(userManagement.getUserRow(testUsername)).toHaveCount(0);
        await expect(userManagement.recordsFoundText).toContainText('No Records Found');
    });
});

