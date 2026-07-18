# automation-arqc

Suite de automatización E2E con Playwright para el Sistema de Gestión Tributaria "Pasto".

---

## Requisitos previos

| Herramienta | Versión mínima | Instalación |
|---|---|---|
| Node.js | 20 LTS | https://nodejs.org |
| Git | cualquiera | https://git-scm.com |
| Allure CLI | 2.x | `npm install -g allure-commandline` |

---

## Instalación

```bash
git clone http://172.16.1.225/sysman-automation/proyecto-automatizacion/automation-arqc.git
cd automation-arqc

npm ci
npx playwright install chromium
```

---

## Configuración de credenciales

```bash
# Copia la plantilla y rellena los valores reales
copy .env.example .env
```

Variables requeridas en `.env`:

| Variable | Descripción |
|---|---|
| `BASE_URL` | URL base de la aplicación |
| `USER_GENERIC` | Usuario para autenticación |
| `PASSWORD_UNIVERSAL` | Contraseña para autenticación |

---

## Sesión de autenticación

```bash
node playwright/global-setup.js
```

Crea `playwright/.auth/user.json` con la sesión guardada en `sessionStorage`.
- En local: se reutiliza si tiene menos de 8 horas de antigüedad.
- En CI: siempre se genera una sesión nueva.

---

## Comandos

```bash
npm run test              # Ejecutar todos los tests
npm run test:smoke        # Solo tests marcados @tagprueba
npm run test:login        # Suite de Login
npm run test:headed       # Con navegador visible
npm run ui                # Modo interactivo (UI de Playwright)
npm run test:debug        # Modo paso a paso
npm run report:generate   # Generar y abrir reporte Allure
npm run report:serve      # Servir reporte Allure existente
npm run report:pw         # Reporte HTML de Playwright
npm run pipeline          # Ejecutar tests + generar + abrir reporte Allure

# Ejecutar un archivo específico
npx playwright test suites/Reteica/terceros.spec.js

# Ejecutar por tag
npx playwright test --grep "@smoke"

# Solo tests de componente (una pantalla)
npx playwright test --grep "@componente"

# Solo flujos E2E (varios pasos, proceso real de usuario)
npx playwright test --grep "@e2e"
```

---

## Convención de suites de prueba

Los specs se organizan en dos niveles dentro de `suites/<Modulo>/`:

| Nivel | Carpeta | Nombre de archivo | Tag obligatorio | Cuándo usarlo |
|---|---|---|---|---|
| **Componente** | `suites/Reteica/` | `<modulo>.spec.js` | `@componente` | Test de una sola pantalla (CRUD básico) |
| **E2E / Flujo** | `suites/Reteica/e2e/` | `flujo-<proceso>.spec.js` | `@e2e` | Proceso real de usuario que cruza varias pantallas |

**Regla rápida:** ¿el test toca una sola pantalla? → va en la raíz del módulo. ¿Recorre varias pantallas para completar un proceso? → va en `e2e/` con prefijo `flujo-`.

```
suites/
└── Reteica/
    ├── terceros.spec.js                         # @componente — CRUD de una pantalla
    ├── contribuyentes.spec.js                   # @componente — CRUD de una pantalla
    └── e2e/
        └── flujo-declaracion-contribuyente.spec.js   # @e2e — proceso completo
```

Los specs E2E reutilizan los page objects existentes en `pages/modulos/` — no se crean pages nuevos salvo que el flujo pase por una pantalla aún no modelada.

---

## Estructura del proyecto

