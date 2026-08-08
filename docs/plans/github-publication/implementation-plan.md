# Plan de publicación en GitHub: Full-Stack Monorepo Template

Este plan define las acciones necesarias para preparar y publicar el repositorio como un template
público de GitHub con el nombre `full-stack-monorepo-template`. La publicación debe comenzar con un
commit raíz de inicialización y no debe exponer la historia local de desarrollo que existe
actualmente en la rama `master`.

## Resultado esperado

Al terminar la ejecución del plan:

- El repositorio público se identificará como `full-stack-monorepo-template`.
- La metadata, documentación y configuración describirán un template full-stack reutilizable.
- El README explicará Next.js, NestJS, shadcn/ui, Turborepo, pnpm, PostgreSQL y los paquetes
  compartidos.
- No se publicarán secretos, archivos `.env` reales, artefactos generados ni configuraciones
  internas no aprobadas.
- La validación automática estará preparada para un clon limpio del repositorio.
- El primer commit de GitHub será:

  ```text
  chore(init): initialize full-stack monorepo template
  ```

- La rama local `master` conservará la historia actual como respaldo y no se publicará en el primer
  repositorio remoto.

## Estado actual

| Área                 | Estado observado                                                | Acción requerida                                                                                                           |
| -------------------- | --------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Identidad raíz       | `@autanasoft/monorepo-template`                                 | Alinear con `@autanasoft/full-stack-monorepo-template` si se confirma que el slug también será la identidad del workspace. |
| README               | Describe principalmente Next.js y shadcn/ui                     | Documentar todo el monorepo y el flujo de uso como template.                                                               |
| Aplicaciones         | `apps/web`, `apps/api` y `apps/app`                             | Explicar responsabilidades, puertos y comandos de cada aplicación.                                                         |
| Paquetes             | Contratos, database, UI y configuraciones compartidas           | Documentar dependencias y límites públicos.                                                                                |
| GitHub               | No existe `.github/` ni remote configurado                      | Crear la configuración pública y añadir el remote solo en la fase de publicación.                                          |
| Historial            | `master` contiene commits locales y comienza en `1be2cfe`       | Crear una rama huérfana para el primer snapshot público.                                                                   |
| Variables de entorno | `.env*` está ignorado; existen `.env` locales en API y database | Revisar sin publicar valores y crear ejemplos seguros.                                                                     |
| Licencia             | MIT con AutanaSoft como titular                                 | Verificar que README y metadata la referencien correctamente.                                                              |

## Estado de ejecución

### Completado localmente

- Se alineó la identidad raíz con `@autanasoft/full-stack-monorepo-template` y se añadieron keywords
  de descubrimiento.
- Se reescribió el README para cubrir aplicaciones, paquetes, requisitos, entorno, comandos, UI y
  uso como GitHub Template.
- Se añadieron ejemplos seguros en `apps/api/.env.example` y `packages/database/.env.example`.
- Se ajustaron las reglas de Markdownlint para excluir reportes internos de `.git/`.
- Se creó el workflow `.github/workflows/ci.yml` con calidad, tests unitarios y E2E con PostgreSQL.
- Se configuró Dependabot para revisar dependencias semanalmente y agrupar actualizaciones por tipo.
- Se añadió el hook `pre-push` de Husky mediante el comando raíz `pnpm verify`, incluyendo E2E.
- Se creó `CONTRIBUTING.md` y una plantilla de Pull Request.
- Se eliminaron prefijos temporales de pruebas asociados al nombre del producto anterior.
- Pasaron `pnpm install --frozen-lockfile`, `pnpm lint`, `pnpm typecheck`, `pnpm build`,
  `pnpm db:validate`, `pnpm exec turbo run test:unit` y `pnpm exec turbo run test:e2e`.

### Pendiente antes de publicar

- Owner confirmado: `AutanaSoft`, con el repositorio `full-stack-monorepo-template`.
- Se conservarán `AGENTS.md`, `.agents/`, `opencode.json`, `skills-lock.json` y `docs/`.
- Se eliminaron `.claude/` y `openspec/`; no formarán parte del primer commit público.
- Ejecutar una herramienta dedicada de secret scanning; `gitleaks` no está instalado en el entorno
  actual.
