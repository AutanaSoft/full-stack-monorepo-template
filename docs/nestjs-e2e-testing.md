# Convención de pruebas E2E para la API NestJS

Este documento define cómo se diseñan, organizan y ejecutan las pruebas end-to-end (E2E) de
`apps/api`. Su propósito es comprobar el sistema que se entregará: rutas HTTP, bootstrap de NestJS,
validación, autorización cuando exista, casos de uso, Prisma, PostgreSQL, logging y ciclo de vida.

Las pruebas E2E no reemplazan las pruebas unitarias ni las de integración. Comprueban que los
componentes reales funcionan juntos desde la frontera HTTP hasta la persistencia real.

## Decisiones obligatorias

| Área          | Decisión                                                                                                       |
| ------------- | -------------------------------------------------------------------------------------------------------------- |
| Arranque      | La aplicación E2E usa el mismo `AppModule` y el mismo configurador de bootstrap que producción.                |
| Persistencia  | Las suites usan Prisma y una base PostgreSQL real, temporal y aislada.                                         |
| Flujos        | Cada prueba atraviesa endpoints HTTP públicos.                                                                 |
| Organización  | Cada funcionalidad tiene un orquestador E2E; cada endpoint tiene su propio archivo de pruebas.                 |
| Datos         | Los fixtures se crean mediante endpoints. Los seeds se reservan para estados no creables por HTTP.             |
| Sustituciones | No se usan mocks de datos, repositorios, servicios internos, Prisma, PostgreSQL, guards ni tokens preemitidos. |
| Contratos     | Cada resultado importante valida status, contrato público y ausencia de datos sensibles.                       |
| Lifecycle     | Solo el orquestador crea y cierra la aplicación, la base temporal y los recursos compartidos.                  |

## Estructura de archivos

La estructura sigue el árbol real de la API. El soporte compartido pertenece a
`apps/api/test/support` o `apps/api/test/fixtures`; las pruebas de una capacidad pertenecen a su
carpeta bajo `apps/api/test`.

```text
apps/api/
├── src/
│   └── users/
│       └── users.controller.ts
└── test/
    ├── support/
    │   ├── real-e2e-application.ts
    │   ├── e2e-environment.ts
    │   └── e2e-assertions.ts
    ├── fixtures/
    │   └── users.fixture.ts
    ├── users/
    │   ├── users.e2e-orchestrator.ts
    │   ├── create-user.e2e-spec.ts
    │   ├── list-users.e2e-spec.ts
    │   ├── find-user.e2e-spec.ts
    │   ├── get-user.e2e-spec.ts
    │   ├── update-user.e2e-spec.ts
    │   └── delete-user.e2e-spec.ts
    ├── health/
    │   ├── health.e2e-orchestrator.ts
    │   ├── live-health.e2e-spec.ts
    │   └── ready-health.e2e-spec.ts
    └── infrastructure/
        ├── infrastructure.e2e-orchestrator.ts
        ├── cors.e2e-spec.ts
        ├── errors.e2e-spec.ts
        ├── request-id.e2e-spec.ts
        ├── security-headers.e2e-spec.ts
        ├── swagger.e2e-spec.ts
        └── throttling.e2e-spec.ts
```

Un archivo `*.e2e-spec.ts` cubre una única ruta HTTP y sus variantes de éxito, validación, error,
seguridad y contrato. No debe mezclar varios endpoints no relacionados.

El nombre describe la operación pública, no una clase interna. Por ejemplo,
`create-user.e2e-spec.ts` prueba `POST /api/v1/users`; no prueba directamente un repositorio o un
caso de uso.

## Responsabilidades del orquestador

Cada funcionalidad tiene un orquestador, por ejemplo `users.e2e-orchestrator.ts`. Es el propietario
único de los recursos compartidos de esa funcionalidad:

1. Obtiene una aplicación E2E real y espera que el adaptador HTTP esté listo.
2. Entrega un contexto tipado a las suites de endpoints: aplicación, URL base, IDs o recursos
   creados por el flujo y utilidades de limpieza.
3. Registra las suites de endpoint de manera explícita.
4. Limpia recursos en orden inverso a su creación.
5. Cierra la aplicación mediante la única ruta de cierre del harness.

Las suites de endpoints no crean una segunda aplicación, no cierran la aplicación global y no
eliminan la base temporal. Solo crean y limpian los recursos que les pertenecen.

El contexto no debe ocultar estado mutable compartido. Cada caso debe crear sus propios datos o
declarar explícitamente la dependencia respecto de un paso previo del mismo flujo.

## Base PostgreSQL real y Prisma

Cada orquestador trabaja contra una base temporal exclusiva, con un nombre impredecible, por ejemplo
`e2e_<pid>_<uuid>`. La URL administrativa debe provenir de un entorno de prueba dedicado; nunca
puede ser una URL de desarrollo compartida ni de producción.

El lifecycle de la base es:

