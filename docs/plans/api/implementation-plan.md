# Plan de implementación de la API base

Este documento convierte los requisitos de [`docs/api.md`](../../api.md) en unidades de trabajo
incrementales para construir una API NestJS reutilizable, segura, observable y compartida por
`apps/web` y `apps/app` mediante contratos HTTP canónicos.

## Resultado esperado

Al terminar el plan, el repositorio tendrá:

- Una API REST con configuración centralizada y validada al iniciar.
- Contratos Zod de entrada y salida compartidos desde `packages/contracts`.
- DTO de NestJS derivados de esos contratos, sin duplicar esquemas ni tipos.
- OpenAPI generado a partir de los contratos que ejecuta la aplicación.
- CORS, Helmet y limitación de solicitudes configurables y seguros por defecto.
- Logging HTTP estructurado, correlación por solicitud y redacción centralizada.
- Archivos JSON independientes para eventos exactos `warn` y `error`.
- Errores públicos uniformes que no expongan detalles internos.
- Endpoints independientes de liveness y readiness.
- Una abstracción de Argon2 que no filtre la dependencia hacia los módulos de negocio.
- Un módulo CRUD de usuarios con contratos compartidos, persistencia PostgreSQL y representación
  pública segura.
- Un modelo persistido de usuario preparado para Auth, con estado, rol y verificación de correo sin
  exponer esos datos en el CRUD público.
- UUID generados por PostgreSQL, unicidad normalizada y eliminación lógica de usuarios.
- Prefijo global, versionado URI y cierre controlado.
- Pruebas unitarias, de persistencia, integración y E2E para infraestructura y usuarios.

## Alcance

### Incluido

- La infraestructura transversal requerida en `docs/api.md`.
- La creación del paquete `@autanasoft/contracts`.
- Un módulo mínimo de usuarios con creación, listado, búsqueda exacta, consulta por UUID,
  actualización parcial y eliminación lógica.
- El modelo Prisma, la migración PostgreSQL y las restricciones de integridad para usuarios.
- Integración de readiness con la conexión PostgreSQL existente.
- Contratos base para errores, paginación, filtros y ordenamiento reutilizables.
- Documentación de variables de entorno y decisiones operativas.

### Fuera de alcance

- Autenticación y autorización concretas.
- Roles, permisos, recuperación de contraseña y flujos de autenticación.
- Datos iniciales de usuarios y endpoints de restauración de eliminados.
- Redis, colas y servicios externos hasta que existan clientes reales.
- Rotación y retención de logs. Se preparará el límite de infraestructura para añadirlas sin tocar
  módulos de negocio, pero no se agregará otra dependencia sin una política operativa definida.
- Un SDK HTTP generado. Los consumidores usarán inicialmente los contratos compartidos.
- Despliegue, contenedores, métricas y tracing distribuido.

## Estado actual y brechas

| Área           | Estado actual                                                          | Brecha principal                                                                      |
| -------------- | ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| Bootstrap      | `main.ts` crea la aplicación, habilita shutdown hooks y escucha `PORT` | No configura prefijo, versión, CORS, Helmet, logger, pipes ni Swagger                 |
| Configuración  | `app.config.ts` valida `PORT` con Zod                                  | Faltan namespaces y variables para todos los componentes transversales                |
| Contratos      | No existe un paquete compartido                                        | Web, aplicación standalone y API no comparten contratos HTTP                          |
| Validación     | Zod solo valida el entorno                                             | No hay validación global de parámetros, consultas, cuerpos o respuestas               |
| OpenAPI        | No implementado                                                        | No existe documento ni endpoint configurable                                          |
| Seguridad HTTP | No implementada                                                        | Faltan Helmet, CORS seguro y rate limiting                                            |
| Logging        | Logger predeterminado de NestJS                                        | Faltan Pino, request ID, redacción y destinos de archivo                              |
| Errores        | Respuesta predeterminada de NestJS                                     | Falta contrato estable y filtro global                                                |
| Health checks  | No implementados                                                       | Faltan liveness, readiness y comprobación de PostgreSQL                               |
| Contraseñas    | No implementado                                                        | Falta puerto reutilizable y adaptador Argon2                                          |
| Persistencia   | `DatabaseProvider` conecta y cierra Prisma; schema sin modelos         | Faltan modelo, migración, repositorio de usuarios e indicador de readiness            |
| Usuarios       | No implementado                                                        | Faltan contratos, casos de uso, persistencia, endpoints y pruebas                     |
| Pruebas        | Existen pruebas de configuración, módulo, proveedor y endpoint raíz    | El E2E no utiliza el mismo bootstrap que producción y faltan escenarios transversales |

## Decisiones de arquitectura

### Propiedad de los contratos

`packages/contracts` será el propietario canónico de los contratos HTTP que cruzan procesos. El
paquete solo contendrá Zod, tipos inferidos y composición de esquemas; no importará NestJS, React,
Prisma ni reglas de negocio.

```text
packages/contracts/
├── package.json
├── tsconfig.json
├── src/
│   ├── common/
│   │   ├── error-response.contract.ts
│   │   ├── pagination.contract.ts
│   │   ├── request-id.contract.ts
│   │   └── index.ts
│   ├── users/
│   │   ├── create-user.contract.ts
│   │   ├── find-user-query.contract.ts
│   │   ├── list-users-query.contract.ts
│   │   ├── update-user.contract.ts
│   │   ├── user-id-params.contract.ts
│   │   ├── user-list-response.contract.ts
│   │   ├── user-response.contract.ts
│   │   └── index.ts
│   └── index.ts
└── test/
    └── package-contract.spec.ts
```

Cada archivo exportará conjuntamente el esquema y los tipos derivados:

```ts
export const UserResponseSchema = z.strictObject({
  id: z.uuid(),
  email: z.email(),
  userName: z.string(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export type UserResponse = z.infer<typeof UserResponseSchema>;
```

Reglas del límite compartido:

- Los esquemas representan el protocolo público, no entidades de Prisma.
- Los tipos se derivan del esquema; no se mantienen interfaces paralelas.
- Los esquemas de request y response tienen propietarios explícitos por funcionalidad.
- Los `transform` y `refine` no contienen lógica de negocio ni efectos secundarios.
- Las coerciones se limitan a fronteras donde HTTP entrega texto, por ejemplo query parameters.
- Los consumidores validan datos externos con `parse` o `safeParse`; un type assertion no sustituye
  la validación.
- El paquete expone subpaths estables para evitar importar archivos internos.

### DTO como adaptadores de NestJS

Los DTO permanecerán en `apps/api` y se derivarán de los esquemas compartidos con `createZodDto`. Su
única responsabilidad será adaptar el contrato a metadata, pipes, serialización y OpenAPI de NestJS.

```text
apps/api/src/users/
├── dto/
│   ├── create-user.dto.ts
│   ├── find-user-query.dto.ts
│   ├── list-users-query.dto.ts
│   ├── update-user.dto.ts
│   ├── user-id-params.dto.ts
│   ├── user-list-response.dto.ts
│   └── user-response.dto.ts
├── application/
├── domain/
├── infrastructure/
├── users.controller.ts
└── users.module.ts
```