- Validar el workflow en GitHub; `actionlint` no está instalado localmente.
- Crear la rama huérfana `main`, el commit raíz, el remote y el primer push.
- Activar **Template repository**, protección de rama y required checks después del primer push.

## Alcance

### Incluido

- Identidad y metadata del template.
- README y documentación mínima para colaboradores y usuarios del template.
- Ejemplos seguros de variables de entorno.
- Revisión de archivos públicos e internos del repositorio.
- CI para instalación, calidad, compilación y pruebas.
- Plantillas básicas de GitHub cuando exista una política de mantenimiento definida.
- Auditoría de secretos, archivos ignorados y referencias al producto anterior.
- Inicialización del historial público en una rama `main` huérfana.
- Verificación desde un clon limpio.

### Fuera de alcance

- Cambios de comportamiento en las aplicaciones.
- Publicación de paquetes en npm.
- Despliegue de la API, la aplicación web o PostgreSQL.
- Migración de la historia local de `master` al repositorio público.
- Creación de commits o push durante la fase de diseño de este plan.
- Incorporación de servicios externos que no sean necesarios para la CI.

## Decisiones previas a la implementación

1. Confirmar el owner de GitHub. La URL esperada, si el owner es la organización de AutanaSoft, será
   `https://github.com/AutanaSoft/full-stack-monorepo-template`.
2. Confirmar que el repositorio será público y se marcará como **Template repository**.
3. Confirmar si `.agents/`, `AGENTS.md`, `openspec/`, `opencode.json` y `skills-lock.json` forman
   parte del template público o deben excluirse del snapshot inicial.
4. Confirmar los responsables que deben aparecer en `CODEOWNERS`, `SECURITY.md` o plantillas de
   issues. No se crearán contactos ficticios.
5. Mantener como decisión por defecto la publicación mediante una rama huérfana `main`, preservando
   `master` únicamente como respaldo local.

## Fases de implementación

### Fase 1: auditar el snapshot público

**Objetivo:** determinar exactamente qué archivos pueden formar parte del primer commit público.

**Archivos y áreas previstas:**

- Todo el contenido rastreado por Git.
- `.gitignore`.
- Archivos `.env` y archivos de ejemplo.
- `AGENTS.md`, `.agents/`, `.claude/`, `opencode.json`, `skills-lock.json`, `docs/` y `openspec/`.
- Historial local de `master`.

**Tareas:**

1. Revisar referencias a `airdashboard`, `airdashboard.net`, `@airdash` y otros nombres del producto
   original.
2. Confirmar que ningún `.env`, credential file, token, certificado privado o log local esté
   rastreado por Git.
3. Ejecutar una revisión de secretos sobre el snapshot y, cuando corresponda, sobre el historial que
   no será publicado.
4. Revisar el contenido de archivos generados, directorios temporales, logs, coberturas y artefactos
   locales.
5. Aplicar la decisión pública: conservar tooling reutilizable y `docs/`, eliminar `.claude/` y
   `openspec/`.
6. Registrar cualquier exclusión adicional en `.gitignore` únicamente cuando exista una razón
   verificable.

**Criterios de aceptación:**

- Cada archivo que vaya a entrar en el snapshot tiene un propósito público identificado.
- No existen secretos en el índice ni en los archivos que se publicarán.
- Las exclusiones no eliminan archivos fuente, documentación o configuración necesaria para usar el
  template.

### Fase 2: alinear la identidad del template

**Objetivo:** hacer que el nombre elegido sea consistente en la metadata y la documentación.

**Archivos previstos:**

- `package.json`.
- `README.md`.
- Manifiestos de `apps/*` y `packages/*` cuando contengan una descripción que deba corregirse.
- `pnpm-lock.yaml` si el cambio de nombre del workspace modifica el lockfile.
- `LICENSE`, únicamente para verificar consistencia con la identidad pública.

**Tareas:**

1. Cambiar el nombre raíz a `@autanasoft/full-stack-monorepo-template` si se confirma la alineación
   entre el nombre del paquete privado y el slug de GitHub.
2. Mantener `private: true` en el workspace raíz y en los paquetes que no deban publicarse en npm.
3. Alinear descripción, autor, licencia y keywords con el propósito de template full-stack.
4. Añadir metadata de repositorio, issues y homepage solo después de confirmar el owner y la URL
   definitiva.
