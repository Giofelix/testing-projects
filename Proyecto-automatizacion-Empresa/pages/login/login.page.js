class LoginPage {
    constructor(page) {
        this.page = page;
        this.usernameInput = page.locator('#txtU');
        this.nextButton = page.getByRole('button', { name: /siguiente|next/i });
        this.passwordInput = page.locator('#txtP');
        this.loginButton = page.getByRole('button', { name: /iniciar sesión|sign in|log in/i });
        this.logoutButton = page.getByRole('menuitem', { name: /cerrar sesión|sign out|log out/i });
        this.userMenuButton = page.locator('button.mat-menu-trigger.btn-barra');
    }

    async navegar() {
        console.log(`[LoginPage] Navegando a ${process.env.BASE_URL}`);
        await this.page.goto(process.env.BASE_URL, { timeout: 120000, waitUntil: 'domcontentloaded' });

        // Confirmar que Angular terminó de inicializar los form controls antes de interactuar
        await this.page.waitForFunction(
            () => document.querySelector('#txtU')?.classList.contains('ng-pristine'),
            { timeout: 30000 }
        );
        console.log('[LoginPage] ✓ Página de login lista (Angular inicializado)');
    }

    async login(usuario, password) {
        const MAX_INTENTOS = 3;
        const TIMEOUT_POR_INTENTO = 20000; // 20s por intento (antes 60s de un solo golpe)

        console.log(`[LoginPage] Iniciando login con usuario: ${usuario}`);

        // Paso 1 + 2 con reintentos: tipear usuario, clic en Siguiente, esperar #txtP
        let exitoso = false;

        for (let intento = 1; intento <= MAX_INTENTOS; intento++) {
            try {
                console.log(`[LoginPage] === Intento ${intento}/${MAX_INTENTOS}: validación de usuario ===`);

                // Limpiar y tipear usando page.keyboard para compatibilidad headless/Linux:
                // pressSequentially a nivel de locator no dispara el blur que Angular
                // necesita para habilitar el botón en modo headless.
                await this.usernameInput.click();   // establecer foco
                await this.usernameInput.fill('');  // limpiar campo
                await this.page.keyboard.type(usuario, { delay: 80 }); // despacho a nivel de página
                await this.page.keyboard.press('Tab'); // blur → Angular finaliza validación del form
                await this.page.waitForTimeout(400);   // tick para change detection de Angular

                console.log('[LoginPage] Usuario tipeado, haciendo clic en "Siguiente"...');
                await this.nextButton.click({ timeout: TIMEOUT_POR_INTENTO });

                console.log(`[LoginPage] Esperando campo de password (timeout ${TIMEOUT_POR_INTENTO / 1000}s)...`);
                await this.passwordInput.waitFor({ state: 'visible', timeout: TIMEOUT_POR_INTENTO });

                console.log(`[LoginPage] ✓ Campo password visible en intento ${intento}`);
                exitoso = true;
                break;

            } catch (error) {
                const errorLine = error.message.split('\n')[0];
                console.warn(`[LoginPage] ⚠ Intento ${intento} falló: ${errorLine}`);

                // Screenshot diagnóstico
                await this._guardarScreenshotDiagnostico(`login-intento-${intento}-fallido`);

                if (intento === MAX_INTENTOS) {
                    throw new Error(
                        `[LoginPage] Validación de usuario falló después de ${MAX_INTENTOS} intentos. ` +
                        `Posible causa: sesión previa colgada en el servidor para el usuario "${usuario}". ` +
                        `Último error: ${errorLine}`
                    );
                }

                // Recuperación: refresh completo para resetear estado de Angular y servidor
                console.log('[LoginPage] Esperando 3s y refrescando página antes de reintentar...');
                await this.page.waitForTimeout(3000);
                await this.page.reload({ waitUntil: 'domcontentloaded', timeout: 60000 });

                // Re-esperar a que Angular esté listo
                await this.page.waitForFunction(
                    () => document.querySelector('#txtU')?.classList.contains('ng-pristine'),
                    { timeout: 30000 }
                ).catch(() => console.warn('[LoginPage] No se detectó ng-pristine tras reload'));
            }
        }

        // Paso 3: ingresar contraseña y autenticar
        console.log('[LoginPage] Ingresando password...');
        await this.passwordInput.fill(password);
        await this.loginButton.click();

        // Paso 4: esperar navegación a /modulos con manejo de diálogos intermedios.
        // Algunas apps (ej: pasto) muestran un diálogo de confirmación cuando hay una sesión
        // activa previa (pipeline anterior no cerró sesión). El loop detecta ese diálogo,
        // lo descarta y continúa esperando el redirect.
        console.log('[LoginPage] Esperando redirección a /modulos...');
        const REDIRECT_TIMEOUT = 120000;
        const deadline = Date.now() + REDIRECT_TIMEOUT;

        // Credenciales inválidas → mat-dialog con texto de error del servidor
        const dialogoError = this.page.locator('mat-dialog-container').filter({
            hasText: /código|no fue posible|credencial|contraseña incorrecta/i
        });
        // Diálogo de sesión activa / confirmación → tiene botón Aceptar pero NO es error de cred.
        const dialogoConfirmacion = this.page.locator('mat-dialog-container').filter({
            hasNotText: /código|no fue posible|credencial|contraseña incorrecta/i
        });
        // SweetAlert2 que puede aparecer antes del redirect en algunas apps
        const swal = this.page.locator('.swal2-popup');

        let resultado = 'loop';
        while (resultado === 'loop' && Date.now() < deadline) {
            const restante = Math.max(deadline - Date.now(), 1000);
            resultado = await Promise.race([
                this.page.waitForURL('**/modulos**', { timeout: restante }).then(() => 'ok'),
                dialogoError.waitFor({ state: 'visible', timeout: restante }).then(() => 'error'),
                dialogoConfirmacion.waitFor({ state: 'visible', timeout: restante }).then(() => 'confirm'),
                swal.waitFor({ state: 'visible', timeout: restante }).then(() => 'swal'),
            ]).catch(() => 'timeout');

            if (resultado === 'confirm') {
                // Diálogo de sesión activa u otro intermedio — aceptar y seguir esperando
                const textoDialogo = await dialogoConfirmacion.textContent().catch(() => '');
                console.log(`[LoginPage] Diálogo intermedio detectado: "${textoDialogo.trim().slice(0, 80)}". Aceptando...`);
                await this.page.locator('mat-dialog-container button').filter({ hasText: /aceptar|continuar|ok|sí/i })
                    .first().click({ timeout: 5000 }).catch(() => {});
                resultado = 'loop'; // reiniciar espera
            }

            if (resultado === 'swal') {
                const textoSwal = await swal.textContent().catch(() => '');
                if (/código|no fue posible|credencial|contraseña incorrecta/i.test(textoSwal)) {
                    resultado = 'error';
                } else {
                    console.log(`[LoginPage] SweetAlert intermedio: "${textoSwal.trim().slice(0, 80)}". Cerrando...`);
                    await this.page.locator('.swal2-confirm').click({ timeout: 5000 }).catch(() => {});
                    resultado = 'loop';
                }
            }
        }

        if (resultado === 'error') {
            const textoError = await dialogoError.textContent().catch(() => '');
            await this._guardarScreenshotDiagnostico('login-error-credenciales');
            throw new Error(`[LoginPage] El servidor rechazó las credenciales. Diálogo: ${textoError.trim()}`);
        }
        if (resultado !== 'ok') {
            await this._guardarScreenshotDiagnostico('login-timeout-modulos');
            throw new Error('[LoginPage] Timeout esperando redirección a /modulos tras el login');
        }

        await this.page.locator('.mat-drawer-inner-container').waitFor({ state: 'visible', timeout: 30000 });
        console.log('[LoginPage] ✓ Login completado exitosamente');
    }

    /**
     * Cierra la sesión en el servidor para liberar el usuario.
     * Tolera fallos: si el logout no funciona, no debe romper el pipeline.
     */
    async logout() {
        console.log('[LoginPage] Iniciando logout...');

        try {
            // Si el logout está dentro de un menú de usuario, abrirlo primero
            if (this.userMenuButton) {
                await this.userMenuButton.click({ timeout: 10000 });
                await this.page.waitForTimeout(500); // pequeña espera para animación
            }

            await this.logoutButton.click({ timeout: 10000 });

            // Esperar a que regrese a la página de login (URL cambia o #txtU vuelve a ser visible)
            await this.usernameInput.waitFor({ state: 'visible', timeout: 15000 });
            console.log('[LoginPage] ✓ Logout completado, sesión liberada en el servidor');
        } catch (error) {
            console.warn(`[LoginPage] ⚠ Logout no se completó limpiamente: ${error.message.split('\n')[0]}`);
            console.warn('[LoginPage] La sesión podría seguir activa en el servidor por unos minutos');
        }
    }

    /**
     * Helper interno para guardar screenshots de diagnóstico.
     */
    async _guardarScreenshotDiagnostico(nombre) {
        const fs = require('fs');
        const path = require('path');
        const dir = path.join(process.cwd(), 'playwright', '.auth');
        try {
            if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
            await this.page.screenshot({
                path: path.join(dir, `${nombre}.png`),
                fullPage: true
            });
            console.log(`[LoginPage] Screenshot guardado: ${nombre}.png`);
        } catch (e) {
            // silenciar errores de screenshot
        }
    }
}

module.exports = { LoginPage };