import { expect } from '@playwright/test';

export class Establecimientos {
    constructor(page) {
        this.page = page;

        // --- Tabla principal (lista de establecimientos) ---
        this.tablaGrid = page.getByRole('grid');
        this.columnaCodigo = page.getByRole('columnheader', { name: 'Código' });
        this.columnaNombre = page.getByRole('columnheader', { name: 'Nombre' });
        this.columnaTelefono = page.getByRole('columnheader', { name: 'Teléfono' });
        this.columnaDireccion = page.getByRole('columnheader', { name: 'Dirección' });
        this.columnaEstado = page.getByRole('columnheader', { name: 'Estado' });
        this.columnaMatricula = page.getByRole('columnheader', { name: 'Matrícula' });
        this.columnaFechaMatricula = page.getByRole('columnheader', { name: 'Fecha de matrícula' });
        this.columnaInicioActividad = page.getByRole('columnheader', { name: 'Inicio actividad' });

        // --- Menú contextual de la lista (more_vert propio del módulo) ---
        this.btnMenuLista = page.getByRole('button').filter({ hasText: 'more_vert' });
        this.menuItemRegistrarActividades = page.getByRole('menuitem', { name: 'Registrar actividades' });

        // --- Cabecera del formulario de creación/edición ---
        // La etiqueta cambia entre "Agregar establecimiento" y el código al editar
        this.tituloFormulario = page.locator('div').filter({ hasText: /^(Agregar establecimiento|\d+)$/ }).first();

        // --- Tabs del formulario ---
        this.tabBasica = page.getByRole('tab', { name: 'Básica' });
        this.tabAdicional = page.getByRole('tab', { name: 'Adicional' });

        // --- Tab Básica — campos ---
        this.inputCodigo = page.getByRole('textbox', { name: 'Código' });          // disabled, autogenerado
        this.inputNombre = page.getByRole('textbox', { name: 'Nombre' });          // * obligatorio
        this.inputTelefono = page.getByRole('spinbutton', { name: 'Teléfono' });     // * obligatorio, tipo número

        // Comboboxes con botón play_arrow para cargar opciones encadenadas
        this.comboPais = page.getByRole('combobox', { name: 'País' });           // * obligatorio
        this.btnPais = page.locator('mat-form-field').filter({ hasText: 'País' }).getByRole('button');

        this.comboDepartamento = page.getByRole('combobox', { name: 'Departamento' });  // * obligatorio; se habilita tras seleccionar País
        this.btnDepartamento = page.locator('mat-form-field').filter({ hasText: 'Departamento' }).getByRole('button');

        this.comboCiudad = page.getByRole('combobox', { name: 'Ciudad' });         // * obligatorio; se habilita tras seleccionar Departamento
        this.btnCiudad = page.locator('mat-form-field').filter({ hasText: 'Ciudad' }).getByRole('button');

        this.comboBarrio = page.getByRole('combobox', { name: 'Barrio' });         // * obligatorio (RN-01 confirmado)
        this.btnBarrio = page.locator('mat-form-field').filter({ hasText: 'Barrio' }).getByRole('button');

        this.inputDireccion = page.getByRole('textbox', { name: 'Dirección' });       // * obligatorio

        this.comboTipoLocal = page.getByRole('combobox', { name: 'Tipo local' });    // opcional
        this.btnTipoLocal = page.locator('mat-form-field').filter({ hasText: 'Tipo local' }).getByRole('button');

        this.inputMatriculaMercantil = page.getByRole('textbox', { name: 'Matrícula mercantíl' }); // opcional
        this.inputFechaMatricula = page.getByRole('textbox', { name: 'Fecha matrícula' });
        this.btnCalendarioFechaMatricula = page.locator('mat-form-field').filter({ hasText: 'Fecha matrícula' }).getByRole('button', { name: 'Open calendar' });

        this.inputCorreoElectronico = page.getByRole('textbox', { name: 'Correo electronico' }); // * obligatorio
        this.inputInicioActividad = page.getByRole('textbox', { name: 'Inicio actividad' });   // * obligatorio
        this.btnCalendarioInicioActividad = page.locator('mat-form-field').filter({ hasText: 'Inicio actividad' }).getByRole('button', { name: 'Open calendar' });

        this.inputConsecutivoMatricula = page.getByRole('textbox', { name: 'Consecutivo matrícula' }); // disabled, autogenerado

        // --- Tab Adicional — campos ---
        this.inputCodigoCatastral = page.getByRole('textbox', { name: 'Código catastral' });
        this.inputPaginaWeb = page.getByRole('textbox', { name: 'Página web' });
        this.inputCodigoPostal = page.getByRole('textbox', { name: 'Código postal' });
        // "Código" en tab Adicional (campo distinto al Código autogenerado del header)
        // Uso getByPlaceholder exacto porque el tabpanel contiene varios campos cuyo name incluye "Código"
        // (Código catastral, Código postal, Código) y el selector de role genera strict-mode violation.
        this.inputCodigoAdicional = page.getByRole('tabpanel', { name: 'Adicional' }).getByPlaceholder('Código', { exact: true });

        // --- Breadcrumb de navegación ---
        // El formulario de Establecimientos no tiene botón "Cancelar" explícito.
        // Para volver a la lista se usa el botón "Establecimientos" del breadcrumb.
        this.btnBreadcrumbEstablecimientos = page.getByRole('button', { name: 'Establecimientos' });

        // --- Diálogo de filtro ("Búsqueda por:") ---
        this.dialogoBusqueda = page.getByRole('dialog', { name: 'Búsqueda por:' });
        this.filtroCodigo = this.dialogoBusqueda.getByRole('spinbutton', { name: 'Código' });
        this.filtroNombre = this.dialogoBusqueda.getByRole('textbox', { name: 'Nombre' });
        this.filtroTelefono = this.dialogoBusqueda.getByRole('textbox', { name: 'Teléfono' });
        this.filtroDireccion = this.dialogoBusqueda.getByRole('textbox', { name: 'Dirección' });
        this.filtroEstado = this.dialogoBusqueda.getByRole('textbox', { name: 'Estado' });
        this.filtroMatricula = this.dialogoBusqueda.getByRole('textbox', { name: 'Matrícula' });
        this.filtroFechaMatricula = this.dialogoBusqueda.getByRole('textbox', { name: 'Fecha de matrícula' });
        this.filtroInicioActividad = this.dialogoBusqueda.getByRole('textbox', { name: 'Inicio actividad' });
    }