5. Verificar que los imports y nombres de los paquetes compartidos continúen usando el namespace
   `@autanasoft/*`.
6. Confirmar que no quede una referencia pública que sugiera que el repositorio es únicamente un
   template de Next.js o un producto de AirDashboard.

**Criterios de aceptación:**

- El slug `full-stack-monorepo-template` aparece de forma consistente en los puntos públicos que
  corresponden.
- La metadata no promete paquetes publicados si todos permanecen privados.
- El workspace sigue resolviendo dependencias después de cualquier cambio de manifest.

### Fase 3: preparar documentación pública

**Objetivo:** permitir que una persona use el repositorio desde un clon limpio sin depender de
conocimiento local del proyecto.

**Archivos previstos:**

- `README.md`.
- `apps/api/README.md`.
- `apps/app/README.md`.
- `docs/api.md`.
- `docs/nestjs-e2e-testing.md`.
- `CONTRIBUTING.md`, si se confirma colaboración externa.
- `SECURITY.md`, con un canal real de reporte.
- `apps/api/.env.example` y otros ejemplos necesarios, sin credenciales reales.

**Contenido mínimo del README:**

1. Propósito del template y casos de uso esperados.
2. Stack y versiones mínimas: Node.js `>=20`, pnpm `10.33.4`, Next.js, NestJS, React, TypeScript,
   Turborepo, shadcn/ui y PostgreSQL.
3. Árbol resumido de `apps/`, `packages/` y `docs/`.
4. Requisitos locales y pasos de instalación.
5. Configuración de variables de entorno mediante ejemplos con placeholders.
6. Comandos de desarrollo, lint, typecheck, build, tests y migraciones.
7. Diferencia entre `apps/web`, `apps/api` y `apps/app`.
8. Uso de `pnpm dlx shadcn@latest` y ubicación de los componentes compartidos.
9. Requisitos adicionales de los E2E de API, incluyendo PostgreSQL y `psql`.
10. Instrucciones para crear un proyecto nuevo a partir de GitHub Template.
11. Licencia y atribución de AutanaSoft.

**Criterios de aceptación:**

- Los comandos documentados existen en los manifests o se justifican explícitamente.
- Los ejemplos no contienen contraseñas, tokens, URLs privadas ni configuraciones inseguras de
  producción.
- La documentación diferencia comandos ejecutados desde la raíz y desde un workspace.
- Markdown lint y Prettier no reportan problemas.

### Fase 4: configurar GitHub y CI

**Objetivo:** proporcionar controles básicos para que el repositorio público mantenga una calidad
reproducible.

**Archivos previstos:**

- `.github/workflows/ci.yml`.
- `.github/dependabot.yml`.
- `.github/pull_request_template.md`.
- `.github/ISSUE_TEMPLATE/`, solo con plantillas respaldadas por una política de mantenimiento.
- `.github/dependabot.yml`, si se decide mantener actualizaciones automatizadas.
- `CONTRIBUTING.md` y `SECURITY.md` cuando sean necesarios para los workflows.

**Tareas:**

1. Configurar instalación con `pnpm install --frozen-lockfile`.
2. Usar versiones de Node.js y pnpm compatibles con `package.json`.
3. Ejecutar en CI lint de código, lint de Markdown, typecheck y build.
4. Ejecutar las pruebas unitarias de API, aplicación standalone y paquetes aplicables.
5. Crear un job separado o una estrategia equivalente para los E2E que necesitan PostgreSQL real.
6. No incluir secretos de producción en variables del workflow; usar valores temporales y mínimos.
7. Mantener las acciones de GitHub fijadas a versiones revisadas durante la implementación.
8. Documentar en el README qué verificaciones ejecuta CI y cuáles requieren infraestructura local.

Dependabot revisará el ecosistema npm del workspace cada lunes a las 09:00 UTC, con un máximo de 10
Pull Requests abiertos y grupos separados para dependencias de producción y desarrollo.

**Criterios de aceptación:**

