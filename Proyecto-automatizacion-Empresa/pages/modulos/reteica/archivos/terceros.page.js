export class Terceros {
  constructor(page) {
    this.page = page;

    // --- Pestañas del formulario ---
    this.tabBasicos = page.getByRole('tab', { name: 'Basicos' });
    this.tabAdicionales = page.getByRole('tab', { name: 'Adicionales' });

    // ===========================================
    // PESTAÑA BÁSICOS
    // ===========================================
    this.inputNit = page.getByRole('textbox', { name: 'Nit' });

    this.comboTipoDocumento = page.getByRole('combobox', { name: 'Tipo de documento' });
    this.btnTipoDocumento = page.locator('mat-form-field').filter({ hasText: 'Tipo de documento' }).getByRole('button');

    this.inputCodigoEquivalente = page.getByRole('textbox', { name: 'Código equivalente' });
    this.inputCodigoRup = page.getByRole('textbox', { name: 'Código Rup' });
    this.inputCodigoProponente = page.getByRole('textbox', { name: 'Código proponente' });

    // Cámara de comercio — mat-select que abre modal de búsqueda con pestañas Datos/Filtros.
    this.selectCamaraComercio = page.getByRole('listbox', { name: 'Camara de comercio' });
    this.tabDatosModal = page.getByRole('tab', { name: 'Datos' });
    this.tabFiltrosModal = page.getByRole('tab', { name: 'Filtros' });
    this.inputNitFiltro = page.getByPlaceholder('Nit ');
    this.btnAplicarFiltro = page.getByRole('button', { name: 'Aplicar' });
    this.gridRazonSocial = (nombre) => page.getByRole('gridcell', { name: nombre });

    this.comboTipoContratista = page.getByRole('combobox', { name: 'Tipo contratista' });
    this.btnTipoContratista = page.locator('mat-form-field').filter({ hasText: 'Tipo contratista' }).getByRole('button');

    this.inputRazonSocial = page.getByRole('textbox', { name: 'Primer nombre / Razón social' });
    this.inputSegundoNombre = page.getByRole('textbox', { name: 'Segundo nombre' });
    this.inputPrimerApellido = page.getByRole('textbox', { name: 'Primer apellido' });
    this.inputSegundoApellido = page.getByRole('textbox', { name: 'Segundo apellido' });
    this.inputTipoAsociado = page.getByRole('textbox', { name: 'Tipo de asociado' });

    this.comboTipoRegimen = page.getByRole('combobox', { name: 'Tipo regimen' });
    this.btnTipoRegimen = page.locator('mat-form-field').filter({ hasText: 'Tipo regimen' }).getByRole('button');

    this.inputDireccion = page.getByRole('textbox', { name: 'Dirección' });
    this.inputTelefonos = page.getByRole('textbox', { name: 'Teléfonos' });
    this.inputFax = page.getByRole('textbox', { name: 'Fax' });

    // Naturaleza es campo requerido (*)
    this.comboNaturaleza = page.getByRole('combobox', { name: 'Naturaleza' });
    this.btnNaturaleza = page.locator('mat-form-field').filter({ hasText: 'Naturaleza' }).getByRole('button');

    this.checkAutoretenedor = page.getByRole('checkbox', { name: 'Autoretenedor' });
    this.checkClaseEntidadOficial = page.getByRole('checkbox', { name: 'Clase entidad oficial' });
    this.checkAplicaDescuento = page.getByRole('checkbox', { name: 'Aplica descuento' });

    // ===========================================
    // PESTAÑA ADICIONALES
    // ===========================================

    // País y Departamento tienen componente APP-COMBO con ID propio en el DOM
    // El botón play_arrow no tiene nombre ARIA, se localiza por texto de contenido
    this.comboPais = page.getByRole('combobox', { name: 'Pais' });
    this.btnPais = page.locator('#ID_PAIS').getByRole('button').filter({ hasText: 'play_arrow' });

    this.comboDepartamento = page.getByRole('combobox', { name: 'Departamento' });
    this.btnDepartamento = page.locator('#ID_DEPARTAMENTO').getByRole('button').filter({ hasText: 'play_arrow' });

    // Ciudad es campo requerido (*)
    this.comboCiudad = page.getByRole('combobox', { name: 'Ciudad' });
    this.btnCiudad = page.locator('mat-form-field').filter({ hasText: 'Ciudad' }).getByRole('button');

    this.inputTarjetaProfesional = page.getByRole('textbox', { name: 'Tarjeta profesional' });
    this.inputRegistroMercantil = page.getByRole('textbox', { name: 'Registro mercantil' });
    this.inputCargo = page.getByRole('textbox', { name: 'Cargo' });
    this.inputProfesion = page.getByRole('textbox', { name: 'Profesion', exact: true });

    this.comboUnidad = page.getByRole('combobox', { name: 'Unidad' });
    this.btnUnidad = page.locator('mat-form-field').filter({ hasText: 'Unidad' }).getByRole('button');

    this.comboGrado = page.getByRole('combobox', { name: 'Grado' });
    this.btnGrado = page.locator('mat-form-field').filter({ hasText: 'Grado' }).getByRole('button');

    this.inputCodigoIca = page.getByRole('textbox', { name: 'Código ICA' });
    this.inputCalificacionCamara = page.getByRole('spinbutton', { name: 'Calificación cámara comercio' });

    this.comboZona = page.getByRole('combobox', { name: 'Zona' });
    this.btnZona = page.locator('mat-form-field').filter({ hasText: 'Zona' }).getByRole('button');

    this.inputEmail = page.getByRole('textbox', { name: 'Direccion E-mail' });
    this.inputWeb = page.getByRole('textbox', { name: 'Direccion web' });
    this.inputDigitoVerificacion = page.getByRole('spinbutton', { name: 'Dígito de verificación' });
  }

  // --- Acciones ---

  async completarDatosBasicos(datos) {
    await this.tabBasicos.click();
    await this.inputNit.fill(datos.nit);
    // Tab dispara blur y el cálculo del dígito de verificación
    await this.inputNit.press('Tab');
    await this.btnTipoDocumento.click();
    await this.page.getByRole('option', { name: datos.tipoDocumento, exact: true }).click();
    await this.inputRazonSocial.fill(datos.razonSocial);
    if (datos.direccion) await this.inputDireccion.fill(datos.direccion);
    if (datos.telefonos) await this.inputTelefonos.fill(datos.telefonos);
    await this.btnTipoRegimen.click();
    await this.page.getByRole('option', { name: datos.tipoRegimen, exact: true }).click();
    await this.btnNaturaleza.click();
    await this.page.getByRole('option', { name: datos.naturaleza, exact: true }).click();
  }

  async completarDatosAdicionales(datos) {
    await this.tabAdicionales.click();
    await this.btnPais.click();
    await this.page.getByRole('option', { name: datos.pais, exact: true }).click();
    await this.btnDepartamento.click();
    await this.page.getByRole('option', { name: datos.departamento, exact: true }).click();
    await this.btnCiudad.click();
    await this.page.getByRole('option', { name: datos.ciudad, exact: true }).click();
    if (datos.email) await this.inputEmail.fill(datos.email);
    // Dígito de verificación es auto-calculado por el sistema al ingresar el NIT
  }

  async buscarCamaraComercio(datos) {
    await this.selectCamaraComercio.click();
    await this.tabFiltrosModal.click();
    await this.inputNitFiltro.fill(datos.nitFiltro);
    await this.btnAplicarFiltro.click();
    await this.tabDatosModal.click();
    await this.gridRazonSocial(datos.razonSocial).click();
  }
}