No se crearán DTO manuales que repitan propiedades del esquema. Los controladores usarán DTO en la
frontera HTTP; servicios y casos de uso dependerán de tipos derivados o tipos propios de aplicación.

### Organización por funcionalidad

Los módulos se organizarán por capacidad, no por una capa técnica global. La infraestructura
transversal permanecerá en `common` y `config`:

```text
apps/api/src/
├── common/
│   ├── errors/
│   ├── http/
│   ├── logging/
│   └── security/
├── config/
├── database/
├── health/
├── password/
└── users/
```

El módulo `users` mantendrá sus límites internos explícitos:

- `domain`: entidad o modelo de aplicación, puertos y errores propios sin NestJS ni Prisma.
- `application`: casos de uso para crear, listar, buscar, obtener, actualizar y eliminar.
- `infrastructure`: repositorio Prisma y mapping entre registros persistidos y modelos internos.
- raíz HTTP del módulo: controller, DTO y transformación a representación pública.

No se crearán capas vacías por anticipado: cada carpeta aparecerá cuando contenga una
responsabilidad real de esta entrega.

### Respuestas REST

- Las respuestas exitosas devolverán el recurso o resultado directamente; no se impondrá un
  envoltorio `{ data: ... }` sin una necesidad de negocio.
- El listado de usuarios utilizará el contrato requerido `{ data, pagination }`; los componentes
  comunes de paginación se compondrán sin imponer otro nombre al payload público.
- La API usará códigos HTTP semánticos y evitará responder `200` para errores.
- Todas las respuestas de error usarán el contrato público uniforme.
- La serialización de respuestas validará que la salida cumpla el contrato declarado.

### Persistencia y normalización de usuarios

El modelo Prisma pertenecerá a `packages/database`, pero el repositorio concreto pertenecerá al
módulo de usuarios en `apps/api`. Así, `packages/database` conserva la infraestructura compartida y
el módulo controla sus consultas y reglas de aplicación.

- PostgreSQL generará `id` mediante `gen_random_uuid()`; la aplicación nunca aceptará ni generará el
  identificador al crear.
- `email` se almacenará trimmeado y en minúsculas, con restricción única sobre el valor normalizado.
- `userName` conservará el valor público; un índice único funcional sobre `LOWER(user_name)`
  garantizará su búsqueda y unicidad case-insensitive sin duplicar una columna normalizada.
- La normalización será una función pura compartida por creación, actualización y búsqueda exacta.
- Las comprobaciones previas mejorarán el mensaje, pero la restricción PostgreSQL será la autoridad
  ante condiciones de carrera.
- `passwordHash` será interno a persistencia y nunca formará parte de contratos HTTP.
- `status`, `role` y `verifiedAt` son datos internos preparados para Auth. PostgreSQL controla los
  defaults de estado y rol; `verifiedAt` inicia en `null` y una cuenta puede estar `ACTIVE` sin
  correo verificado.
- El CRUD público no expondrá `status`, `role`, `verifiedAt`, `passwordHash`, normalizaciones ni
  metadata de soft delete. Auth definirá posteriormente su propio puerto interno para consultar
  credenciales y estado de cuenta; no se añadirá ese límite antes de implementar el módulo.
- `deletedAt` implementará soft delete; todas las lecturas públicas filtrarán `deletedAt IS NULL`.
- `updatedAt` se actualizará de forma consistente mediante Prisma/PostgreSQL según la semántica
  verificada durante la migración.
- El mapper de respuesta seleccionará campos públicos de forma positiva; no eliminará campos
  sensibles de un objeto completo después de consultarlo.

### Configuración

Cada componente tendrá un factory namespaced en `apps/api/src/config`. `env.validation.ts` compondrá
los esquemas de variables de entorno y fallará antes de escuchar tráfico.

```text
apps/api/src/config/
├── app.config.ts
├── cors.config.ts
├── health.config.ts
├── helmet.config.ts
├── logger.config.ts
├── password.config.ts
├── rate-limit.config.ts
├── swagger.config.ts
└── env.validation.ts
```

Los módulos consumirán configuración mediante inyección de namespaces; no leerán `process.env`
directamente. La conexión de base de datos existente se migrará a configuración validada en una
unidad separada para eliminar su lectura directa de `DATABASE_URL`.

### Bootstrap reutilizable

La configuración que afecta tanto producción como E2E se extraerá de `main.ts` a una función de
aplicación explícita, por ejemplo `configureApplication(app)`. `main.ts` conservará la creación,
escucha y manejo del error fatal. Esto evita que las pruebas creen una aplicación con un pipeline
distinto al real.

## Variables de entorno propuestas

Los nombres definitivos se validarán durante cada unidad. La siguiente tabla establece el contrato
objetivo y los valores predeterminados permitidos.

| Variable                        | Tipo o formato                      | Valor seguro propuesto               | Regla                                                     |
| ------------------------------- | ----------------------------------- | ------------------------------------ | --------------------------------------------------------- |
| `NODE_ENV`                      | `development`, `test`, `production` | `development`                        | Controla defaults operativos, no reglas de negocio        |
| `PORT`                          | entero `0..65535`                   | `4001`                               | Se conserva el comportamiento actual                      |
| `API_PREFIX`                    | segmento de ruta                    | `api`                                | Sin `/` inicial o final                                   |
| `API_VERSION`                   | entero positivo como texto          | `1`                                  | Usado por versionado URI                                  |
| `CORS_ENABLED`                  | booleano explícito                  | `true`                               | Conversión Zod centralizada                               |
| `CORS_ORIGINS`                  | lista separada por comas            | Sin wildcard en producción           | Obligatoria en producción si CORS está activo             |
| `CORS_METHODS`                  | lista HTTP                          | Métodos REST explícitos              | Rechaza métodos desconocidos                              |
| `CORS_ALLOWED_HEADERS`          | lista                               | Lista mínima documentada             | Incluye `Content-Type`, `Authorization`, request ID       |
| `CORS_EXPOSED_HEADERS`          | lista                               | Request ID                           | Permite correlación en clientes web                       |
| `CORS_CREDENTIALS`              | booleano                            | `false`                              | Incompatible con origen wildcard                          |
| `CORS_MAX_AGE_SECONDS`          | entero no negativo                  | Valor conservador documentado        | Configura preflight                                       |
| `RATE_LIMIT_ENABLED`            | booleano                            | `true`                               | Desactivación explícita para pruebas o entorno controlado |
| `RATE_LIMIT_TTL_MS`             | entero positivo                     | Límite general documentado           | Unidad incluida en el nombre                              |
| `RATE_LIMIT_MAX`                | entero positivo                     | Límite general documentado           | No se codifica en controladores                           |
| `RATE_LIMIT_TRACKER`            | enum                                | `ip`                                 | Admite estrategias confiables implementadas               |
| `TRUST_PROXY`                   | booleano o hops validados           | `false`                              | Evita confiar en `X-Forwarded-For` por defecto            |
| `SWAGGER_ENABLED`               | booleano                            | Activo fuera de producción           | En producción requiere activación explícita               |
| `SWAGGER_PATH`                  | segmento de ruta                    | `docs`                               | No puede colisionar con el prefijo de recursos            |
| `LOG_LEVEL`                     | enum de Pino                        | Según entorno                        | Desarrollo `debug`, producción `info`, pruebas `silent`   |
| `LOG_FILES_ENABLED`             | booleano                            | `false` en pruebas                   | Controla archivos sin cambiar módulos                     |
| `LOG_DIRECTORY`                 | ruta                                | `logs`                               | Se resuelve y crea desde infraestructura                  |
| `LOG_WARN_FILE`                 | nombre de archivo                   | `warnings.log`                       | Solo nivel exacto `warn`                                  |
| `LOG_ERROR_FILE`                | nombre de archivo                   | `errors.log`                         | Solo nivel exacto `error`                                 |
| `REQUEST_ID_HEADER`             | nombre de header                    | `x-request-id`                       | Normalizado y validado                                    |
| `HEALTH_ENABLED`                | booleano                            | `true`                               | Permite desactivar endpoints en contextos especiales      |
| `HEALTH_DISK_PATH`              | ruta                                | Ruta de trabajo                      | Solo si se habilita indicador de disco                    |
| `HEALTH_DISK_THRESHOLD_PERCENT` | porcentaje                          | Umbral documentado                   | No ejecuta operaciones costosas                           |
| `ARGON2_MEMORY_COST`            | entero                              | Valor seguro revisado al implementar | Sin default débil                                         |
| `ARGON2_TIME_COST`              | entero                              | Valor seguro revisado al implementar | Centralizado                                              |
| `ARGON2_PARALLELISM`            | entero                              | Valor seguro revisado al implementar | Centralizado                                              |
| `DATABASE_URL`                  | URL PostgreSQL                      | Sin valor predeterminado             | Obligatoria cuando se crea la conexión real               |

