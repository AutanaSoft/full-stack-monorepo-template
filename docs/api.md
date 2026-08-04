# `apps/api`

`apps/api` debe implementar una API RESTful base, diseñada como una plantilla reutilizable para
futuros proyectos.

La aplicación debe incluir únicamente las dependencias y configuraciones esenciales para
proporcionar una base estable, segura, observable, mantenible y fácil de extender.

## Objetivos

La implementación debe:

- Servir como base reutilizable para distintos proyectos.
- Mantener una arquitectura modular y desacoplada.
- Centralizar la configuración de la aplicación.
- Aplicar prácticas de seguridad razonables por defecto.
- Utilizar validación y contratos fuertemente tipados.
- Incluir documentación OpenAPI.
- Proporcionar logging estructurado.
- Exponer health checks para supervisión.
- Incluir un módulo mínimo de usuarios.
- Mantener el conjunto de dependencias tan reducido como sea razonablemente posible.

## Requisitos generales

### API RESTful

La aplicación debe seguir convenciones RESTful consistentes para:

- Rutas.
- Métodos HTTP.
- Códigos de estado.
- Respuestas exitosas.
- Respuestas de error.
- Paginación, filtros y ordenamiento, cuando correspondan.

Los controladores deben mantenerse delgados y delegar la lógica de negocio a servicios o casos de
uso.

### Documentación de la API

La API debe estar documentada mediante Swagger/OpenAPI.

La documentación debe incluir, como mínimo:

- Endpoints disponibles.
- Métodos HTTP.
- Parámetros de ruta.
- Parámetros de consulta.
- Encabezados requeridos.
- Esquemas de solicitud.
- Esquemas de respuesta.
- Códigos de estado HTTP.
- Posibles respuestas de error.
- Métodos de autenticación, cuando correspondan.

La documentación debe generarse a partir de los contratos reales de la aplicación para evitar
inconsistencias entre la implementación y la especificación OpenAPI.

El endpoint de Swagger debe poder:

- Activarse o desactivarse mediante configuración.
- Definirse mediante una ruta configurable.
- Restringirse en producción, cuando sea necesario.

### Contratos, esquemas y DTO

Los contratos de entrada y salida, los esquemas de validación y los DTO deben definirse utilizando
Zod.

Zod debe utilizarse como fuente principal para:

- Validación en tiempo de ejecución.
- Inferencia de tipos de TypeScript.
- Definición de contratos de entrada.
- Definición de contratos de salida.
- Integración con Swagger/OpenAPI.

Debe evitarse la duplicación de definiciones entre:

- Validadores.
- DTO.
- Tipos de TypeScript.
- Contratos expuestos en la documentación OpenAPI.

Los esquemas deben organizarse de forma reutilizable y no deben contener lógica de negocio.

### Configuración y variables de entorno

La aplicación debe utilizar una configuración centralizada.

Las variables de entorno deben:

- Validarse mediante Zod al iniciar la aplicación.
- Tener nombres claros y consistentes.
- Incluir valores predeterminados únicamente cuando sean seguros.
- Provocar un error de inicio cuando falte una variable obligatoria.
- Convertirse al tipo correspondiente antes de utilizarse.

La configuración debe permitir controlar, como mínimo:

- Entorno de ejecución.
- Puerto.
- Prefijo global.
- Configuración de CORS.
- Rate limiting.
- Swagger.
- Logging.
- Directorio de logs.
- Health checks.

### Limitación de solicitudes

La API debe incluir una configuración global de _rate limiting_ con límites razonables para una API
de propósito general.

Los valores globales deben poder configurarse mediante variables de entorno o configuración
centralizada, incluyendo:

- Número máximo de solicitudes.
- Ventana de tiempo.
- Identificador utilizado para limitar solicitudes.
- Activación o desactivación del mecanismo.

La implementación también debe permitir definir límites personalizados por endpoint para aquellos
casos que requieran:

