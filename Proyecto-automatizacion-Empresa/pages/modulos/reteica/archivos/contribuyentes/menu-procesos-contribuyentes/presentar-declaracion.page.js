import { expect } from '@playwright/test';

export class PresentarDeclaracion {
  constructor(page) {
    this.page = page;

    // === TAB PRINCIPAL ===
    this.tabAnioGravable           = page.getByRole('tab', { name: 'Año gravable' });
    this.tabEstablecimientos       = page.getByRole('tab', { name: 'Establecimientos' });
    this.tabLiquidacionConceptos   = page.getByRole('tab', { name: 'Liquidación de conceptos' });
    this.tabDeclaracion            = page.getByRole('tab', { name: 'Declaración' });

    // --- Sección 1: Año gravable ---
    this.comboAnio                 = page.getByRole('combobox', { name: 'Seleccione el año a declarar' });
    this.btnAnio                   = page.locator('mat-form-field').filter({ hasText: 'Seleccione el año a declarar' }).getByRole('button');

    this.comboPeriodo              = page.getByRole('combobox', { name: 'Período' });
    this.btnPeriodo                = page.locator('mat-form-field').filter({ hasText: 'Período' }).getByRole('button');

    this.comboTipoDeclaracion      = page.getByRole('combobox', { name: 'Tipo de declaración' });
    this.btnTipoDeclaracion        = page.locator('mat-form-field').filter({ hasText: 'Tipo de declaración' }).getByRole('button');

    this.inputFechaPresentacion    = page.getByRole('textbox', { name: 'Fecha de presentación' });
    this.btnCalendarioFecha        = page.locator('mat-form-field').filter({ hasText: 'Fecha de presentación' }).getByRole('button', { name: 'Open calendar' });

    this.checkEntidadPublica       = page.getByRole('checkbox', { name: 'Entidad publica u otros.' });

    this.btnSiguienteAnio          = page.getByRole('tabpanel', { name: 'Año gravable' }).getByRole('button', { name: 'Siguiente' });

    // Diálogo de confirmación (borrador existente)
    this.dialogoConfirmacion       = page.getByRole('dialog', { name: 'Confirmación' });
    this.btnConfirmarSi            = page.getByRole('button', { name: 'SI' });
    this.btnConfirmarNo            = page.getByRole('button', { name: 'NO' });

    // --- Sección 2: Establecimientos ---
    this.tabpanelEstablecimientos  = page.getByRole('tabpanel', { name: 'Establecimientos' });
    this.btnAgregarEstablecimiento = this.tabpanelEstablecimientos.getByRole('button').filter({ hasText: 'add' });

    // Columnas de la tabla de establecimientos
    this.colEstabCodigo            = page.getByRole('columnheader', { name: 'Código' });
    this.colEstabNombre            = page.getByRole('columnheader', { name: 'Nombre del establecimiento' });
    this.colEstabDireccion         = page.getByRole('columnheader', { name: 'Dirección' });
    this.colEstabTelefono          = page.getByRole('columnheader', { name: 'Teléfono' });
    this.colEstabFechaInscripcion  = page.getByRole('columnheader', { name: 'Fecha de inscripción' });

    // El stepper renderiza todos los botones en el DOM; el Siguiente del paso 1 tiene mat-raised-button (clase única).
    // Se excluye con :not(.mat-raised-button) y se toma el primero para obtener el del paso "Establecimientos".
    this.btnSiguienteEstablecimientos = page.locator('button.btnAceptar:not(.mat-raised-button)').filter({ hasText: 'Siguiente' }).first();

    // --- Sección 3: Liquidación de conceptos ---
    this.tabpanelLiquidacion       = page.getByRole('tabpanel', { name: 'Liquidación de conceptos' });

    // Los dos grupos de campos tienen los mismos placeholder/label.
    // Se distinguen por el atributo readonly del HTML nativo:
    //   - Panel izquierdo "Liquidación del sistema": readonly="true" (solo lectura)
    //   - Panel derecho "Liquidación": sin atributo readonly (editable)
    // Angular omite el atributo readonly cuando el binding [readonly]="false", por eso
    // :not([readonly]) es el selector correcto para los campos editables.

    // Sub-sección: Liquidación del sistema (solo lectura — atributo readonly presente)
    this.inputSistCompras           = this.tabpanelLiquidacion.locator('input[readonly][placeholder="COMPRAS"]');
    this.inputSistServicios         = this.tabpanelLiquidacion.locator('input[readonly][placeholder="SERVICIOS"]');
    this.inputSistIndustria         = this.tabpanelLiquidacion.locator('input[readonly][placeholder="INDUSTRIA"]');
    this.inputSistFinanciera        = this.tabpanelLiquidacion.locator('input[readonly][placeholder="FINANCIERA"]');
    this.inputSistAutoRetencionVentas   = this.tabpanelLiquidacion.locator('input[readonly][placeholder="AUTORETENCION VENTAS"]');
    this.inputSistAutoRetencionServicios = this.tabpanelLiquidacion.locator('input[readonly][placeholder="AUTORETENCION SERVICIOS"]');
    this.inputSistAutoRetencionOtros    = this.tabpanelLiquidacion.locator('input[readonly][placeholder="AUTORETENCION OTROS CONCEPTOS"]');
    this.inputSistTotalRetenciones  = this.tabpanelLiquidacion.locator('input[readonly][placeholder="TOTAL RETENCIONES"]');
    this.inputSistInteresMora       = this.tabpanelLiquidacion.locator('input[readonly][placeholder="INTERES DE MORA"]');
    this.inputSistExtemporaneidad   = this.tabpanelLiquidacion.locator('input[readonly][placeholder="EXTEMPORANEIDAD"]');
    this.inputSistTotalSaldoCargo   = this.tabpanelLiquidacion.locator('input[readonly][placeholder="TOTAL SALDO A CARGO"]');
    this.inputSistValorPagar        = this.tabpanelLiquidacion.locator('input[readonly][placeholder="VALOR A PAGAR"]');
    this.inputSistMasOtrasSanciones = this.tabpanelLiquidacion.locator('input[readonly][placeholder="MAS OTRAS SANCIONES"]');
    this.inputSistSancionCorreccion = this.tabpanelLiquidacion.locator('input[readonly][placeholder="SANCIÓN POR CORRECCIÓN"]');
    this.inputSistTotalSancion      = this.tabpanelLiquidacion.locator('input[readonly][placeholder="TOTAL SANCION"]');
    this.inputSistTotalPagar        = this.tabpanelLiquidacion.locator('input[readonly][placeholder="TOTAL A PAGAR"]');

    // Sub-sección: Liquidación (editable — sin atributo readonly)
    this.inputLiqCompras            = this.tabpanelLiquidacion.locator('input:not([readonly])[placeholder="COMPRAS"]');
    this.inputLiqServicios          = this.tabpanelLiquidacion.locator('input:not([readonly])[placeholder="SERVICIOS"]');
    this.inputLiqIndustria          = this.tabpanelLiquidacion.locator('input:not([readonly])[placeholder="INDUSTRIA"]');
    this.inputLiqFinanciera         = this.tabpanelLiquidacion.locator('input:not([readonly])[placeholder="FINANCIERA"]');
    this.inputLiqAutoRetencionVentas    = this.tabpanelLiquidacion.locator('input:not([readonly])[placeholder="AUTORETENCION VENTAS"]');
    this.inputLiqAutoRetencionServicios = this.tabpanelLiquidacion.locator('input:not([readonly])[placeholder="AUTORETENCION SERVICIOS"]');
    this.inputLiqAutoRetencionOtros     = this.tabpanelLiquidacion.locator('input:not([readonly])[placeholder="AUTORETENCION OTROS CONCEPTOS"]');
    this.inputLiqTotalRetenciones   = this.tabpanelLiquidacion.locator('input:not([readonly])[placeholder="TOTAL RETENCIONES"]');
    this.inputLiqInteresMora        = this.tabpanelLiquidacion.locator('input:not([readonly])[placeholder="INTERES DE MORA"]');
    this.inputLiqExtemporaneidad    = this.tabpanelLiquidacion.locator('input:not([readonly])[placeholder="EXTEMPORANEIDAD"]');
    this.inputLiqTotalSaldoCargo    = this.tabpanelLiquidacion.locator('input:not([readonly])[placeholder="TOTAL SALDO A CARGO"]');
    this.inputLiqValorPagar         = this.tabpanelLiquidacion.locator('input:not([readonly])[placeholder="VALOR A PAGAR"]');
    this.inputLiqMasOtrasSanciones  = this.tabpanelLiquidacion.locator('input:not([readonly])[placeholder="MAS OTRAS SANCIONES"]');
    this.inputLiqSancionCorreccion  = this.tabpanelLiquidacion.locator('input:not([readonly])[placeholder="SANCIÓN POR CORRECCIÓN"]');
    this.inputLiqTotalSancion       = this.tabpanelLiquidacion.locator('input:not([readonly])[placeholder="TOTAL SANCION"]');
    this.inputLiqTotalPagar         = this.tabpanelLiquidacion.locator('input:not([readonly])[placeholder="TOTAL A PAGAR"]');

    this.btnVolverLiquidacion       = this.tabpanelLiquidacion.getByRole('button', { name: 'Volver' });
    this.btnActualizarLiquidacion   = this.tabpanelLiquidacion.getByRole('button', { name: 'Actualizar' });
    this.btnSiguienteLiquidacion    = this.tabpanelLiquidacion.getByRole('button', { name: 'Siguiente' });

    // --- Sección 4: Declaración — Diálogo "Terceros asociados" ---
    this.dialogoTercerosAsociados   = page.getByRole('dialog').filter({ has: page.getByRole('heading', { name: 'Terceros asociados' }) });
    this.btnCerrarDialogo           = this.dialogoTercerosAsociados.getByRole('button').filter({ hasText: 'highlight_off' });

    // Sub-sección: Datos declarante
    this.comboDeclTipoDeclarante    = this.dialogoTercerosAsociados.getByRole('combobox', { name: 'Tipo declarante' });
    this.btnDeclTipoDeclarante      = this.dialogoTercerosAsociados.locator('mat-form-field').filter({ hasText: 'Tipo declarante' }).getByRole('button');

    // Nota: los dos "Tipo de documento", "Número de documento" y "Nombres" dentro del diálogo se
    // diferencian por orden DOM: nth(0) = declarante, nth(1) = contador/revisor
    this.comboDeclTipoDocumento     = this.dialogoTercerosAsociados.getByRole('combobox', { name: 'Tipo de documento' }).nth(0);
    this.btnDeclTipoDocumento       = this.dialogoTercerosAsociados.locator('mat-form-field').filter({ hasText: 'Tipo de documento' }).getByRole('button').nth(0);
    this.inputDeclNumeroDocumento   = this.dialogoTercerosAsociados.getByRole('textbox', { name: 'Número de documento' }).nth(0);
    this.inputDeclNombres           = this.dialogoTercerosAsociados.getByRole('textbox', { name: 'Nombres' }).nth(0);

    // Sub-sección: Datos contador o revisor
    this.radioContador              = this.dialogoTercerosAsociados.getByRole('radio', { name: 'Contador' });
    this.radioRevisor               = this.dialogoTercerosAsociados.getByRole('radio', { name: 'Revisor' });

    this.comboContTipoDocumento     = this.dialogoTercerosAsociados.getByRole('combobox', { name: 'Tipo de documento' }).nth(1);
    this.btnContTipoDocumento       = this.dialogoTercerosAsociados.locator('mat-form-field').filter({ hasText: 'Tipo de documento' }).getByRole('button').nth(1);
    this.inputContNumeroDocumento   = this.dialogoTercerosAsociados.getByRole('textbox', { name: 'Número de documento' }).nth(1);
    this.inputContNombres           = this.dialogoTercerosAsociados.getByRole('textbox', { name: 'Nombres' }).nth(1);
    this.inputContTarjetaProfesional = this.dialogoTercerosAsociados.getByRole('textbox', { name: 'Tarjeta profesional' });
    this.checkContIncluyeFirma      = this.dialogoTercerosAsociados.getByRole('checkbox', { name: 'Incluye firma' });

    this.btnGuardarDialogo          = this.dialogoTercerosAsociados.getByRole('button', { name: 'Guardar' });
    this.btnCerrarDialogoCerrar     = this.dialogoTercerosAsociados.getByRole('button', { name: 'Cerrar' });
  }