Las listas admitirán espacios alrededor de comas, eliminarán entradas vacías y rechazarán una lista
que resulte vacía cuando sea obligatoria. Los booleanos no usarán coerción JavaScript genérica,
porque la cadena `"false"` no debe convertirse en `true`.

## Dependencias previstas

Antes de instalar se confirmarán las versiones compatibles con NestJS 11, Node.js 20 y Zod 4.

| Paquete             | Ubicación                                    | Propósito                                                     |
| ------------------- | -------------------------------------------- | ------------------------------------------------------------- |
| `zod`               | `packages/contracts` y consumidores directos | Esquemas y validación en runtime                              |
| `nestjs-zod`        | `apps/api`                                   | DTO derivados, pipe, serialización y limpieza de OpenAPI      |
| `@nestjs/swagger`   | `apps/api`                                   | Documento y UI OpenAPI                                        |
| `helmet`            | `apps/api`                                   | Cabeceras HTTP seguras                                        |
| `@nestjs/throttler` | `apps/api`                                   | Rate limiting global y por endpoint                           |
| `@nestjs/terminus`  | `apps/api`                                   | Health checks consistentes                                    |
| `pino`              | `apps/api`                                   | Logger estructurado y transportes                             |
| `nestjs-pino`       | `apps/api`                                   | Integración con NestJS y contexto por solicitud               |
| `pino-pretty`       | `apps/api`                                   | Consola legible en todos los entornos; dependencia de runtime |
| `argon2`            | `apps/api`                                   | Hash y verificación de contraseñas                            |

No se añadirá una segunda librería de OpenAPI para Zod si `nestjs-zod` cubre la generación
requerida. No se añadirá una librería de request ID: Node.js proporciona `crypto.randomUUID()` y
`nestjs-pino` permite definir `genReqId`.

## Fases de implementación

### Fase 1: crear el paquete de contratos compartidos

**Objetivo:** establecer un único propietario para el protocolo HTTP antes de crear DTO o
documentación.

**Archivos previstos:**

- `packages/contracts/package.json`
- `packages/contracts/tsconfig.json`
- `packages/contracts/src/index.ts`
- `packages/contracts/src/common/*.contract.ts`
- `packages/contracts/src/users/*.contract.ts`
- `packages/contracts/test/*.spec.ts`
- Manifiestos de `apps/api`, `apps/web` y `apps/app`
- `pnpm-lock.yaml`

**Tareas:**

1. Crear `@autanasoft/contracts` siguiendo el patrón de exports compilados de los paquetes actuales.
2. Declarar `zod` como dependencia directa del paquete propietario.
3. Definir contratos comunes para request ID, error y paginación.
4. Definir `CreateUserSchema`, `UpdateUserSchema`, `UserIdParamsSchema`, `FindUserQuerySchema`,
   `ListUsersQuerySchema`, `UserResponseSchema` y `UserListResponseSchema`.
5. Hacer estrictos los objetos de entrada para rechazar `id`, `passwordHash`, timestamps,
   `deletedAt` y cualquier propiedad desconocida.
6. Exigir al menos una propiedad en updates y exactamente uno entre `email` y `userName` en
   búsquedas.
7. Centralizar longitudes y caracteres permitidos de password y `userName` en schemas reutilizables
   por create y update.
8. Limitar paginación, campos de ordenamiento y dirección mediante enums explícitos.
9. Modelar fechas públicas como strings ISO y UUID como UUID válidos.
10. Exportar únicamente APIs públicas estables desde `src/index.ts` y subpaths documentados.
11. Añadir el paquete como dependencia workspace de los tres consumidores.
12. Probar inputs válidos, inválidos, campos desconocidos, refinements y defaults de paginación.
13. Añadir una prueba de contrato del manifest para impedir imports desde `src` o `dist` internos.

**Criterios de aceptación:**

- Ningún contrato compartido importa NestJS, Prisma, React o código de una aplicación.
- Cada tipo público se deriva de un esquema runtime.
- Los tres consumidores resuelven `@autanasoft/contracts` mediante su API pública.
- Build, typecheck y pruebas del paquete pasan de forma aislada.

### Fase 2: ampliar la configuración centralizada

**Objetivo:** validar toda decisión operativa antes de iniciar la aplicación.

**Archivos previstos:**

- `apps/api/src/config/*.config.ts`
- `apps/api/src/config/env.validation.ts`
- Pruebas `*.config.spec.ts` y `env.validation.spec.ts`
- `.env.example` o documento equivalente acordado para variables públicas

**Tareas:**

1. Mantener `appConfig` y ampliarlo con entorno, prefijo, versión y trust proxy.
2. Crear namespaces separados para CORS, Helmet, Swagger, logger, throttling, health y Argon2.
3. Componer sus shapes en `EnvValidationSchema` sin duplicar conversiones.
4. Implementar validaciones cruzadas, especialmente credenciales con wildcard CORS y Swagger en
   producción.
5. Validar rutas, headers, nombres de archivos, niveles y enums antes de construir proveedores.
6. Migrar `DATABASE_URL` a un namespace de database e inyectarlo en la factory de conexión.
7. Garantizar mensajes de inicio accionables sin imprimir valores secretos.
8. Cubrir defaults por entorno, variables faltantes, cadenas vacías y combinaciones inseguras.

**Criterios de aceptación:**

