// tests/autenticacion.spec.js
import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/login/LoginPage'; // Ajusta la ruta si es necesario

test('debe iniciar sesión exitosamente con credenciales válidas', async ({ page }) => {
  const loginPage = new LoginPage(page);

  // 1. Ir a la página
  await loginPage.goto();

  // 2. Ejecutar la acción de login
  await loginPage.login('Admin', 'admin123');

  // 3. (Opcional) Validar que el login fue exitoso
  // await expect(page).toHaveURL(/dashboard/); 
  await page.waitForTimeout(6000);
  
});