- Restricciones más estrictas.
- Una ventana de tiempo diferente.
- Un mayor número de solicitudes.
- Reglas específicas según la operación.
- La desactivación explícita del límite global.

Los límites no deben quedar codificados directamente en los controladores.

Las respuestas por exceso de solicitudes deben utilizar el código HTTP `429 Too Many Requests` y
mantener el formato estándar de errores de la aplicación.

### CORS

CORS debe incluir una configuración base segura y centralizada.

La configuración debe permitir definir explícitamente:

- Orígenes permitidos.
- Métodos HTTP.
- Encabezados permitidos.
- Encabezados expuestos.
- Uso de credenciales.
- Tiempo de caché de las solicitudes preflight.

No se debe permitir cualquier origen de forma predeterminada en producción.

Cuando se utilicen credenciales, no debe configurarse el origen mediante un comodín.

La lista de orígenes permitidos debe poder definirse mediante variables de entorno.

### Helmet

Helmet debe habilitar las cabeceras HTTP de seguridad recomendadas.

La configuración debe:

- Aplicarse globalmente.
- Utilizar valores seguros por defecto.
- Permitir personalizar políticas específicas.
- Permitir desactivar una política únicamente cuando exista una necesidad técnica justificada.

Cualquier excepción debe quedar centralizada y documentada.

## Logging

La API debe utilizar Pino como sistema de logging, preferiblemente mediante `nestjs-pino`.

La configuración debe diferenciar entre:

- La salida legible en consola.
- La persistencia estructurada en archivos.

### Salida de consola

Los logs enviados a la consola deben procesarse mediante `pino-pretty` tanto en desarrollo como en
producción.

La salida debe ser legible y mostrar, como mínimo:

- Fecha y hora.
- Nivel del log.
- Contexto o módulo.
- Mensaje.
- Información relevante del error.
- Identificador de la solicitud, cuando corresponda.

La consola debe admitir los siguientes niveles:

- `debug`.
- `info`.
- `warn`.
- `error`.

El nivel mínimo mostrado debe poder configurarse mediante variables de entorno.

Una configuración razonable puede ser:

- Desarrollo: `debug`.
- Producción: `info`.
- Pruebas: `warn` o `silent`.

`pino-pretty` debe utilizarse exclusivamente para la salida de consola.

Debido a que también se utiliza en producción, `pino-pretty` debe incluirse como dependencia de
ejecución y no únicamente como dependencia de desarrollo.

### Archivos de logs

Los archivos de logs deben almacenar únicamente eventos de los niveles `warn` y `error`.

Cada nivel debe escribirse en un archivo independiente:

- `warnings.log`: debe contener únicamente eventos con nivel exacto `warn`.
- `errors.log`: debe contener únicamente eventos con nivel exacto `error`.

Los logs de nivel `debug` e `info` no deben almacenarse en archivos.

Los archivos deben conservar el formato JSON estructurado generado por Pino y no deben utilizar
`pino-pretty`.

La configuración del logger debe permitir:

- Definir el nivel mínimo de la consola.
- Activar o desactivar la escritura en archivos.
- Configurar el directorio de almacenamiento.
- Configurar los nombres de los archivos.
- Cambiar el comportamiento según el entorno.
- Redactar información sensible.
- Añadir metadatos comunes.
- Incorporar rotación y retención sin modificar los módulos de negocio.

La escritura en archivos no debe bloquear el procesamiento normal de las solicitudes.

### Redacción de datos sensibles

El logger debe evitar registrar información sensible.

Como mínimo, deben ocultarse o redactarse:

- Contraseñas.
- Hashes de contraseñas.
- Tokens de acceso.
- Tokens de actualización.
- Cookies.
- Encabezados de autorización.
- Claves de API.
- Secretos.
- Códigos de recuperación.
- Datos sensibles incluidos en el cuerpo de las solicitudes.
- Parámetros sensibles incluidos en rutas o consultas.