- No existe acceso directo nuevo a `process.env` fuera de factories de configuración.
- Configuración inválida impide el inicio antes de abrir el puerto o conectar recursos.
- Producción no permite cualquier origen por defecto.
- Las pruebas fijan unidades explícitas para ventanas y umbrales.

### Fase 3: unificar bootstrap, prefijo y versionado

**Objetivo:** usar exactamente el mismo pipeline de aplicación en producción y E2E.

**Archivos previstos:**

- `apps/api/src/main.ts`
- `apps/api/src/app.bootstrap.ts`
- `apps/api/src/app.bootstrap.spec.ts`
- `apps/api/test/app.e2e-spec.ts`

**Tareas:**

1. Extraer la configuración de `INestApplication` a una función comprobable.
2. Aplicar `setGlobalPrefix` desde configuración.
3. Habilitar `VersioningType.URI` con versión predeterminada centralizada.
4. Mantener `enableShutdownHooks()` en el límite de bootstrap.
5. Hacer que el E2E invoque el configurador real antes de `app.init()`.
6. Definir exclusiones explícitas del prefijo o versión solo si health u OpenAPI las requieren.
7. Registrar y finalizar correctamente errores fatales de bootstrap sin promesas ignoradas.

**Criterios de aceptación:**

- Los endpoints de usuarios responden bajo `/api/v1/users/...` con los valores predeterminados.
- Cambiar prefijo o versión mediante configuración cambia producción y E2E por igual.
- Las rutas antiguas no permanecen activas accidentalmente.
- El cierre de la aplicación ejecuta el lifecycle existente de la base de datos.

### Fase 4: integrar Zod con NestJS y OpenAPI

**Objetivo:** convertir los contratos compartidos en validación, serialización y documentación real.

**Archivos previstos:**

- `apps/api/src/common/http/zod-validation.module.ts` o providers equivalentes
- `apps/api/src/swagger/swagger.setup.ts`
- `apps/api/src/swagger/swagger.setup.spec.ts`
- `apps/api/src/app.module.ts`
- `apps/api/src/app.bootstrap.ts`

**Tareas:**

1. Instalar `nestjs-zod` y `@nestjs/swagger` en versiones compatibles.
2. Registrar `ZodValidationPipe` global mediante `APP_PIPE`.
3. Registrar `ZodSerializerInterceptor` global mediante `APP_INTERCEPTOR`.
4. Establecer el patrón para derivar DTO de request y response con `createZodDto` desde
   `@autanasoft/contracts`; los DTO concretos de usuarios se entregarán con su módulo.
5. Establecer helpers mínimos para declarar responses y códigos HTTP sin ocultar contratos.
6. Crear el documento con `SwaggerModule.createDocument` y procesarlo con `cleanupOpenApiDoc`.
7. Activar Swagger únicamente según configuración y montar la ruta configurable.
8. Añadir título, versión, descripción y mecanismos de autenticación vacíos o reales únicamente
   cuando correspondan; no documentar autenticación inexistente.
9. Probar activación, ruta y estructura base del JSON OpenAPI, no solo que cargue la UI.

**Criterios de aceptación:**

- Un payload inválido es rechazado por el mismo esquema publicado en OpenAPI.
- Una respuesta que viole su contrato falla de manera observable y no se entrega silenciosamente.
- Swagger puede desactivarse y cambiar de ruta sin modificar código.
- La integración queda preparada para que cada endpoint de usuarios publique el mismo contrato que
  valida en runtime.
- `apps/web` y `apps/app` pueden validar la respuesta con el mismo esquema.

### Fase 5: implementar request ID y logging estructurado

**Objetivo:** correlacionar cada solicitud y emitir logs útiles sin filtrar datos sensibles.

**Archivos previstos:**

- `apps/api/src/common/logging/logger.module.ts`
- `apps/api/src/common/logging/logger.options.ts`
- `apps/api/src/common/logging/request-id.ts`
- `apps/api/src/common/logging/file-transport.ts`
- Pruebas unitarias y E2E de logging
- `apps/api/src/main.ts`

**Tareas:**

1. Crear NestJS con `{ bufferLogs: true }` y sustituir el logger con `nestjs-pino`.
2. Definir `genReqId` para aceptar el header configurado solo si cumple longitud y caracteres
   permitidos; en otro caso generar `crypto.randomUUID()`.
3. Devolver siempre el ID efectivo en el header de respuesta.
4. Configurar logs HTTP con método, ruta normalizada, status, duración, ID e IP cuando trust proxy
   esté correctamente definido.
5. Mantener cuerpos fuera del logging automático.
6. Configurar redacción centralizada para authorization, cookies, tokens, contraseñas, API keys,
   hashes de contraseña, secretos, códigos de recuperación y campos sensibles anidados conocidos.
7. Usar `pino-pretty` exclusivamente en el destino de consola en desarrollo y producción.
8. Implementar destinos JSON no bloqueantes para archivos mediante un worker transport.
9. Filtrar por nivel exacto: `warnings.log` recibe solo `warn`; `errors.log`, solo `error`.
10. Crear el directorio de logs desde infraestructura y producir un fallo de inicio accionable si no
    se puede preparar cuando los archivos son obligatorios.
11. Añadir metadata común estable como servicio, entorno y versión; no incluir secretos.
12. Asegurar flush y cierre de transports durante shutdown.

**Criterios de aceptación:**

- Un request ID válido se conserva; uno inválido se reemplaza.
- El mismo ID aparece en logs, respuesta y contexto inyectable de la solicitud.
- `debug` e `info` nunca aparecen en archivos.
- Un evento `error` no se duplica en `warnings.log`.
- Los archivos contienen JSON line-delimited y la consola contiene salida pretty.
- Las pruebas capturan y verifican redacción sin escribir secretos reales en artefactos.

### Fase 6: aplicar Helmet y CORS seguro

**Objetivo:** establecer cabeceras y política cross-origin seguras antes de exponer recursos.

**Archivos previstos:**

- `apps/api/src/common/security/helmet.options.ts`
- `apps/api/src/common/security/cors.options.ts`
- `apps/api/src/app.bootstrap.ts`
- Pruebas unitarias y E2E de seguridad HTTP

**Tareas:**

1. Aplicar Helmet globalmente antes de registrar rutas.
2. Mantener defaults de Helmet y centralizar únicamente excepciones justificadas.
3. Evaluar la política CSP de Swagger sin debilitar globalmente la API; cualquier excepción será
   acotada y documentada.
4. Construir CORS desde configuración tipada: origins, methods, allowed headers, exposed headers,
   credentials y max age.
5. Rechazar wildcard con credenciales y wildcard implícito en producción.
6. Tratar requests sin `Origin` como clientes no-browser sin convertirlos en un bypass de política
   para navegadores.
7. Probar preflight permitido, origen rechazado, headers expuestos y combinación con credenciales.

**Criterios de aceptación:**

- Las respuestas incluyen cabeceras Helmet esperadas.
- Un origen no permitido no recibe cabeceras CORS de autorización.
- Producción falla al iniciar con una configuración CORS insegura.
- El request ID está disponible para JavaScript cuando se configura como exposed header.

### Fase 7: implementar rate limiting global y por endpoint

