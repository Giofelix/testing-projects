const { chromium } = require('@playwright/test');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { LoginPage } = require('../pages/login/login.page');

const authFile = path.join(__dirname, '.auth/user.json');
const MAX_SESSION_AGE_MS = 8 * 60 * 60 * 1000; // 8 horas

async function globalSetup() {
    // Validación temprana
    const baseURL = process.env.BASE_URL;
    const user    = process.env.USER_GENERIC;
    const pass    = process.env.PASSWORD_UNIVERSAL;

    if (!baseURL || !user || !pass) {
        throw new Error(
            `[globalSetup] Faltan variables de entorno. ` +
            `BASE_URL=${baseURL ? 'OK' : 'FALTA'}, ` +
            `USER_GENERIC=${user ? 'OK' : 'FALTA'}, ` +
            `PASSWORD_UNIVERSAL=${pass ? 'OK' : 'FALTA'}`
        );
    }

    const authDir = path.dirname(authFile);
    if (!fs.existsSync(authDir)) {
        fs.mkdirSync(authDir, { recursive: true });
    }

    // En local reutilizar sesión reciente; en CI siempre login fresco
    const shouldReuse = !process.env.CI && fs.existsSync(authFile);
    if (shouldReuse) {
        const age = Date.now() - fs.statSync(authFile).mtimeMs;
        if (age < MAX_SESSION_AGE_MS) {
            console.log(`[globalSetup] Sesión reutilizada (${Math.round(age / 60000)} min de antigüedad)`);
            return;
        }
    }

    // CAMBIO: eliminar user.json viejo antes de generar uno nuevo
    if (fs.existsSync(authFile)) {
        fs.unlinkSync(authFile);
        console.log('[globalSetup] user.json anterior eliminado para forzar sesión limpia');
    }

    console.log(`[globalSetup] Iniciando sesión nueva... (CI=${process.env.CI || 'false'}, usuario=${user})`);
    const browser = await chromium.launch({
        args: [
            '--lang=es-ES',
            '--accept-lang=es-ES',
            '--force-renderer-locale=es-ES',
            '--no-sandbox',
            '--disable-dev-shm-usage'
        ]
    });
    const context = await browser.newContext({
        locale: 'es-ES',
        timezoneId: 'America/Bogota',
        extraHTTPHeaders: {
            'Accept-Language': 'es-ES,es;q=0.9'
        }
    });
    const page = await context.newPage();

    try {
        const loginPage = new LoginPage(page);
        await loginPage.navegar();
        await loginPage.login(user, pass);

        const sessionData = await page.evaluate(() => {
            const data = {};
            for (let i = 0; i < window.sessionStorage.length; i++) {
                const key = window.sessionStorage.key(i);
                data[key] = window.sessionStorage.getItem(key);
            }
            return data;
        });

        if (Object.keys(sessionData).length === 0) {
            throw new Error('[globalSetup] El login no generó datos en sessionStorage');
        }

        fs.writeFileSync(authFile, JSON.stringify({ cookies: [], sessionStorage: sessionData }));
        console.log(`[globalSetup] ✓ Sesión guardada con ${Object.keys(sessionData).length} entradas`);
    } catch (error) {
        console.error('[globalSetup] ✗ Falló:', error.message);
        await page.screenshot({ path: path.join(authDir, 'globalsetup-failure.png') }).catch(() => {});
        throw error;
    } finally {
        await context.close();
        await browser.close();
    }
}

module.exports = globalSetup;