La redacción debe aplicarse de forma centralizada.

### Logging HTTP

Las solicitudes HTTP deben registrar, como mínimo:

- Método.
- Ruta.
- Código de estado.
- Tiempo de respuesta.
- Identificador de la solicitud.
- Dirección IP, cuando sea apropiado.
- Información básica del error, cuando exista.

No se debe registrar el cuerpo completo de todas las solicitudes o respuestas de forma
predeterminada.

## Identificador de solicitudes

Cada solicitud debe disponer de un identificador único.

El identificador debe:

- Reutilizar un encabezado recibido cuando sea válido.
- Generarse automáticamente cuando no exista.
- Incluirse en los logs relacionados con la solicitud.
- Devolverse en la respuesta.
- Estar disponible para filtros, interceptores, controladores y servicios.

Esto debe permitir correlacionar errores y eventos asociados a una misma solicitud.

## Health checks

La API debe exponer endpoints de diagnóstico utilizando `@nestjs/terminus`.

Como mínimo, debe diferenciar entre:

- **Liveness:** confirma que el proceso está activo.
- **Readiness:** confirma que la aplicación está preparada para recibir tráfico.

Los health checks deben poder incluir:

- Estado general de la aplicación.
- Disponibilidad de la base de datos.
- Disponibilidad de Redis, cuando esté configurado.
- Disponibilidad de servicios externos críticos.
- Uso de memoria.
- Espacio disponible en disco.

Los endpoints de health check deben ser ligeros y no deben ejecutar operaciones costosas.

Las respuestas deben ser consistentes y aptas para herramientas de supervisión y orquestación.

## Contraseñas

El almacenamiento de contraseñas debe implementarse mediante Argon2.

La aplicación debe proporcionar una abstracción reutilizable para:

- Generar hashes.
- Verificar contraseñas.
- Centralizar la configuración del algoritmo.
- Facilitar cambios futuros de parámetros.
- Evitar que los módulos de negocio utilicen directamente la librería criptográfica.

No deben almacenarse ni registrarse contraseñas en texto plano.

Los parámetros de Argon2 deben mantenerse centralizados y utilizar valores seguros.

## Manejo de errores

La API debe implementar un manejo uniforme de errores.

Las respuestas de error deben mantener una estructura consistente que incluya, como mínimo:

- Código de estado HTTP.
- Código interno del error.
- Mensaje.
- Fecha y hora.
- Ruta.
- Identificador de la solicitud.

Los errores internos no deben exponer:

- Trazas completas.
- Consultas de base de datos.
- Secretos.
- Rutas internas.
- Detalles de implementación.

Las trazas completas deben registrarse en el logger cuando sea necesario, pero no deben devolverse
al cliente en producción.

## Prefijo global y versionado

La API debe permitir definir un prefijo global configurable.

Por ejemplo:

```text
/api
```

También debe quedar preparada para implementar versionado mediante URI:

```text
/api/v1
```

La estrategia de versionado debe configurarse de forma centralizada.

## Cierre controlado

La aplicación debe habilitar un cierre controlado ante señales del sistema.

Debe cerrar correctamente:

- Servidor HTTP.
- Conexiones de base de datos.
- Clientes de Redis.
- Productores o consumidores de colas.
- Transportes del logger.
- Otros recursos abiertos.

Los módulos deben poder implementar hooks de ciclo de vida de NestJS.

# Módulo de usuarios

La plantilla debe incluir un módulo de usuarios con una implementación CRUD mínima y reutilizable.

El módulo debe permitir:

- Crear un usuario.
- Actualizar un usuario.
- Buscar un usuario por `email` o `userName`.
- Obtener un usuario por su identificador.
- Listar usuarios.
- Eliminar un usuario.

El módulo debe mantener separadas las responsabilidades de:

- Controladores.
- Servicios o casos de uso.
- Acceso a datos.
- Contratos y esquemas Zod.
- Transformación de respuestas.
- Gestión de contraseñas.

## Entidad de usuario

El usuario debe incluir, como mínimo, los siguientes campos:

- `id`: identificador UUID generado directamente por PostgreSQL.
- `email`: dirección de correo electrónico única.
- `userName`: nombre de usuario único.
- `passwordHash`: hash de la contraseña.
- `createdAt`: fecha de creación.
- `updatedAt`: fecha de última actualización.
- `deletedAt`: fecha de eliminación lógica, cuando corresponda.

La contraseña en texto plano no debe formar parte de la entidad persistida.

Una representación conceptual de la entidad sería:

```ts
interface User {
  id: string;
  email: string;
  userName: string;
  passwordHash: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}
```

## Identificador

El campo `id` debe:

- Utilizar el tipo nativo `uuid` de PostgreSQL.
- Ser la clave primaria.
- Generarse directamente en PostgreSQL.
- No generarse desde la aplicación.
- No aceptar valores proporcionados por el cliente durante la creación.

La columna debe utilizar una expresión equivalente a:

```sql
id uuid PRIMARY KEY DEFAULT gen_random_uuid()
```

La implementación debe garantizar que la extensión o función necesaria para `gen_random_uuid()` esté
disponible en PostgreSQL.

## Correo electrónico

El campo `email` debe:

- Ser obligatorio.
- Tener un formato válido.
- Ser único en la base de datos.
- Normalizarse antes de almacenarse.
- Convertirse a minúsculas.
- Eliminar espacios al principio y al final.
- Contar con una restricción única en PostgreSQL.

Un intento de creación o actualización con un correo ya registrado debe devolver:

```http
409 Conflict
```

La comparación debe realizarse utilizando el correo normalizado para evitar duplicados por
diferencias entre mayúsculas y minúsculas.

## Nombre de usuario

El campo `userName` debe:

- Ser obligatorio.
- Ser único en la base de datos.
- Eliminar espacios al principio y al final.
- Tener una longitud mínima y máxima definida.
- Permitir únicamente los caracteres definidos por el contrato.
- Poder actualizarse.
- Contar con una restricción única en PostgreSQL.

La aplicación debe definir una estrategia de normalización para garantizar que nombres equivalentes
no se registren varias veces por diferencias entre mayúsculas y minúsculas.

La estrategia recomendada es:

- Conservar el valor original para mostrarlo públicamente.
- Mantener una versión normalizada para búsquedas y restricciones de unicidad.

Un intento de creación o actualización con un `userName` ya registrado debe devolver:

```http
409 Conflict
```

Para mantener consistencia entre TypeScript, JSON y la API, debe utilizarse `userName` en los
contratos HTTP y `user_name` en PostgreSQL cuando la base de datos utilice `snake_case`.

## Contraseña

El contrato de creación debe recibir una propiedad `password`.

La contraseña debe:

- Ser obligatoria durante la creación.
- Cumplir una política mínima de longitud.
- Validarse mediante Zod.
- Convertirse en un hash mediante Argon2 antes de persistirse.
- No almacenarse nunca en texto plano.
- No registrarse en logs.
- No incluirse en las respuestas de la API.
- No incluirse en mensajes de error.

El hash debe almacenarse en el campo interno `passwordHash`.

El módulo de usuarios debe utilizar la abstracción centralizada de contraseñas. No debe invocar
directamente la librería `argon2`.

## Contratos Zod

Los contratos del módulo deben definirse mediante Zod.

Como mínimo, deben existir los siguientes esquemas:

- `CreateUserSchema`.
- `UpdateUserSchema`.
- `UserIdParamsSchema`.
- `FindUserQuerySchema`.
- `ListUsersQuerySchema`.
- `UserResponseSchema`.
- `UserListResponseSchema`.

### Creación de usuarios

El contrato de creación debe aceptar:

```ts
{
  email: string;
  userName: string;
  password: string;
}
```

No debe permitir enviar:

- `id`.
- `passwordHash`.
- `createdAt`.
- `updatedAt`.
- `deletedAt`.

### Actualización de usuarios

El contrato de actualización debe permitir modificar:

```ts
{
  email?: string;
  userName?: string;
  password?: string;
}
```

La actualización debe requerir al menos una propiedad.

Cuando se actualice la contraseña:

- Debe validarse nuevamente.
- Debe generarse un nuevo hash mediante Argon2.
- El nuevo hash debe reemplazar al anterior.
- La contraseña en texto plano no debe persistirse ni registrarse.

El cliente no debe poder actualizar directamente:

- `id`.
- `passwordHash`.
- `createdAt`.
- `updatedAt`.
- `deletedAt`.

### Búsqueda de usuarios

El contrato de búsqueda debe permitir buscar un usuario exclusivamente mediante:

```ts
{
  email?: string;
  userName?: string;
}
```

Debe cumplirse exactamente una de las siguientes condiciones:

- Se proporciona `email`.
- Se proporciona `userName`.

No debe permitirse:

- Enviar ambos campos simultáneamente.
- Ejecutar una búsqueda sin ninguno de los campos.
- Buscar mediante otros campos.
- Realizar una búsqueda parcial o ambigua.

El correo debe normalizarse antes de realizar la consulta.

El nombre de usuario debe normalizarse según la estrategia definida para la entidad.

## Respuesta pública

Las respuestas de la API deben utilizar una representación pública del usuario.

Como mínimo, deben incluir:

```ts
interface UserResponse {
  id: string;
  email: string;
  userName: string;
  createdAt: string;
  updatedAt: string;
}
```

Las respuestas nunca deben incluir:

- `password`.
- `passwordHash`.
- Parámetros internos de Argon2.
- Datos internos de normalización.
- Información de recuperación de credenciales.
- Datos sensibles que no formen parte del contrato público.

## Endpoints mínimos

El módulo debe exponer, como mínimo, los siguientes endpoints:

```text
POST   /users
GET    /users
GET    /users/search
GET    /users/:id
PATCH  /users/:id
DELETE /users/:id
```

## Crear un usuario

```text
POST /users
```

Debe:

- Validar la solicitud mediante Zod.
- Normalizar el correo electrónico.
- Normalizar el nombre de usuario.
- Validar las restricciones de unicidad.
- Generar el hash de la contraseña.
- Permitir que PostgreSQL genere el UUID.
- Devolver únicamente la representación pública del usuario.

Debe responder con:

```http
201 Created
```

Los conflictos de `email` o `userName` deben responder con:

```http
409 Conflict
```

## Listar usuarios

```text
GET /users
```

Debe permitir:

- Paginación.
- Ordenamiento mediante campos permitidos.
- Definición de dirección ascendente o descendente.
- Exclusión de usuarios eliminados por defecto.

El listado no debe utilizarse como mecanismo de búsqueda por correo electrónico o nombre de usuario.

La respuesta debe incluir los datos necesarios para paginación:

```ts
{
  data: UserResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
```

La cantidad máxima de elementos por página debe estar limitada.

## Buscar un usuario

```text
GET /users/search
```

Debe permitir buscar un único usuario mediante uno de estos parámetros:

```text
GET /users/search?email=user@example.com
```

o:

```text
GET /users/search?userName=username
```

La búsqueda debe:

- Aceptar únicamente `email` o `userName`.
- Exigir exactamente uno de los dos parámetros.
- Utilizar valores normalizados.
- Realizar una coincidencia exacta.
- Excluir usuarios eliminados.
- Devolver un único usuario.
- Utilizar la representación pública del usuario.

No debe permitir:

```text
GET /users/search
```

No debe permitir:

```text
GET /users/search?email=user@example.com&userName=username
```