```
fixtures/
  index.js                         # Punto de entrada base: expone paginaAutenticada
  auth.fixture.js                  # Fixture de autenticación (inyecta sessionStorage)
  reteica/
    tercero.fixture.js             # Fixture con tercero precreado para Reteica
    contribuyente.fixture.js       # Fixture con contribuyente precreado para Reteica

pages/
  login/
    login.page.js                  # Flujo de login Angular (dos pasos con reintentos)
  common/
    menu-navegacion.js             # Navegación por acordeón de Angular Material
    acciones-crud.js               # Botones CRUD reutilizables (Agregar, Guardar, etc.)
    componentes-tabla.js           # Controles de tabla: filtro, paginación, selección
    acciones-declaracion-renta.js  # Acciones específicas para declaraciones de renta
  modulos/
    reteica/
      archivos/
        terceros.page.js           # POM completo del módulo Terceros
        conceptos.page.js          # POM del módulo Conceptos
        contribuyentes/
          contribuyentes.page.js                           # POM del módulo Contribuyentes
          menu-procesos-contribuyentes/
            establecimientos.page.js                       # POM subformulario Establecimientos
            presentar-declaracion.page.js                  # POM subformulario Declaración

suites/
  Login/
    pruebasHumo.spec.js            # Tests de humo de login y navegación (@tagprueba)
  Reteica/
    terceros.spec.js               # CRUD Terceros
    conceptos.spec.js              # CRUD Conceptos
    contribuyentes.spec.js         # CRUD Contribuyentes
    establecimientos.spec.js       # CRUD Establecimientos (subformulario)
  config-ambientes/
    ambientes.js                   # Mapa de configuración por entorno

specs/
  terceros-plan.md                         # Plan de pruebas – Terceros
  conceptos-plan.md                        # Plan de pruebas – Conceptos
  contribuyentes-plan.md                   # Plan de pruebas – Contribuyentes
  establecimientos-contribuyentes-plan.md  # Plan de pruebas – Establecimientos
  contribuyentes-doc.md                    # Documentación BDD – Contribuyentes
  establecimientos-contribuyentes-doc.md   # Documentación BDD – Establecimientos
  TC-TER-RETEICA-Terceros-Azure.md         # Casos exportados a Azure DevOps

playwright/
  global-setup.js        # Login único que cachea sessionStorage
  global-teardown.js     # Cierra sesión y elimina user.json al finalizar la suite
  .auth/
    user.json            # Sesión cacheada (gitignored)
```

---

## Configuración de Playwright

Parámetros clave de `playwright.config.js`:

| Parámetro | Valor |
|---|---|
| `testDir` | `./suites` |
| `timeout` | 240 000 ms |
| `navigationTimeout` | 120 000 ms |
| `actionTimeout` | 45 000 ms |
| `retries` | 2 en CI / 1 en local |
| `workers` | 2 en CI / 1 en local |
| `locale` | `es-ES` |
| `timezoneId` | `America/Bogota` |
| `trace / screenshot / video` | `retain-on-failure` |
| Navegador | Solo Chromium |

---

## Pipeline de CI/CD (Jenkins)

El proyecto incluye un `Jenkinsfile` que ejecuta la suite en Jenkins de forma parametrizada.

**Agente:** `automatico_196` · **Node:** `node20` · **Timeout:** 45 min

### Parámetros del pipeline

| Parámetro | Opciones / Tipo | Descripción |
|---|---|---|
| `TEST_SUITE` | `auto` / `smoke` / `regression` / `all` | Suite a ejecutar. `auto` decide según la rama. |
| `MODULE` | string | Módulo específico a filtrar por tag (ej: `login`). Vacío = todos. |
| `EXTRA_GREP` | string | Patrón `--grep` adicional. |
| `APP_BASE_URL` | string | URL base de la aplicación (por defecto la de producción). |

### Credenciales en Jenkins

Las credenciales **no** se almacenan en `.env` en CI — se inyectan desde el almacén de credenciales de Jenkins:

| Credential ID | Variable de entorno |
|---|---|
| `USER_GENERIC` | `USER_GENERIC` |
| `PASSWORD_UNIVERSAL` | `PASSWORD_UNIVERSAL` |

### Etapas del pipeline

1. **Limpiar Workspace** — borra artefactos de builds anteriores.
2. **Checkout SCM** — clona la rama correspondiente.
3. **Instalación de Dependencias** — `npm ci`.
4. **Preparación de Navegadores** — instala Chromium (usa caché en `/home/ubuntu/.cache/playwright-browsers`).
5. **Resolución de Filtros** — construye el patrón `--grep` según los parámetros.
6. **Ejecución de Pruebas** — corre Playwright (incluye `globalSetup`).
7. **Post** — genera reporte Allure y archiva artefactos (`playwright-report/`, `test-results/`).

---

## Reportes

Allure es el reporte principal. Playwright HTML queda como respaldo local.

```bash
# Local: generar y abrir
npm run report:generate

# Local: servir el último reporte generado
npm run report:serve

# En Jenkins: el reporte Allure queda disponible en el menú izquierdo del build.
# Los artefactos (screenshots, videos, traces) se descargan desde la sección "Build Artifacts".
```

Para inspeccionar un trace manualmente:

```bash
npx playwright show-trace test-results/<nombre-test>/trace.zip
```

---

## Repositorio

```
GitLab: http://172.16.1.225/sysman-automation/proyecto-automatizacion/automation-arqc
```