  // === ACCIONES ===

  async seleccionarOpcionPlayArrow(btnTrigger, valor) {
    await btnTrigger.click();
    await this.page.waitForSelector('mat-option', { state: 'visible', timeout: 10000 });
    await this.page.locator('mat-option', { hasText: valor }).first().click();
    // Esperar que el panel del mat-select (mat-select-panel) desaparezca del DOM
    // tras seleccionar una opción. En Angular Material, el panel se destruye al cerrar.
    await this.page.locator('mat-select-panel').waitFor({ state: 'detached', timeout: 8000 }).catch(() => {});
  }

  // --- Acciones: Sección 1 — Año gravable ---

  async completarSeccion1(datos) {
    await this.seleccionarOpcionPlayArrow(this.btnAnio, datos.anio);
    await this.seleccionarOpcionPlayArrow(this.btnPeriodo, datos.periodo);
    await this.seleccionarOpcionPlayArrow(this.btnTipoDeclaracion, datos.tipoDeclaracion);
    if (datos.fechaPresentacion) {
      // Si el campo ya tiene valor (pre-llenado automático por el sistema), no reescribir
      // a menos que esté vacío o deba sobreescribirse explícitamente (ej: tras responder SI
      // al diálogo de borrador — RN-03 — la fecha se vacía y debe re-diligenciarse)
      const valorActual = await this.inputFechaPresentacion.inputValue().catch(() => '');
      if (!valorActual.trim()) {
        // Campo vacío: escribir la fecha carácter a carácter.
        // NOTA: el click previo abre el datepicker; usamos pressSequentially sin click
        // apuntando directamente al input para no re-abrir el panel.
        await this.inputFechaPresentacion.pressSequentially(datos.fechaPresentacion, { delay: 80 });
        // Escape cierra el panel del datepicker y dispara blur/change en Angular Material
        await this.inputFechaPresentacion.press('Escape');
        // Esperar que el overlay del datepicker desaparezca del DOM
        await this.page.locator('mat-datepicker-content').waitFor({ state: 'detached', timeout: 5000 }).catch(() => {});
        // Segundo Tab para confirmar y mover foco fuera del campo (dispara validación Angular)
        await this.inputFechaPresentacion.press('Tab');
      } else {
        // Campo ya pre-llenado: Escape + Tab para cerrar cualquier panel abierto y validar
        await this.inputFechaPresentacion.press('Escape');
        await this.page.locator('mat-datepicker-content').waitFor({ state: 'detached', timeout: 3000 }).catch(() => {});
        await this.inputFechaPresentacion.press('Tab');
      }
    }
    if (datos.entidadPublica) await this.checkEntidadPublica.check();
  }