**Objetivo:** proteger la API por defecto sin codificar límites dentro de controladores.

**Archivos previstos:**

- `apps/api/src/common/security/rate-limit.module.ts`
- `apps/api/src/common/security/rate-limit.guard.ts`
- `apps/api/src/common/security/rate-limit.decorators.ts`
- `apps/api/src/app.module.ts`
- Pruebas unitarias y E2E de throttling

**Tareas:**

1. Registrar `ThrottlerModule` de forma asíncrona desde configuración.
2. Aplicar un guard global con `APP_GUARD`.
3. Implementar trackers permitidos de forma explícita; comenzar con IP y respetar proxy headers solo
   cuando `TRUST_PROXY` esté configurado.
4. Proporcionar decoradores semánticos de la aplicación para límites estrictos, ampliados y bypass,
   encapsulando los decoradores de la librería.
5. Mantener valores globales en configuración y valores específicos junto a la política de la
   operación, no como números dispersos en controladores.
6. Traducir el exceso de solicitudes al contrato estándar con status `429` y request ID.
7. Excluir o ajustar health checks para no convertir sondas del orquestador en falsos positivos.
8. Definir políticas específicas reutilizables para creación, búsqueda por identidad y actualización
   de contraseña, sin publicar límites numéricos en el controller.
9. Documentar que el storage en memoria solo sirve para una instancia; definir un adapter externo
   como requisito previo para despliegues horizontales.

**Criterios de aceptación:**

- El límite global puede activarse, desactivarse y ajustarse por configuración.
- Un endpoint puede reducir, ampliar o omitir el límite sin reimplementar el guard.
- La respuesta `429` cumple el esquema público de errores.
- IPs no confiables no pueden elegir libremente su tracker mediante headers reenviados.

### Fase 8: uniformar errores

**Objetivo:** exponer errores predecibles y registrar diagnóstico interno de forma segura.

**Archivos previstos:**

- `apps/api/src/common/errors/application-error.ts`
- `apps/api/src/common/errors/http-exception.filter.ts`
- `apps/api/src/common/errors/error-code.ts`
- Providers globales en `apps/api/src/app.module.ts`
- Pruebas unitarias y E2E de errores

**Contrato mínimo:**

```json
{
  "statusCode": 400,
  "code": "VALIDATION_FAILED",
  "message": "The request is invalid",
  "timestamp": "2026-08-02T00:00:00.000Z",
  "path": "/api/v1/users",
  "requestId": "..."
}
```

**Tareas:**

1. Definir un catálogo pequeño de códigos internos estables y extensible por módulos.
2. Crear un error de aplicación independiente del transporte para fallos esperados.
3. Implementar un filtro global que normalice excepciones HTTP, errores Zod, `429` y errores no
   controlados.
4. Mantener mensajes públicos seguros; detalles de validación solo se incluirán si su contrato y
   sensibilidad se acuerdan explícitamente.
5. Registrar stack y causa para errores internos, asociados al request ID.
6. No devolver stack, SQL, rutas internas, secretos ni mensajes crudos de dependencias.
7. Validar la propia respuesta de error contra `ErrorResponseSchema` en pruebas.

**Criterios de aceptación:**

- Los escenarios `400`, `404`, `429` y `500` comparten estructura.
- Producción nunca devuelve stack o causa interna.
- Un error desconocido se registra con contexto y responde con mensaje genérico.
- Timestamp, path y request ID están presentes y son válidos.

### Fase 9: añadir liveness y readiness

**Objetivo:** separar proceso activo de capacidad real para recibir tráfico.

**Archivos previstos:**

- `apps/api/src/health/health.module.ts`
- `apps/api/src/health/health.controller.ts`
- `apps/api/src/health/indicators/database.health.ts`
- Contratos health en `packages/contracts` si serán consumidos por aplicaciones
- Pruebas unitarias y E2E

**Tareas:**

1. Crear `GET /health/live` con una comprobación local ligera que no dependa de PostgreSQL.
2. Crear `GET /health/ready` con indicador de estado de inicialización y PostgreSQL.
3. Exponer desde el límite de database una operación de ping controlada, sin filtrar Prisma al
   módulo health.
4. Añadir indicadores ligeros de memoria y disco únicamente si su comportamiento es estable en los
   entornos soportados.
5. Definir timeouts cortos para dependencias; una sonda no puede quedar esperando indefinidamente.
6. Mantener formato Terminus consistente y documentarlo en OpenAPI cuando Swagger esté activo.
7. Excluir health del ruido de auto-logging o reducir su nivel sin perder errores.
8. Preparar composición futura de Redis y servicios externos mediante providers de indicadores.

**Criterios de aceptación:**

- Liveness responde aunque PostgreSQL no esté disponible.
- Readiness falla de manera rápida y explícita cuando PostgreSQL no está disponible.
- Ninguna sonda ejecuta consultas de negocio ni operaciones costosas.
- Los endpoints funcionan con la estrategia acordada de prefijo/versionado y tienen tests de ruta.

### Fase 10: encapsular Argon2

**Objetivo:** proporcionar hashing reutilizable sin acoplar negocio a la librería criptográfica.

**Archivos previstos:**

- `apps/api/src/password/password.module.ts`
- `apps/api/src/password/password-hasher.ts`
- `apps/api/src/password/argon2-password-hasher.ts`
- `apps/api/src/password/password.tokens.ts`
- Pruebas unitarias del contrato y adaptador

**Tareas:**

1. Definir un puerto `PasswordHasher` con `hash` y `verify`.
2. Exponerlo mediante un token de inyección estable.
3. Implementar el adaptador Argon2 con parámetros inyectados desde configuración.
4. Elegir Argon2id y parámetros seguros basados en la versión y recomendaciones vigentes al
   implementar; documentar el costo esperado del hardware objetivo.
5. Permitir reconocer hashes que requieran rehash sin obligar a los módulos a interpretar el formato
   Argon2.
6. Verificar que errores y logs nunca incluyan contraseña ni hash completo.
7. Usar valores de prueba de menor costo únicamente mediante configuración de test explícita.

**Criterios de aceptación:**

- Los módulos consumidores dependen del puerto, no de `argon2`.
- Hashes de la misma contraseña son distintos y ambos verifican correctamente.
- Contraseñas incorrectas no verifican y entradas inválidas se manejan sin filtrar datos.
- Los parámetros de producción no se sustituyen accidentalmente por los de pruebas.

### Fase 11: modelar y migrar usuarios en PostgreSQL

**Objetivo:** establecer la integridad de usuarios en la base de datos antes de implementar casos de
uso HTTP.

**Archivos previstos:**

- `packages/database/prisma/schema.prisma`
- `packages/database/prisma/models/user.prisma` o ubicación soportada por la composición acordada
- `packages/database/prisma/migrations/<timestamp>_create_users/migration.sql`
- Código Prisma generado por el flujo existente
- `packages/database/test/user-schema.spec.ts`
- Pruebas de integración PostgreSQL del modelo

**Tareas:**

1. Definir el modelo `User` con `id`, `email`, `userName`, `passwordHash`, `status`, `role`,
   `verifiedAt`, `createdAt`, `updatedAt` y `deletedAt`.
