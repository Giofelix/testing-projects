// Punto de entrada base para todos los tests.
// Solo expone paginaAutenticada (sin fixtures de datos).
//
// Tests que necesitan datos precreados deben importar el fixture específico:
//   contribuyentes + tercero:  fixtures/reteica/contribuyente.fixture.js
//   solo tercero:              fixtures/reteica/tercero.fixture.js

import { expect } from '@playwright/test';
import { test } from './auth.fixture.js';

export { test, expect };