  async manejarDialogoConfirmacion(respuesta) {
    const dialogoVisible = await this.dialogoConfirmacion.isVisible().catch(() => false);
    if (dialogoVisible) {
      if (respuesta === 'SI') await this.btnConfirmarSi.click();
      else await this.btnConfirmarNo.click();
    }
  }

  async avanzarDesdeAnioGravable(datos, respuestaConfirmacion = 'NO') {
    await this.completarSeccion1(datos);
    await this.manejarDialogoConfirmacion(respuestaConfirmacion);
    await this.btnSiguienteAnio.waitFor({ state: 'visible', timeout: 10000 });
    await this.btnSiguienteAnio.click();
    await this.page.waitForLoadState('networkidle', { timeout: 30000 });
  }

  // --- Acciones: Sección 2 — Establecimientos ---

  async seleccionarEstablecimiento(nombreEstablecimiento) {
    await this.tabEstablecimientos.click();
    await this.page.getByRole('gridcell', { name: nombreEstablecimiento }).click();
  }

  async avanzarDesdeEstablecimientos() {
    await this.btnSiguienteEstablecimientos.click();
    await this.page.waitForLoadState('networkidle', { timeout: 30000 });
  }

  // --- Acciones: Sección 3 — Liquidación de conceptos ---

  async completarSeccion3(datos) {
    if (datos.compras !== undefined)             await this.inputLiqCompras.fill(datos.compras);
    if (datos.servicios !== undefined)           await this.inputLiqServicios.fill(datos.servicios);
    if (datos.industria !== undefined)           await this.inputLiqIndustria.fill(datos.industria);
    if (datos.financiera !== undefined)          await this.inputLiqFinanciera.fill(datos.financiera);
    if (datos.autoRetencionVentas !== undefined) await this.inputLiqAutoRetencionVentas.fill(datos.autoRetencionVentas);
    if (datos.autoRetencionServicios !== undefined) await this.inputLiqAutoRetencionServicios.fill(datos.autoRetencionServicios);
    if (datos.autoRetencionOtros !== undefined)  await this.inputLiqAutoRetencionOtros.fill(datos.autoRetencionOtros);
    if (datos.interesMora !== undefined)         await this.inputLiqInteresMora.fill(datos.interesMora);
    if (datos.extemporaneidad !== undefined)     await this.inputLiqExtemporaneidad.fill(datos.extemporaneidad);
    if (datos.masOtrasSanciones !== undefined)   await this.inputLiqMasOtrasSanciones.fill(datos.masOtrasSanciones);
    if (datos.sancionCorreccion !== undefined)   await this.inputLiqSancionCorreccion.fill(datos.sancionCorreccion);
  }