No debe realizar búsquedas parciales mediante operadores como:

- `contains`.
- `startsWith`.
- `endsWith`.
- Expresiones regulares.

Cuando el usuario no exista, debe responder con:

```http
404 Not Found
```

## Obtener un usuario por identificador

```text
GET /users/:id
```

Debe:

- Validar que el identificador sea un UUID.
- Buscar al usuario mediante su identificador.
- Excluir usuarios eliminados.
- Devolver únicamente la representación pública.

Cuando el usuario no exista, debe responder con:

```http
404 Not Found
```

## Actualizar un usuario

```text
PATCH /users/:id
```

Debe permitir actualizar parcialmente:

- `email`.
- `userName`.
- `password`.

Debe:

- Validar el UUID recibido.
- Validar la solicitud mediante Zod.
- Exigir al menos una propiedad.
- Normalizar el correo electrónico cuando se modifique.
- Normalizar el nombre de usuario cuando se modifique.
- Manejar conflictos de unicidad.
- Actualizar automáticamente `updatedAt`.
- Generar un nuevo hash cuando se modifique la contraseña.
- Devolver únicamente la representación pública del usuario.

Cuando el usuario no exista, debe responder con:

```http
404 Not Found
```

Cuando el nuevo `email` o `userName` ya esté registrado, debe responder con:

```http
409 Conflict
```

## Eliminar un usuario

```text
DELETE /users/:id
```

Preferiblemente, debe utilizar eliminación lógica mediante `deletedAt`.

Debe responder con:

```http
204 No Content
```

El endpoint no debe devolver contenido cuando la eliminación se complete correctamente.

Los usuarios eliminados no deben aparecer en:

- Búsquedas.
- Listados.
- Consultas por identificador.

Cuando el usuario no exista o ya esté eliminado, debe responder de manera consistente con la
política global de errores.

## Acceso a datos

Los detalles del acceso a datos deben permanecer fuera de los controladores.

El repositorio o servicio de persistencia puede exponer métodos equivalentes a:

```ts
findById(id: string): Promise<User | null>;

findByEmail(email: string): Promise<User | null>;

findByUserName(userName: string): Promise<User | null>;

findMany(query: ListUsersQuery): Promise<PaginatedUsers>;

create(input: CreateUserPersistenceInput): Promise<User>;

update(
  id: string,
  input: UpdateUserPersistenceInput,
): Promise<User | null>;

delete(id: string): Promise<boolean>;
```

La lógica de normalización, hashing y validación no debe quedar acoplada al controlador.

## Restricciones de base de datos

La tabla de usuarios debe incluir, como mínimo:

- Clave primaria UUID con generación automática en PostgreSQL.
- Restricción única para `email`.
- Restricción única para `userName` o para su valor normalizado.
- Columna obligatoria para `passwordHash`.
- Columnas de auditoría.
- Columna opcional para eliminación lógica.

Una representación conceptual sería:

```sql
CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  user_name text NOT NULL,
  password_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz NULL,

  CONSTRAINT users_email_unique UNIQUE (email),
  CONSTRAINT users_user_name_unique UNIQUE (user_name)
);
```

Si la comparación debe ser insensible a mayúsculas y minúsculas, la base de datos debe garantizarlo
mediante una estrategia explícita, por ejemplo:

- Columnas normalizadas.
- Índices únicos sobre `lower(...)`.
- El tipo `citext`, cuando se decida utilizarlo.

La aplicación no debe depender únicamente de comprobaciones previas para garantizar la unicidad. La
restricción debe existir en PostgreSQL.

## Errores del módulo

El módulo debe manejar de forma consistente, como mínimo, los siguientes casos:

- Usuario no encontrado: `404 Not Found`.
- Correo electrónico duplicado: `409 Conflict`.
- Nombre de usuario duplicado: `409 Conflict`.
- UUID inválido: `400 Bad Request`.
- Datos de entrada inválidos: `400 Bad Request`.
- Solicitud de actualización vacía: `400 Bad Request`.
- Búsqueda sin criterio: `400 Bad Request`.
- Búsqueda con `email` y `userName` simultáneamente: `400 Bad Request`.