```text
1. Validar DATABASE_URL del entorno E2E.
2. Crear una base temporal aislada con una conexión administrativa.
3. Aplicar las migraciones reales mediante el comando de migración de Prisma.
4. Iniciar NestJS con la URL de esa base.
5. Ejecutar requests HTTP contra la aplicación.
6. Cerrar NestJS, Prisma, pool y transports.
7. Eliminar la base temporal y los directorios temporales de logs.
8. Restaurar el entorno original incluso si falla una prueba.
```

Prisma es el único mecanismo de acceso a datos desde la aplicación. Una herramienta PostgreSQL de
administración puede crear y eliminar la base temporal, porque esas operaciones ocurren fuera del
modelo de dominio y requieren privilegios de administración. No se permite SQL directo desde los
controladores, casos de uso o repositorios de la funcionalidad para sustituir Prisma.

## Datos de prueba y seeds

Los datos deben representar casos reales y respetar las invariantes de producción.

- Crear usuarios a través de `POST /users` cuando el endpoint exista.
- Obtener tokens mediante login real cuando Auth exista; no inyectar tokens preemitidos.
- Usar constantes válidas canónicas y fábricas que generen identidades únicas por prueba.
- Derivar cada payload inválido del payload válido y modificar únicamente el campo sometido a
  prueba.
- No mutar objetos de fixture compartidos entre casos.

Un seed se usa únicamente cuando la precondición no pueda construirse por un endpoint disponible.
Ejemplos: datos heredados, una cuenta en un estado administrativo no expuesto por la API o una
relación necesaria para probar una migración. El seed debe ejecutarse mediante Prisma después de las
migraciones y exclusivamente contra la base temporal de la suite.

Un seed no sustituye la creación de la base, las migraciones ni los flujos HTTP de creación de
datos.

## Prohibiciones de mocks en E2E

Las pruebas E2E de la API no deben reemplazar:

- `AppModule`, el bootstrap o el adaptador HTTP de producción.
- Controladores, guards, pipes, interceptores, filtros o servicios de aplicación.
- Repositorios, Prisma, PostgreSQL o la conexión de base de datos.
- Datos de dominio mediante objetos falsos o inserciones que eviten el flujo bajo prueba.
- Password hasher, autenticación, emisión de tokens o tokens preemitidos.
- Servicios propios de la aplicación.

Si en el futuro existe una dependencia fuera del proceso que no pueda ejecutarse de forma real en el
entorno automatizado, se debe diseñar un entorno de pruebas para esa dependencia. No se degrada una
prueba E2E a prueba de integración mediante un mock sin una decisión de arquitectura explícita.

## Aserciones por endpoint

Cada archivo de endpoint debe cubrir, según aplique:

1. El flujo exitoso y su status HTTP semántico.
2. El contrato Zod público de la respuesta.
3. Payloads inválidos y el contrato público de error.
4. Casos de ausencia, conflicto, autorización, limitación de solicitudes y otros errores definidos.
5. Cabeceras públicas relevantes, como `x-request-id`.
6. La ausencia explícita de passwords, hashes, tokens, secretos, campos internos y metadata no
   declarada.
7. El efecto observable posterior: por ejemplo, un usuario eliminado deja de aparecer en lectura,
   búsqueda y listado.

No se deben usar snapshots opacos como única verificación contractual. Se prefieren schemas públicos
y matchers estructurales para campos estables; los valores volátiles se validan por formato o
presencia.

## Pruebas de persistencia complementarias

Las garantías exclusivas de PostgreSQL se prueban además en integración contra una base real. Estas
pruebas no sustituyen los E2E HTTP.

```text
packages/database/test/integration/
└── user-persistence.spec.ts
```

Como mínimo deben probarse:

- UUID generado por PostgreSQL.
- Migraciones desde cero.
- Defaults de `status`, `role` y `verifiedAt`.
- Restricción única de email y de `LOWER(user_name)`.
- Escrituras concurrentes: un único éxito y conflictos controlados para los demás intentos.
- Trigger de `updatedAt`.
- Semántica de soft delete.

## Checklist de una nueva suite

- [ ] Existe un orquestador de la funcionalidad.
- [ ] Existe un archivo E2E por endpoint.
- [ ] La aplicación usa el bootstrap de producción.
- [ ] Prisma apunta a una base PostgreSQL temporal aislada.
- [ ] Se aplican las migraciones reales antes de iniciar la app.
- [ ] Los datos se crean por HTTP o mediante un seed justificado.
- [ ] No existen mocks de datos ni servicios internos.
- [ ] Cada resultado importante valida el contrato público y los campos prohibidos.
- [ ] El teardown cierra todos los recursos y elimina la base temporal incluso ante fallos.
- [ ] La suite se ejecuta con el comando E2E oficial del workspace.

## Alcance futuro

Cuando se implemente Auth, su orquestador seguirá esta misma convención y añadirá archivos por
endpoint para registro, login, verificación de email, recuperación y restablecimiento de contraseña.
Los tokens se obtendrán únicamente por los endpoints reales que los emitan y las pruebas verificarán
que nunca aparezcan en respuestas, logs o eventos donde el contrato no los permita.