  async actualizarLiquidacion() {
    await this.btnActualizarLiquidacion.click();
    await this.page.waitForLoadState('networkidle', { timeout: 30000 });
  }

  async avanzarDesdeLiquidacion() {
    await this.btnSiguienteLiquidacion.click();
    await this.page.waitForLoadState('networkidle', { timeout: 30000 });
  }

  // --- Acciones: Sección 4 — Declaración (Diálogo Terceros asociados) ---

  async completarDatosDeclarante(datos) {
    await this.dialogoTercerosAsociados.waitFor({ state: 'visible', timeout: 15000 });
    if (datos.tipoDeclarante) await this.seleccionarOpcionPlayArrow(this.btnDeclTipoDeclarante, datos.tipoDeclarante);
    if (datos.tipoDocumento)  await this.seleccionarOpcionPlayArrow(this.btnDeclTipoDocumento, datos.tipoDocumento);
    if (datos.numeroDocumento !== undefined) await this.inputDeclNumeroDocumento.fill(datos.numeroDocumento);
    if (datos.nombres !== undefined)         await this.inputDeclNombres.fill(datos.nombres);
  }

  async completarDatosContadorRevisor(datos) {
    await this.dialogoTercerosAsociados.waitFor({ state: 'visible', timeout: 15000 });
    if (datos.tipo === 'Revisor') await this.radioRevisor.click();
    else await this.radioContador.click();
    if (datos.tipoDocumento)    await this.seleccionarOpcionPlayArrow(this.btnContTipoDocumento, datos.tipoDocumento);
    if (datos.numeroDocumento !== undefined) await this.inputContNumeroDocumento.fill(datos.numeroDocumento);
    if (datos.nombres !== undefined)         await this.inputContNombres.fill(datos.nombres);
    if (datos.tarjetaProfesional !== undefined) await this.inputContTarjetaProfesional.fill(datos.tarjetaProfesional);
    if (datos.incluyeFirma) await this.checkContIncluyeFirma.check();
  }

