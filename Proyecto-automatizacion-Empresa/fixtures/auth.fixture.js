import { test as base, expect } from '@playwright/test';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: resolve(__dirname, '../.env') });

const authFile = resolve(__dirname, '../playwright/.auth/user.json');

const test = base.extend({
  paginaAutenticada: async ({ page }, use) => {
    const authData = JSON.parse(readFileSync(authFile, 'utf8'));

    await page.addInitScript((sessionData) => {
      for (const [key, value] of Object.entries(sessionData)) {
        window.sessionStorage.setItem(key, value);
      }
    }, authData.sessionStorage);

    await page.goto(process.env.BASE_URL, { timeout: 60000, waitUntil: 'domcontentloaded' });
    await page.waitForURL('**/modulos**', { timeout: 30000 });
    await page.locator('.mat-drawer-inner-container').waitFor({ state: 'visible', timeout: 30000 });

    await use(page);
  }
});

export { test, expect };