- Un Pull Request puede ejecutar las verificaciones sin depender del entorno del autor.
- Los E2E no comparten una base de datos persistente entre ejecuciones.
- Un fallo de instalación, calidad, compilación o test bloquea la validación del cambio.
- La CI no imprime secretos ni variables sensibles.

### Fase 5: ejecutar la verificación local completa

**Objetivo:** probar el snapshot antes de crear el commit raíz público.

**Comandos previstos:**

```bash
pnpm install --frozen-lockfile
pnpm lint
pnpm lint:md
pnpm typecheck
pnpm build
pnpm --filter api test
pnpm --filter api test:e2e
pnpm --filter app test
pnpm --filter app test:e2e
pnpm db:validate
pnpm db:generate
```

**Tareas:**

1. Ejecutar primero las validaciones que no requieren servicios externos.
2. Ejecutar los E2E con PostgreSQL temporal y las variables documentadas.
3. Revisar `git diff --check` y el estado completo del worktree.
4. Confirmar que el índice no incluye `.env`, `.tmp`, `coverage`, `dist`, `.next`, logs ni secretos.
5. Realizar una prueba desde un directorio limpio o un clon temporal del snapshot.
6. Registrar el comando real y su resultado; si una verificación no puede ejecutarse, documentar la
   razón y el riesgo residual.

**Criterios de aceptación:**

- Las validaciones aplicables pasan desde la raíz.
- Las limitaciones de infraestructura quedan documentadas y no se confunden con tests exitosos.
- El snapshot puede instalarse y compilarse sin archivos locales ignorados.

### Fase 6: crear el historial público inicial

**Objetivo:** cumplir el requisito de que el primer commit de GitHub sea una inicialización del
proyecto.

**Estrategia:**

1. Confirmar que todas las modificaciones de preparación están revisadas en `master` sin crear
   commits intermedios de publicación.
2. Crear una rama huérfana `main` a partir del snapshot final.
3. Limpiar el índice de la rama huérfana sin borrar el working tree.
4. Añadir únicamente los archivos aprobados para publicación.
5. Crear el commit raíz:

   ```text
   chore(init): initialize full-stack monorepo template
   ```

6. Verificar que el commit no tiene padre y que la rama `master` local sigue disponible.
7. No usar `git reset --hard`, `git checkout --` ni comandos destructivos para preparar el
   historial.

**Criterios de aceptación:**

- `main` contiene un único commit raíz antes del primer push.
- El commit contiene el snapshot completo e intencional del template.
- No se publican commits anteriores de `master`.
- El commit de inicialización incluye la documentación y configuración aprobadas.

### Fase 7: publicar y configurar el repositorio

**Objetivo:** crear la relación con GitHub y dejar el repositorio listo para colaboración.

**Acciones previstas:**

1. Crear el repositorio vacío con visibilidad pública y nombre `full-stack-monorepo-template`.
2. Añadir el remote `origin` usando la URL confirmada por el usuario.
3. Publicar `main` con seguimiento del remote.
4. Confirmar que el commit remoto es el commit raíz de inicialización.
5. Configurar descripción, topics, licencia visible y opción **Template repository**.
6. Definir `main` como rama predeterminada.
7. Configurar protección de rama y required checks cuando el workflow de CI esté validado.
8. Revisar Actions, Dependabot, seguridad, secret scanning y permisos de colaboración.

**Topics sugeridos:**

```text
monorepo
template
full-stack
nextjs
nestjs
turborepo
pnpm
shadcn-ui
typescript
postgresql
```

**Criterios de aceptación:**

- El repositorio remoto existe con el nombre y visibilidad acordados.
- El commit inicial remoto no tiene padre.
- La opción de usar el repositorio como template está disponible.
- El README se renderiza correctamente y los enlaces principales funcionan.

### Fase 8: validar desde un clon limpio

**Objetivo:** demostrar que la publicación es utilizable por una persona que no comparte el entorno
local del autor.

**Tareas:**

1. Clonar el repositorio en un directorio nuevo.
2. Instalar dependencias usando únicamente el lockfile publicado.
3. Configurar los ejemplos de entorno sin reutilizar archivos locales del repositorio original.
4. Ejecutar la ruta rápida documentada en el README.
5. Probar los comandos principales de web, API, aplicación standalone y calidad.
6. Verificar la creación de un proyecto derivado mediante la función de GitHub Template.
7. Registrar cualquier ajuste posterior como un commit separado posterior a la inicialización.

