const { chromium } = require('@playwright/test');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { LoginPage } = require('../pages/login/login.page');

const authFile = path.join(__dirname, '.auth/user.json');

async function globalTeardown() {
    console.log('[globalTeardown] Iniciando cierre de sesión final...');

    // Si no hay sesión guardada, no hay nada que cerrar
    if (!fs.existsSync(authFile)) {
        console.log('[globalTeardown] No hay user.json — nada que cerrar');
        return;
    }

    const baseURL = process.env.BASE_URL;
    if (!baseURL) {
        console.warn('[globalTeardown] BASE_URL no definida — saltando logout');
        return;
    }

    let browser;
    try {
        // Cargar la sesión guardada y hacer logout desde la app
        const authData = JSON.parse(fs.readFileSync(authFile, 'utf8'));

        browser = await chromium.launch({
            args: ['--lang=es-ES', '--force-renderer-locale=es-ES', '--no-sandbox', '--disable-dev-shm-usage']
        });
        const context = await browser.newContext({
            locale: 'es-ES',
            timezoneId: 'America/Bogota',
            extraHTTPHeaders: { 'Accept-Language': 'es-ES,es;q=0.9' }
        });
        const page = await context.newPage();

        // Inyectar sessionStorage antes de cargar la app
        await page.addInitScript((sessionData) => {
            for (const [key, value] of Object.entries(sessionData)) {
                window.sessionStorage.setItem(key, value);
            }
        }, authData.sessionStorage);

        // Navegar a la app autenticado
        await page.goto(baseURL, { timeout: 60000, waitUntil: 'domcontentloaded' });
        await page.waitForURL('**/modulos**', { timeout: 30000 });

        // Hacer logout usando el método del Page Object
        const loginPage = new LoginPage(page);
        await loginPage.logout();

        console.log('[globalTeardown] ✓ Sesión cerrada en el servidor');
    } catch (error) {
        console.warn(`[globalTeardown] ⚠ No se pudo hacer logout limpiamente: ${error.message.split('\n')[0]}`);
        console.warn('[globalTeardown] La sesión podría tardar unos minutos en expirar por timeout del servidor');
    } finally {
        if (browser) await browser.close();

        // Limpiar el user.json para que el siguiente build no intente reutilizar una sesión muerta
        try {
            if (fs.existsSync(authFile)) {
                fs.unlinkSync(authFile);
                console.log('[globalTeardown] user.json eliminado (siguiente build hará login fresco)');
            }
        } catch (e) {
            // ignorar
        }
    }
}

module.exports = globalTeardown;