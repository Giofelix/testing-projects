// tests/admin/navegacion.spec.js
import { test } from '@playwright/test';
import { LoginPage } from '../../pages/login/LoginPage';
import { SidebarComponent } from '../../pages/componentes/sidebarcomponent';
import { TopbarComponent } from '../../pages/componentes/TopbarComponent';

test('Navegación dinámica por el sidebar', async ({ page }) => {
    const login = new LoginPage(page);
    const sidebar = new SidebarComponent(page);
    const topbar = new TopbarComponent(page);

    await login.goto();
    await login.login('Admin', 'admin123');

    // Ahora puedes navegar a donde quieras usando solo el nombre
    await sidebar.selectOption('Admin');
    await topbar.selectComboOption('User Management', 'users');
    await page.waitForTimeout(6000);
});