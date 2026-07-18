// suites/login.spec.js
import { test, expect } from '@playwright/test';
import { given, when, then, feature, scenario } from 'gherkin-lite';
import { LoginPage } from '../pages/login/LoginPage.js';

// Feature: Agrupa todos los escenarios de autenticación
feature('Autenticación en OrangeHRM', () => {

  // ==================== ESCENARIO 1 ====================
  scenario('Iniciar sesión exitosamente con credenciales válidas', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const ctx = {};

    await given('el usuario está en la página de login de OrangeHRM', async () => {
      await loginPage.goto();
    });

    await when('ingresa credenciales válidas', async () => {
      await loginPage.login('Admin', 'admin123');
    });

    await then('el sistema redirige al dashboard principal', async () => {
      await expect(page).toHaveURL('https://opensource-demo.orangehrmlive.com/web/index.php/dashboard/index');
    });
  });

  // ==================== ESCENARIO 2 ====================
  scenario('Mostrar mensaje de error con usuario inválido', async ({ page }) => {
    const loginPage = new LoginPage(page);

    await given('el usuario está en la página de login de OrangeHRM', async () => {
      await loginPage.goto();
    });

    await when('ingresa un usuario inválido', async () => {
      await loginPage.login('usuarioNoValido', 'wrongpassword');
    });

    await then('el sistema muestra el mensaje de error "Invalid credentials"', async () => {
      const errorMessage = await loginPage.invalidCredentials();
      expect(errorMessage).toBe('Invalid credentials');
    });
  });

  // ==================== ESCENARIO 3 ====================
  scenario('Mostrar mensaje de error con password inválido', async ({ page }) => {
    const loginPage = new LoginPage(page);

    await given('el usuario está en la página de login de OrangeHRM', async () => {
      await loginPage.goto();
    });

    await when('ingresa un password inválido', async () => {
      await loginPage.login('Admin', 'wrongpassword');
    });

    await then('el sistema muestra el mensaje de error "Invalid credentials"', async () => {
      const errorMessage = await loginPage.invalidCredentials();
      expect(errorMessage).toBe('Invalid credentials');
    });
  });

  // ==================== ESCENARIO 4 ====================
  scenario('Mostrar logos y elementos de texto correctamente', async ({ page }) => {
    const loginPage = new LoginPage(page);

    await given('el usuario está en la página de login de OrangeHRM', async () => {
      await loginPage.goto();
    });

    await then('los logos de la empresa deben ser visibles', async () => {
      const logosVisible = await loginPage.validacionImagenesLogin();
      expect(logosVisible).toBe(true);
    });

    await then('los elementos de texto deben ser visibles con el texto correcto', async () => {
      await loginPage.validarElementosVisibles(
        [loginPage.headerLogin, loginPage.labelUsername, loginPage.labelPassword, 
         loginPage.forgotPassword, loginPage.version, loginPage.copyright],
        ['Login', 'Username', 'Password', 'Forgot your password?', 'OrangeHRM OS', '© 2005 - 2026 OrangeHRM, Inc']
      );
    });
  });

  // ==================== ESCENARIO 5 ====================
  scenario('Mostrar mensaje de error con campos vacíos', async ({ page }) => {
    const loginPage = new LoginPage(page);

    await given('el usuario está en la página de login de OrangeHRM', async () => {
      await loginPage.goto();
    });

    await when('ingresa username vacío y password vacío', async () => {
      await loginPage.login('', '');
    });

    await then('el sistema debe mostrar 2 mensajes de campo requerido', async () => {
      await expect(loginPage.requiredMessages).toHaveCount(2);
    });
  });

  // ==================== ESCENARIO 6 ====================
  scenario('Mostrar mensaje de error con usuario vacío', async ({ page }) => {
    const loginPage = new LoginPage(page);

    await given('el usuario está en la página de login de OrangeHRM', async () => {
      await loginPage.goto();
    });

    await when('ingresa username vacío y password válido', async () => {
      await loginPage.login('', 'admin123');
    });

    await then('el sistema debe mostrar 1 mensaje de campo requerido para username', async () => {
      await expect(loginPage.requiredMessages).toHaveCount(1);
    });
  });

  // ==================== ESCENARIO 7 ====================
  scenario('Mostrar mensaje de error con password vacío', async ({ page }) => {
    const loginPage = new LoginPage(page);

    await given('el usuario está en la página de login de OrangeHRM', async () => {
      await loginPage.goto();
    });

    await when('ingresa username válido y password vacío', async () => {
      await loginPage.login('Admin', '');
    });

    await then('el sistema debe mostrar 1 mensaje de campo requerido para password', async () => {
      await expect(loginPage.requiredMessages).toHaveCount(1);
    });
  });

  // ==================== ESCENARIO 8 ====================
  scenario('Validar texto de ejemplo de credenciales', async ({ page }) => {
    const loginPage = new LoginPage(page);

    await given('el usuario está en la página de login de OrangeHRM', async () => {
      await loginPage.goto();
    });

    await then('el texto de ejemplo del campo username debe ser visible', async () => {
      await expect(loginPage.usernameExample).toBeVisible();
    });

    await then('el texto de ejemplo del campo password debe ser visible', async () => {
      await expect(loginPage.passwordExample).toBeVisible();
    });
  });

  // ==================== ESCENARIO 9 ====================
  scenario('Validar enlaces sociales', async ({ page, context }) => {
    const loginPage = new LoginPage(page);

    await given('el usuario está en la página de login de OrangeHRM', async () => {
      await loginPage.goto();
    });

    await then('los enlaces de LinkedIn, Facebook, Twitter y YouTube deben ser visibles', async () => {
      await expect(loginPage.linkedinLink).toBeVisible();
      await expect(loginPage.facebookLink).toBeVisible();
      await expect(loginPage.twitterLink).toBeVisible();
      await expect(loginPage.youtubeLink).toBeVisible();
    });

    await then('al hacer clic en LinkedIn debe abrir una nueva pestaña con la URL de LinkedIn', async () => {
      const [newPage] = await Promise.all([
        context.waitForEvent('page'),
        loginPage.linkedinLink.click()
      ]);
      await expect(newPage).toHaveURL(/linkedin/);
      await newPage.close();
    });
  });

  // ==================== ESCENARIO 10 ====================
  scenario('Validar enlace de forgot password', async ({ page }) => {
    const loginPage = new LoginPage(page);

    await given('el usuario está en la página de login de OrangeHRM', async () => {
      await loginPage.goto();
    });

    await when('hace clic en el enlace "Forgot your password?"', async () => {
      await loginPage.forgotPassword.click();
    });

    await then('el sistema navega a la página de reset de password', async () => {
      await expect(page).toHaveURL('https://opensource-demo.orangehrmlive.com/web/index.php/auth/requestPasswordResetCode');
    });
  });

  // ==================== ESCENARIO 11 ====================
  scenario('Validar enlace en el copyright', async ({ page, context }) => {
    const loginPage = new LoginPage(page);

    await given('el usuario está en la página de login de OrangeHRM', async () => {
      await loginPage.goto();
    });

    await when('hace clic en el enlace "OrangeHRM, Inc" del copyright', async () => {
      const [newPage] = await Promise.all([
        context.waitForEvent('page'),
        loginPage.orangehrmLink.click()
      ]);
      return { newPage };
    });

    await then('debe abrir una nueva pestaña con el sitio oficial de OrangeHRM', async (result) => {
      await expect(result.newPage).toHaveURL('https://orangehrm.com/');
      await result.newPage.close();
    });
  });
});