// suites/job.spec.js (versión con escenarios más específicos)
import { test, expect } from '@playwright/test';
import { given, when, then, and, feature, scenario } from 'gherkin-lite';
import { LoginPage } from '../pages/login/LoginPage.js';
import { SidebarComponent } from '../pages/common/sidebarcomponent.js';
import { TopbarComponent } from '../pages/common/TopbarComponent.js';
import { UserManagementPage } from '../pages/admin/user_management/UserManagementPage.js';
import { AddJobTitle } from '../pages/admin/job/AddJobTitle.js';

feature('Administración de Job Titles', () => {

  // Background: Configuración común para todos los escenarios
  let loginPage;
  let sidebar;
  let topbar;
  let userManagement;
  let addJobTitle;

  // ==================== ESCENARIO 1 ====================
  scenario('Agregar un nuevo Job Title correctamente', async ({ page }) => {
    loginPage = new LoginPage(page);
    sidebar = new SidebarComponent(page);
    topbar = new TopbarComponent(page);
    userManagement = new UserManagementPage(page);
    addJobTitle = new AddJobTitle(page);

    await given('el usuario administrador está autenticado en el sistema', async () => {
      await loginPage.goto();
      await loginPage.login('Admin', 'admin123');
    });

    await when('navega a la sección de Admin', async () => {
      await sidebar.selectOption('Admin');
    });

    await and('accede a la subsección Job Titles', async () => {
      await topbar.selectComboOption('Job', 'Job Titles');
    });

    await and('inicia la creación de un nuevo Job Title', async () => {
      await userManagement.clickAddRecord();
    });

    await and('completa el formulario con datos válidos', async () => {
      await addJobTitle.fillForm(
        'Trabajo 4', 
        'Responsible for testing software applications', 
        'This is a note for the QA Engineer job title'
      );
    });

    await and('guarda el nuevo registro', async () => {
      await addJobTitle.clickSave();
    });

    await then('el sistema debe mostrar un mensaje de éxito', async () => {
      await addJobTitle.validateSuccessMessage();
    });
  });

  // ==================== ESCENARIO 2 (opcional) ====================
  scenario('Intentar agregar un Job Title con campos obligatorios vacíos', async ({ page }) => {
    loginPage = new LoginPage(page);
    sidebar = new SidebarComponent(page);
    topbar = new TopbarComponent(page);
    userManagement = new UserManagementPage(page);
    addJobTitle = new AddJobTitle(page);

    await given('el usuario administrador está autenticado en el sistema', async () => {
      await loginPage.goto();
      await loginPage.login('Admin', 'admin123');
    });

    await when('navega a la sección de Admin', async () => {
      await sidebar.selectOption('Admin');
    });

    await and('accede a la subsección Job Titles', async () => {
      await topbar.selectComboOption('Job', 'Job Titles');
    });

    await and('inicia la creación de un nuevo Job Title', async () => {
      await userManagement.clickAddRecord();
    });

    await when('completa el formulario dejando el campo Job Title vacío', async () => {
      await addJobTitle.fillForm('', 'Responsible for testing', 'Note');
    });

    await and('intenta guardar el registro', async () => {
      await addJobTitle.clickSave();
    });

    await then('el sistema debe mostrar un mensaje de error indicando que el campo es requerido', async () => {
      // Aquí validas el mensaje de error específico
      await expect(page.locator('.oxd-input-field-error-message')).toBeVisible();
    });
  });
});