  async completarSeccion4(datos) {
    await this.dialogoTercerosAsociados.waitFor({ state: 'visible', timeout: 15000 });
    if (datos.declarante)       await this.completarDatosDeclarante(datos.declarante);
    if (datos.contadorRevisor)  await this.completarDatosContadorRevisor(datos.contadorRevisor);
  }

  async guardarTercerosAsociados() {
    await this.btnGuardarDialogo.click();
    await this.page.waitForLoadState('networkidle', { timeout: 30000 });
  }

  async cerrarTercerosAsociados() {
    await this.btnCerrarDialogoCerrar.click();
    await this.dialogoTercerosAsociados.waitFor({ state: 'hidden', timeout: 10000 });
  }

  // --- Flujo completo ---

  async completarFormulario(datos) {
    await this.avanzarDesdeAnioGravable(datos.seccion1, datos.respuestaConfirmacion);
    if (datos.seccion3) {
      await this.tabLiquidacionConceptos.click();
      await this.completarSeccion3(datos.seccion3);
      if (datos.actualizarLiquidacion) await this.actualizarLiquidacion();
    }
    await this.avanzarDesdeLiquidacion();
    if (datos.seccion4) await this.completarSeccion4(datos.seccion4);
  }

  // --- Verificaciones ---

  async verificarTabActiva(nombreTab) {
    await expect(this.page.getByRole('tab', { name: nombreTab })).toHaveAttribute('aria-selected', 'true');
  }

  async verificarDialogoTercerosVisible() {
    await expect(this.dialogoTercerosAsociados).toBeVisible({ timeout: 15000 });
  }

  async verificarValorLiquidacionSistema(campo, valorEsperado) {
    const mapa = {
      compras:              this.inputSistCompras,
      servicios:            this.inputSistServicios,
      industria:            this.inputSistIndustria,
      financiera:           this.inputSistFinanciera,
      autoRetencionVentas:  this.inputSistAutoRetencionVentas,
      autoRetencionServicios: this.inputSistAutoRetencionServicios,
      autoRetencionOtros:   this.inputSistAutoRetencionOtros,
      totalRetenciones:     this.inputSistTotalRetenciones,
      interesMora:          this.inputSistInteresMora,
      extemporaneidad:      this.inputSistExtemporaneidad,
      totalSaldoCargo:      this.inputSistTotalSaldoCargo,
      valorPagar:           this.inputSistValorPagar,
      masOtrasSanciones:    this.inputSistMasOtrasSanciones,
      sancionCorreccion:    this.inputSistSancionCorreccion,
      totalSancion:         this.inputSistTotalSancion,
      totalPagar:           this.inputSistTotalPagar,
    };
    await expect(mapa[campo]).toHaveValue(valorEsperado);
  }
}