    // --- Métodos: tabla principal ---

    celdaNombrePorCodigo(codigo) {
        return this.page.getByRole('row').filter({
            has: this.page.getByRole('gridcell', { name: codigo, exact: true }),
        }).getByRole('gridcell').nth(2);
    }

    async verificarEstablecimientoEnTabla(codigo) {
        await expect(
            this.page.getByRole('gridcell', { name: codigo, exact: true })
        ).toBeVisible({ timeout: 15000 });
    }

    async abrirEstablecimiento(nombre) {
        await this.page.getByRole('gridcell', { name: nombre, exact: true }).click();
        await this.page.waitForLoadState('networkidle', { timeout: 30000 });
    }

    // El formulario de Establecimientos no tiene botón "Cancelar" explícito.
    // Se navega de vuelta a la lista usando el botón del breadcrumb.
    async cancelar() {
        await this.btnBreadcrumbEstablecimientos.click();
        await Promise.race([
            this.page.getByRole('grid').waitFor({ state: 'visible', timeout: 15000 }),
            this.page.getByText('No existe información').waitFor({ state: 'visible', timeout: 15000 }),
        ]).catch(() => {});
    }

    // --- Métodos: menú contextual de la lista ---

    async abrirMenuLista() {
        await this.btnMenuLista.click();
        await this.page.getByRole('menu').waitFor({ state: 'visible', timeout: 10000 });
    }

    async irARegistrarActividades() {
        await this.abrirMenuLista();
        await this.menuItemRegistrarActividades.click();
        await this.page.waitForLoadState('networkidle', { timeout: 30000 });
    }

    // --- Métodos: formulario — tab Básica ---

    async seleccionarOpcionPlayArrow(btnTrigger, valor) {
        await expect(btnTrigger).toBeEnabled({ timeout: 15000 });
        await btnTrigger.click();
        await this.page.waitForSelector('mat-option', { state: 'visible', timeout: 15000 });
        await this.page.locator('mat-option', { hasText: valor }).first().click();
    }

    async seleccionarPais(pais) {
        await this.seleccionarOpcionPlayArrow(this.btnPais, pais);
    }

