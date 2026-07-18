// @ts-check
import { defineConfig, devices } from '@playwright/test';

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '.env') });

/**
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './suites',
  globalSetup: './playwright/global-setup.js',
  globalTeardown: './playwright/global-teardown.js',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only — 1 retry locally cubre fallos transitorios de red */
  retries: process.env.CI ? 2 : 1,
  /* Test timeout */
  timeout: 240000,
  /* 1 worker local: evita saturar el servidor Angular con logins paralelos
     y previene condiciones de carrera en user.json entre teardown y setup */
  workers: process.env.CI ? 2 : 1,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [
    ['list'],                                            // log legible en consola
    ['allure-playwright', {
      detail: true,
      outputFolder: 'allure-results',
      suiteTitle: false,
      environmentInfo: {
        node_version: process.version,
        os_platform: process.platform,
      },
    }],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],  // backup local
  ],
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {

    locale: 'es-ES',
    timezoneId: 'America/Bogota',

    // Forzar idioma en las peticiones HTTP
    extraHTTPHeaders: {
      'Accept-Language': 'es-ES,es;q=0.9'
    },

    // Configuración de lanzamiento del navegador
    launchOptions: {
      args: [
        '--lang=es-ES',
        '--accept-lang=es-ES',
        '--force-renderer-locale=es-ES'
      ]
    },

    /* Timeouts amplios para servidor Angular remoto sobre VPN */
    navigationTimeout: 120000,
    actionTimeout: 45000,


    //Configuracion de trazas, capturas de pantalla y videos para depuración de fallos.
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',

    /*
        trace: 'on',
        screenshot: 'on',
        video: 'on',
    */
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        locale: 'es-ES',
        extraHTTPHeaders: {
          'Accept-Language': 'es-ES,es;q=0.9'
        },
        launchOptions: {
          args: ['--lang=es-ES', '--accept-lang=es-ES', '--force-renderer-locale=es-ES']
        }
      },

    }
    /*
        {
          name: 'firefox',
          use: { ...devices['Desktop Firefox'] },
        },
    
        {
          name: 'webkit',
          use: { ...devices['Desktop Safari'] },
        },
    
        */

    /* Test against mobile viewports. */
    // {
    //   name: 'Mobile Chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
    // {
    //   name: 'Mobile Safari',
    //   use: { ...devices['iPhone 12'] },
    // },

    /* Test against branded browsers. */
    // {
    //   name: 'Microsoft Edge',
    //   use: { ...devices['Desktop Edge'], channel: 'msedge' },
    // },
    // {
    //   name: 'Google Chrome',
    //   use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    // },
  ],

  /* Run your local dev server before starting the tests */
  // webServer: {
  //   command: 'npm run start',
  //   url: 'http://localhost:3000',
  //   reuseExistingServer: !process.env.CI,
  // },
});