2. Mapear nombres camelCase a columnas PostgreSQL snake_case sin filtrar estos nombres a contratos.
3. Configurar `id` como UUID nativo con default equivalente a `gen_random_uuid()`; no usar UUID
   generado por Prisma o la aplicación.
4. Garantizar en la migración la función requerida por `gen_random_uuid()` de forma compatible con
   la versión mínima de PostgreSQL soportada.
5. Añadir restricciones únicas para el email normalizado y para `LOWER(user_name)`, sin almacenar
   una columna `normalizedUserName` redundante.
6. Añadir solo los índices que soporten consultas por UUID, identidades y listados activos.
7. Definir timestamps con zona horaria y verificar la semántica real de `updatedAt` en updates.
8. Generar Prisma Client mediante los scripts existentes y consumirlo solo por la API pública de
   `@autanasoft/database`.
9. Probar con PostgreSQL real que se generan UUID y defaults de Auth, ambas unicidades resisten
   concurrencia, `verifiedAt` inicia en `null` y `deletedAt` permite filtrar registros activos.
10. No editar una migración ya aplicada en ambientes compartidos; cualquier corrección posterior
    deberá ser una migración nueva.

**Criterios de aceptación:**

- Insertar sin `id` produce un UUID válido generado por PostgreSQL, `status` y `role` reciben sus
  defaults y `verifiedAt` es `null`.
- La base rechaza duplicados de email y nombre de usuario case-insensitive incluso con escrituras
  concurrentes.
- `password_hash` es obligatorio y nunca se define como contraseña en texto plano.
- Los nombres de columnas y tipos coinciden con `docs/api.md`.
- Prisma generate, validate, build y pruebas del paquete database pasan.

### Fase 12: implementar el módulo CRUD de usuarios

**Objetivo:** entregar una funcionalidad vertical completa con controladores delgados, casos de uso,
repositorio desacoplado y respuestas públicas validadas.

**Archivos previstos:**

- `apps/api/src/users/users.module.ts`
- `apps/api/src/users/users.controller.ts`
- `apps/api/src/users/dto/*.dto.ts`
- `apps/api/src/users/domain/user.ts`
- `apps/api/src/users/domain/user.repository.ts`
- `apps/api/src/users/application/*.use-case.ts`
- `apps/api/src/users/infrastructure/prisma-user.repository.ts`
- `apps/api/src/users/user-response.mapper.ts`
- Pruebas unitarias, de repositorio, integración y `apps/api/test/users.e2e-spec.ts`

**Tareas de dominio y aplicación:**

1. Mantener la representación pública separada del modelo persistido que incluye `passwordHash`,
   `status`, `role`, `verifiedAt` y normalización. El puerto interno de credenciales se definirá con
   Auth, no como parte de este CRUD público.
2. Definir `UserRepository` con operaciones por UUID, identidades normalizadas, listado paginado,
   create, update y soft delete.
3. Implementar funciones puras y probadas para normalizar email y `userName`; conservar el nombre
   público y consultar por su valor normalizado.
4. Implementar casos de uso para crear, listar, buscar, obtener, actualizar y eliminar.
5. Inyectar `PasswordHasher`; creación y cambio de contraseña nunca importarán `argon2`.
6. Mapear errores esperados a códigos internos: usuario no encontrado, email duplicado y nombre
   duplicado.
7. Traducir violaciones únicas devueltas por PostgreSQL/Prisma para cubrir condiciones de carrera,
   sin exponer metadata del ORM.
8. Seleccionar campos públicos de forma positiva y convertir fechas a ISO en un mapper único.

**Tareas de acceso a datos:**

1. Implementar `PrismaUserRepository` usando la conexión inyectada existente.
2. Aplicar `deletedAt: null` en find by id, find by identity, list y updates públicos.
3. Implementar búsqueda exacta exclusivamente por email o nombre normalizados; prohibir `contains`,
   `startsWith`, `endsWith` y regex.
4. Implementar listado con `page`, `limit` máximo, sort field allowlist, dirección y conteo total.
5. Mantener consistencia suficiente entre data y count, documentando si requiere transacción.
6. Implementar soft delete con una respuesta uniforme para usuario ausente o ya eliminado.
7. Evitar seleccionar `passwordHash` cuando el caso de uso solo construye una respuesta pública.

**Tareas HTTP:**

1. Implementar `POST /users` con `201 Created` y `UserResponse`.
2. Implementar `GET /users` con `UserListResponse`, paginación y ordenamiento permitido.
3. Declarar `GET /users/search` antes de `GET /users/:id` y exigir exactamente un criterio.
4. Implementar `GET /users/:id` con validación UUID y `404` para usuario ausente o eliminado.
5. Implementar `PATCH /users/:id`, exigir una propiedad y rehashear solo si llega `password`.
6. Implementar `DELETE /users/:id` con soft delete y `204 No Content` sin body.
7. Aplicar DTO Zod de params, query, body y response en todos los límites.
8. Aplicar rate limiting específico a creación, búsqueda y cambio de contraseña.
9. Registrar operación, resultado, request ID e ID de usuario cuando exista; nunca body, password,
   hash, email o nombre usados como criterio.
10. Documentar en OpenAPI parámetros, paginación, reglas de búsqueda, unicidad y respuestas `201`,
    `204`, `400`, `404`, `409`, `429` y `500` aplicables.
11. Dejar puntos de extensión para guards y permisos sin introducir autenticación ficticia.

**Criterios de aceptación:**

- Los seis endpoints cumplen rutas, status codes y contratos de `docs/api.md`.
- Create y update normalizan identidades, gestionan conflictos y nunca persisten password plano.
- Search acepta exactamente un criterio, realiza match exacto y no devuelve eliminados.
- List limita el tamaño de página, permite solo campos seguros y devuelve metadata completa.
- Todas las respuestas excluyen password, hash, normalización y soft-delete metadata.
- Delete responde `204` sin contenido y el usuario desaparece de todas las lecturas públicas.
- Los controladores solo validan y delegan; no acceden a Prisma, Argon2 ni normalización.

### Fase 13: endurecer cierre, documentación y suite E2E

**Objetivo:** demostrar que todos los componentes operan juntos y pueden cerrarse limpiamente.

**Archivos previstos:**

- `apps/api/test/*.e2e-spec.ts`
- `apps/api/src/**/*.spec.ts`
- Documentación de ejecución y configuración de la API
- Scripts de package solo si falta una verificación enfocada

**Tareas:**

1. Probar el pipeline completo con la misma función de bootstrap de producción.
2. Verificar cierre de database y transports del logger.
3. Probar Swagger activo e inactivo, prefijo, versión, CORS, Helmet, request ID, errores,
   throttling, health y los seis endpoints de usuarios.
4. Evitar puertos fijos en E2E, crear una base PostgreSQL temporal por suite, aplicar las
   migraciones reales y aislar filesystem de logs en directorios temporales del proyecto.
5. Mantener determinismo: reloj, UUID, logger y database serán reemplazables en pruebas donde sea
   necesario.