Los errores deben utilizar el formato global definido para la API e incluir el identificador de la
solicitud.

## Seguridad del módulo

Los endpoints del módulo deben quedar preparados para incorporar autenticación y autorización.

La implementación base debe permitir posteriormente:

- Restringir la creación de usuarios.
- Restringir el listado de usuarios.
- Restringir la búsqueda de usuarios.
- Permitir que un usuario actualice únicamente su propia cuenta.
- Permitir operaciones administrativas mediante roles o permisos.
- Impedir cambios no autorizados de correo o contraseña.

El rate limiting debe poder personalizarse especialmente para:

- Creación de usuarios.
- Búsqueda por correo electrónico.
- Búsqueda por nombre de usuario.
- Actualización de contraseña.

La búsqueda por `email` o `userName` debe evitar convertirse en un mecanismo de enumeración masiva
de usuarios.

## Logging del módulo

El módulo debe registrar eventos relevantes sin exponer datos sensibles.

Puede registrar:

- Identificador del usuario creado o actualizado.
- Tipo de operación realizada.
- Identificador de la solicitud.
- Resultado de la operación.
- Errores o conflictos relevantes.

No debe registrar:

- Contraseñas.
- Hashes de contraseñas.
- Cuerpos completos que contengan credenciales.
- Tokens.
- Encabezados de autorización.

## Documentación Swagger del módulo

Todos los endpoints del módulo deben documentarse mediante Swagger/OpenAPI.

La documentación debe incluir:

- Contratos de entrada.
- Contratos de salida.
- Parámetros de ruta.
- Parámetros de consulta.
- Paginación.
- Códigos de estado.
- Posibles errores.
- Restricciones de unicidad de `email` y `userName`.
- Reglas de búsqueda.
- Requisitos de autenticación, cuando se incorporen.

La documentación debe generarse a partir de los esquemas Zod para evitar contratos duplicados.

# Dependencias necesarias

## Seguridad y plataforma

- `helmet`.
- `@nestjs/throttler`.
- `@nestjs/terminus`.

## Documentación

- `@nestjs/swagger`.

## Validación y contratos

- `zod`.
- Integración de Zod con NestJS y Swagger/OpenAPI.

## Logging

- `pino`.
- `nestjs-pino`.
- `pino-pretty`.

## Seguridad de contraseñas

- `argon2`.

## Persistencia

- Cliente o adaptador de PostgreSQL definido por la arquitectura del proyecto.
- ORM o query builder seleccionado para el monorepo.

# Criterios generales

La implementación debe:

- Mantener una estructura modular.
- Aplicar separación de responsabilidades.
- Centralizar la configuración.
- Validar las variables de entorno.
- Evitar configuraciones inseguras por defecto.
- Evitar dependencias innecesarias.
- Incluir un manejo uniforme de errores.
- Implementar logging estructurado.
- Mostrar logs legibles en consola tanto en desarrollo como en producción.
- Almacenar únicamente `warn` y `error` en archivos.
- Mantener separados los archivos de advertencias y errores.
- Evitar el registro de datos sensibles.
- Incluir un identificador de correlación por solicitud.
- Generar los UUID directamente en PostgreSQL.
- Garantizar en PostgreSQL la unicidad de `email` y `userName`.
- Permitir búsquedas de usuario únicamente por `email` o `userName`.
- Utilizar coincidencias exactas y valores normalizados.
- Ser reutilizable sin depender de reglas de negocio específicas.
- Permitir extender o sustituir componentes sin modificar toda la aplicación.
- Mantener los controladores libres de lógica de infraestructura.
- Conservar una configuración coherente entre desarrollo, pruebas y producción.