## Estrategia de commits

La publicación inicial tendrá una frontera distinta de la evolución posterior:

| Momento                 | Commit o acción                                        | Regla                                                                    |
| ----------------------- | ------------------------------------------------------ | ------------------------------------------------------------------------ |
| Preparación local       | Sin commit de publicación                              | Revisar cambios y mantener `master` como respaldo.                       |
| Primer commit de GitHub | `chore(init): initialize full-stack monorepo template` | Commit raíz con el snapshot público completo.                            |
| Cambios posteriores     | Conventional Commits por unidad de trabajo             | Incluir código, pruebas y documentación relacionadas en el mismo commit. |

No se debe publicar `master`, hacer force push ni crear commits vacíos para simular una
inicialización.

## Archivos principales afectados

- `package.json` - identidad, descripción y metadata del workspace.
- `README.md` - documentación principal para usuarios del template.
- `pnpm-lock.yaml` - solo si cambia como consecuencia de la metadata del workspace.
- `.gitignore` - protección de archivos locales y generados.
- `apps/api/README.md` - requisitos y ejecución de la API.
- `apps/app/README.md` - ejecución de la aplicación standalone.
- `apps/api/.env.example` - configuración segura de ejemplo.
- `CONTRIBUTING.md` - reglas de colaboración, si se aprueba.
- `SECURITY.md` - reporte de vulnerabilidades, con contacto real.
- `.github/workflows/ci.yml` - validación automática.
- `.github/pull_request_template.md` - checklist de revisión, si se aprueba.
- `.github/ISSUE_TEMPLATE/` - formularios o plantillas de issues, si se aprueba.
- `docs/plans/github-publication/implementation-plan.md` - este plan.

## Riesgos y mitigaciones

| Riesgo                                          | Mitigación                                                                                   |
| ----------------------------------------------- | -------------------------------------------------------------------------------------------- |
| Publicar secretos presentes en archivos locales | Revisar el índice, ejecutar secret scanning y publicar únicamente ejemplos con placeholders. |
| Exponer historia previa o referencias internas  | Usar rama huérfana y clasificar todo el snapshot antes del commit raíz.                      |
| README incompleto                               | Probar las instrucciones desde un clon limpio y mantener comandos verificables.              |
| CI inestable por PostgreSQL                     | Aislar los E2E en un job con servicio temporal y documentar sus requisitos.                  |
| Metadata que promete paquetes públicos          | Mantener `private: true` y describir el workspace como template, no como registry package.   |
| Crear contactos o políticas ficticias           | Añadir `SECURITY.md`, CODEOWNERS o issue templates solo con responsables confirmados.        |
| Reescritura accidental de cambios existentes    | Preservar `master` y evitar comandos destructivos durante la creación de `main`.             |

## Verificación final

- [x] Owner `AutanaSoft` y nombre `full-stack-monorepo-template` confirmados; falta crear el remote.
- [x] Nombre `full-stack-monorepo-template` aplicado en los puntos públicos necesarios.
- [x] Archivos internos clasificados: `docs/` se conserva; `.claude/` y `openspec/` se eliminan.
- [x] `.env` reales no están rastreados y los ejemplos públicos usan placeholders; falta secret
      scanning dedicado.
- [x] README completo y validado por Markdownlint y Prettier.
- [x] Ejemplos de entorno seguros y suficientes para API y database.
- [x] Lint, Markdown lint, typecheck, build, validación Prisma y tests ejecutados.
- [x] CI creada y validada sintácticamente por Prettier; falta ejecutarla en GitHub.
- [x] Dependabot configurado con ejecución semanal y grupos de dependencias.
- [x] Hook `pre-push` de Husky configurado mediante `pnpm verify`.
- [ ] Rama huérfana `main` creada sin borrar `master`.
- [ ] Commit raíz creado con el mensaje acordado.
- [ ] Remote configurado únicamente con la URL confirmada.
- [ ] Primer push verificado como commit raíz.
- [ ] Repositorio marcado como **Template repository**.
- [ ] Protección de rama y checks requeridos configurados después de validar CI.