6. Documentar variables, defaults, ejemplos seguros y comandos de ejecución.
7. Revisar que los ejemplos no contengan secretos ni configuraciones de producción inseguras.
8. Ejecutar el conjunto completo de verificaciones del monorepo.
9. Aplicar migraciones desde cero contra PostgreSQL de prueba y verificar UUID, defaults de Auth,
   unicidad normalizada mediante `LOWER(user_name)`, concurrencia y soft delete.

**Criterios de aceptación:**

- Todas las capacidades de `docs/api.md` tienen prueba o justificación explícita.
- No quedan handles abiertos después de E2E.
- La cobertura global conserva los umbrales configurados de 80 %.
- Build, lint, typecheck y tests pasan desde la raíz.
- Los logs y errores E2E no contienen passwords, hashes ni criterios sensibles de búsqueda.

## Estrategia de pruebas

| Nivel              | Qué demuestra                                                | Ejemplos                                             |
| ------------------ | ------------------------------------------------------------ | ---------------------------------------------------- |
| Contrato           | El protocolo acepta y rechaza datos correctamente            | Zod schemas, composición, unknown keys               |
| Unidad             | Una política aislada es correcta                             | parsing de env, request ID, redacción, error mapping |
| Integración NestJS | Providers y lifecycle están conectados                       | módulos, guards, filtros, interceptores, shutdown    |
| Persistencia       | PostgreSQL hace cumplir integridad y semántica               | UUID, unique, mapping, soft delete, paginación       |
| E2E HTTP           | El comportamiento observable coincide con el contrato        | CRUD users, status, headers, CORS, 429, health       |
| Operativa          | Recursos y destinos funcionan sin bloquear o quedar abiertos | files de log, flush, cierre de DB                    |

Principios de la suite:

- Las pruebas de contrato viven con `packages/contracts`.
- Las pruebas de infraestructura viven junto a su implementación.
- Cada comportamiento se entrega con sus pruebas en la misma unidad de trabajo.
- E2E ejecuta la aplicación, Prisma y PostgreSQL reales en una base temporal aislada; no sustituye
  datos ni servicios propios de la aplicación. Los fixtures se crean mediante endpoints HTTP cuando
  el flujo lo permite.
- Los seeds se reservan para datos iniciales conocidos que un escenario no pueda crear a través de
  la API; no sustituyen las migraciones ni el aislamiento de la base de datos E2E.
- Al menos una prueba separada valida readiness contra un adapter de database controlado.
- Las pruebas unitarias de casos de uso usan `UserRepository` y `PasswordHasher` falsos; no simulan
  detalles de Prisma o Argon2.
- Las restricciones que solo PostgreSQL puede garantizar se prueban contra PostgreSQL real.
- E2E cubre rutas felices y la matriz `400`, `404`, `409`, `429`, además de ausencia de campos
  sensibles.
- Los snapshots de OpenAPI, si se usan, deben ser pequeños y revisables; se prefieren assertions
  semánticas sobre paths y schemas críticos.

## Verificación por unidad

Cada fase debe ejecutar primero comandos enfocados y después la validación afectada del monorepo.
Los nombres de filtros se ajustarán al manifest final del paquete.

```bash
pnpm --filter @autanasoft/contracts typecheck
pnpm --filter @autanasoft/contracts test
pnpm --filter @autanasoft/database db:validate
pnpm --filter @autanasoft/database db:generate
pnpm --filter @autanasoft/database test
pnpm --filter api typecheck
pnpm --filter api lint
pnpm --filter api test:unit
pnpm --filter api test:e2e
pnpm --filter api build
pnpm lint:md
pnpm typecheck
pnpm test
pnpm build
```

Si la raíz no incorpora un script `test` de Turbo al implementar, se ejecutarán los tests por
workspace en lugar de inventar el comando. Cada unidad registrará el comando real y su resultado.

## Unidades de entrega y orden

El trabajo debe dividirse por comportamiento completo, incluyendo código, pruebas y documentación.
No se crearán commits separados por tipo de archivo.

| Orden | Unidad revisable                          | Dependencias                               |
| ----- | ----------------------------------------- | ------------------------------------------ |
| 1     | Paquete de contratos compartidos          | Ninguna                                    |
| 2     | Configuración centralizada completa       | Contratos solo si expone tipos compartidos |
| 3     | Bootstrap, prefijo y versionado           | Configuración                              |
| 4     | DTO Zod y OpenAPI                         | Contratos, bootstrap                       |
| 5     | Request ID y logging                      | Configuración, bootstrap                   |
| 6     | Helmet y CORS                             | Configuración, bootstrap                   |
| 7     | Rate limiting                             | Configuración, errores base                |
| 8     | Formato uniforme de errores               | Contratos, request ID, logging             |
| 9     | Liveness y readiness                      | Configuración, database, errores           |
| 10    | Abstracción Argon2                        | Configuración                              |
| 11    | Modelo y migración PostgreSQL de usuarios | Database y configuración                   |
| 12    | CRUD vertical de usuarios                 | Contratos, errores, Argon2, logging, DB    |
| 13    | Endurecimiento E2E y documentación final  | Todas las anteriores                       |

Las unidades 4 a 12 probablemente superarán juntas el umbral saludable de revisión. Deben entregarse
como cambios independientes o PR encadenadas; no como un único cambio masivo. Cada unidad debe poder
revertirse sin eliminar comportamientos no relacionados.

## Riesgos y mitigaciones

| Riesgo                             | Impacto                                    | Mitigación                                                                       |
| ---------------------------------- | ------------------------------------------ | -------------------------------------------------------------------------------- |
| OpenAPI diverge de runtime         | Clientes generan integraciones incorrectas | Derivar DTO del esquema canónico y probar el documento generado                  |
| DTO de NestJS filtran a clientes   | Acoplamiento y bundles innecesarios        | Mantener `packages/contracts` libre de frameworks                                |
| E2E omite bootstrap                | Falsos positivos                           | Reutilizar `configureApplication`                                                |
| CORS inseguro en producción        | Exposición cross-origin no prevista        | Validación cruzada y fallo de inicio                                             |
| Spoofing de IP/request ID          | Rate limiting y auditoría incorrectos      | Validar IDs y confiar en proxy headers solo con configuración explícita          |
| Redacción incompleta               | Filtración de secretos                     | Paths centralizados, pruebas con payloads anidados y prohibición de body logging |
| Duplicación de errores en warnings | Incumple separación de archivos            | Filtro exacto por nivel probado con destinos reales                              |
| Escritura de logs bloqueante       | Aumenta latencia                           | Worker transport y pruebas de lifecycle                                          |
| Storage throttle en memoria        | Límites inconsistentes con varias réplicas | Documentar límite y exigir storage compartido antes de escalar horizontalmente   |
| Readiness costoso                  | Sobrecarga o cascadas                      | Ping mínimo, timeout y sin consultas de negocio                                  |
| Argon2 demasiado costoso o débil   | Latencia o seguridad insuficiente          | Benchmark en hardware objetivo y parámetros centralizados                        |
| Normalización inconsistente        | Duplicados o usuarios imposibles de buscar | Una función pura reutilizada por escritura, búsqueda y pruebas                   |
| Check previo como única unicidad   | Duplicados bajo concurrencia               | Restricciones PostgreSQL y traducción de errores unique                          |
| `search` capturado como `:id`      | Respuestas `400` incorrectas               | Orden explícito de rutas y E2E para `/users/search`                              |
| Soft delete filtrado parcialmente  | Exposición de usuarios eliminados          | Repositorio centraliza scope activo y pruebas para cada lectura                  |
| Hash expuesto por mapping genérico | Filtración crítica de credenciales         | Selección positiva de campos públicos y validación de response Zod               |
| Paginación sin allowlist           | Consultas inesperadas o abuso              | Límite máximo y enums cerrados de campo/dirección                                |
| Exceso de infraestructura genérica | Plantilla difícil de mantener              | Implementar solo extensiones exigidas y adapters cuando exista consumidor real   |