    async seleccionarDepartamento(departamento) {
        await this.seleccionarOpcionPlayArrow(this.btnDepartamento, departamento);
    }

    async seleccionarCiudad(ciudad) {
        await this.seleccionarOpcionPlayArrow(this.btnCiudad, ciudad);
    }

    async seleccionarBarrio(barrio) {
        await this.seleccionarOpcionPlayArrow(this.btnBarrio, barrio);
    }

    async seleccionarTipoLocal(tipoLocal) {
        await this.seleccionarOpcionPlayArrow(this.btnTipoLocal, tipoLocal);
    }

    async cerrarDatepickerSiAbierto() {
        // Espera breve para que Angular Material termine la animación de apertura del calendario
        // antes de verificar si está visible. 1000ms era insuficiente en algunos runs.
        const calendarVisible = await this.page.locator('mat-calendar').isVisible({ timeout: 3000 }).catch(() => false);
        if (calendarVisible) {
            await this.page.keyboard.press('Escape');
            await this.page.locator('mat-calendar').waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {});
        }
        // Verificar también el backdrop del overlay del datepicker
        const backdropVisible = await this.page.locator('.cdk-overlay-backdrop').isVisible({ timeout: 500 }).catch(() => false);
        if (backdropVisible) {
            await this.page.keyboard.press('Escape');
            await this.page.locator('.cdk-overlay-backdrop').waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {});
        }
    }

    async completarTabBasica(datos) {
        await this.inputNombre.fill(datos.nombre);
        await this.inputTelefono.fill(datos.telefono);
        if (datos.pais) await this.seleccionarPais(datos.pais);
        if (datos.departamento) await this.seleccionarDepartamento(datos.departamento);
        if (datos.ciudad) await this.seleccionarCiudad(datos.ciudad);
        if (datos.barrio) await this.seleccionarBarrio(datos.barrio);
        await this.inputDireccion.fill(datos.direccion);
        if (datos.tipoLocal) await this.seleccionarTipoLocal(datos.tipoLocal);
        if (datos.matriculaMercantil !== undefined) await this.inputMatriculaMercantil.fill(datos.matriculaMercantil);
        if (datos.fechaMatricula !== undefined) {
            await this.inputFechaMatricula.fill(datos.fechaMatricula);
            await this.inputFechaMatricula.press('Tab');
            await this.cerrarDatepickerSiAbierto();
        }
        await this.inputCorreoElectronico.fill(datos.correoElectronico);
        await this.inputInicioActividad.fill(datos.inicioActividad);
        await this.inputInicioActividad.press('Tab');
        await this.cerrarDatepickerSiAbierto();
    }

    // --- Métodos: formulario — tab Adicional ---

    async completarTabAdicional(datos) {
        await this.tabAdicional.click();
        if (datos.codigoCatastral !== undefined) await this.inputCodigoCatastral.fill(datos.codigoCatastral);
        if (datos.paginaWeb !== undefined) await this.inputPaginaWeb.fill(datos.paginaWeb);
        if (datos.codigoPostal !== undefined) await this.inputCodigoPostal.fill(datos.codigoPostal);
        if (datos.codigoAdicional !== undefined) await this.inputCodigoAdicional.fill(datos.codigoAdicional);
    }

    // --- Métodos: diálogo de filtro ---

    async completarFiltros(filtros) {
        await this.dialogoBusqueda.waitFor({ state: 'visible', timeout: 10000 });
        if (filtros.codigo !== undefined) await this.filtroCodigo.fill(filtros.codigo);
        if (filtros.nombre !== undefined) await this.filtroNombre.fill(filtros.nombre);
        if (filtros.telefono !== undefined) await this.filtroTelefono.fill(filtros.telefono);
        if (filtros.direccion !== undefined) await this.filtroDireccion.fill(filtros.direccion);
        if (filtros.estado !== undefined) await this.filtroEstado.fill(filtros.estado);
        if (filtros.matricula !== undefined) await this.filtroMatricula.fill(filtros.matricula);
        if (filtros.fechaMatricula !== undefined) await this.filtroFechaMatricula.fill(filtros.fechaMatricula);
        if (filtros.inicioActividad !== undefined) await this.filtroInicioActividad.fill(filtros.inicioActividad);
        await this.dialogoBusqueda.getByRole('button', { name: 'Aceptar' }).click();
        await this.page.waitForLoadState('networkidle', { timeout: 30000 });
    }
}