## Matriz de trazabilidad

| Requisito de `docs/api.md`                             | Fase principal |
| ------------------------------------------------------ | -------------- |
| Convenciones REST, controladores delgados y paginación | 1, 12          |
| Swagger/OpenAPI configurable y derivado de contratos   | 4, 12          |
| Zod para contratos, DTO, runtime y tipos               | 1, 4, 12       |
| Configuración y variables validadas                    | 2              |
| Rate limiting global y por endpoint                    | 7              |
| CORS seguro y configurable                             | 6              |
| Helmet global                                          | 6              |
| Pino, consola pretty y archivos JSON separados         | 5              |
| Redacción de datos sensibles                           | 5              |
| Logging HTTP                                           | 5              |
| Identificador de solicitudes                           | 5              |
| Liveness y readiness con Terminus                      | 9              |
| Argon2 abstraído                                       | 10             |
| Manejo uniforme de errores                             | 8              |
| Prefijo global y versionado URI                        | 3              |
| UUID generado por PostgreSQL y migración de usuarios   | 11             |
| Normalización y unicidad de email y `userName`         | 11, 12         |
| Contratos Zod del módulo de usuarios                   | 1, 4           |
| CRUD y separación controller/application/repository    | 12             |
| Búsqueda exacta por email o `userName`                 | 1, 12          |
| Paginación y ordenamiento con límites                  | 1, 12          |
| Respuestas públicas sin credenciales                   | 1, 4, 12       |
| Soft delete y exclusión de usuarios eliminados         | 11, 12         |
| Conflictos `409` y usuarios ausentes `404`             | 8, 12          |
| Seguridad, rate limit y logging del módulo             | 5, 7, 12       |
| OpenAPI completo del módulo de usuarios                | 4, 12, 13      |
| Cierre controlado                                      | 3, 5, 9, 13    |

## Decisiones pendientes antes de cada implementación

Estas decisiones no bloquean el plan, pero deben cerrarse con evidencia durante la fase indicada:

- **Fase 4:** estrategia exacta para documentar y serializar responses con `nestjs-zod` sin duplicar
  schemas.
- **Fase 5:** política de fallo si el directorio de logs no es escribible y formato exacto permitido
  para request IDs entrantes.
- **Fase 7:** límites globales iniciales y si el despliegue base será de una o varias réplicas.
- **Fase 9:** ubicación final de health respecto al prefijo y versionado, según el orquestador
  objetivo.
- **Fase 10:** parámetros Argon2 derivados de benchmark y recomendaciones vigentes.
- **Fase 11:** decisión cerrada: `pgcrypto` proporciona `gen_random_uuid()` y un índice único
  funcional sobre `LOWER(user_name)` garantiza unicidad case-insensitive sin columna normalizada.
  Falta ejecutar la prueba de integración contra PostgreSQL real.
- **Fase 12:** campos permitidos para ordenar, límites de página, política de delete repetido y
  nivel de consistencia entre `data` y `total`.

No se deben resolver estas decisiones con valores arbitrarios codificados en controladores.

## Referencias verificadas

La implementación deberá volver a comprobar versiones al iniciar cada fase. Este plan se basa en el
estado observado del repositorio el 2 de agosto de 2026: NestJS 11, Node.js 20 o superior y Zod
4.4.3 declarado en `apps/api`.

- NestJS, OpenAPI: <https://docs.nestjs.com/openapi/introduction>
- NestJS, versionado: <https://docs.nestjs.com/techniques/versioning>
- NestJS, prefijo global: <https://docs.nestjs.com/faq/global-prefix>
- NestJS, CORS: <https://docs.nestjs.com/security/cors>
- NestJS, Helmet: <https://docs.nestjs.com/security/helmet>
- NestJS, rate limiting: <https://docs.nestjs.com/security/rate-limiting>
- NestJS, health checks: <https://docs.nestjs.com/recipes/terminus>
- NestJS, shutdown hooks: <https://docs.nestjs.com/fundamentals/lifecycle-events>
- `nestjs-zod`, DTO, pipe, serialización y OpenAPI: <https://github.com/BenLorantfy/nestjs-zod>
- `nestjs-pino`, bootstrap y request context: <https://github.com/iamolegga/nestjs-pino>
- Pino, transports: <https://getpino.io/#/docs/transports>
- Zod 4: <https://zod.dev/>
- Argon2 para Node.js: <https://github.com/ranisalt/node-argon2>
- Prisma ORM, PostgreSQL y UUID: <https://www.prisma.io/docs/orm/overview/databases/postgresql>
- PostgreSQL, funciones UUID: <https://www.postgresql.org/docs/current/functions-uuid.html>

## Definición de terminado

La implementación completa se considerará terminada cuando:

- [ ] Todos los requisitos de la matriz de trazabilidad estén implementados.
- [ ] `packages/contracts` sea la única fuente de los contratos HTTP compartidos.
- [ ] No exista duplicación manual entre schemas, tipos, DTO y OpenAPI.
- [ ] Las configuraciones inseguras fallen al iniciar.
- [ ] Todas las respuestas de error cumplan el contrato común.
- [ ] Cada solicitud tenga un request ID validado y retornado.
- [ ] Los logs sensibles estén redactados y los archivos separados por nivel exacto.
- [ ] Liveness y readiness sean independientes y ligeros.
- [ ] Los módulos de negocio no importen Pino, Argon2, Prisma ni detalles HTTP innecesarios.
- [ ] PostgreSQL genere todos los UUID de usuarios y garantice unicidad normalizada.
- [ ] PostgreSQL aplique los defaults de `status` y `role`, mantenga `verifiedAt` en `null` al crear
      y no permita que esos campos internos lleguen a contratos públicos.
- [ ] Los seis endpoints de usuarios cumplan sus contratos, status codes y filtros de soft delete.
- [ ] Ninguna respuesta, error o log exponga password, passwordHash o datos internos de
      normalización.
- [ ] Búsqueda, update vacío, UUID inválido, duplicados y ausencia tengan pruebas de error.
- [ ] Los consumidores puedan validar requests y responses de usuarios con `@autanasoft/contracts`.
- [ ] El E2E use el mismo pipeline de bootstrap que producción.
- [ ] Typecheck, lint, pruebas y build pasen para cada workspace afectado y para el monorepo.
- [ ] La documentación de configuración y operación refleje el comportamiento final.
