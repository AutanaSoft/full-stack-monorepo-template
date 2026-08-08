# Workflow del módulo de autenticación

El módulo de autenticación debe gestionar los procesos relacionados con la identidad, el acceso y la
recuperación de las cuentas de usuario.

Debe coordinarse con el módulo de usuarios y con servicios compartidos, pero no debe implementar
responsabilidades pertenecientes a otros módulos.

## Responsabilidades del módulo

El módulo de autenticación debe encargarse de:

- Registrar usuarios.
- Generar y validar tokens JWT de acceso.
- Autenticar usuarios mediante credenciales.
- Controlar intentos fallidos de inicio de sesión.
- Aplicar restricciones temporales ante posibles ataques de fuerza bruta.
- Gestionar la verificación del correo electrónico.
- Gestionar la recuperación y el restablecimiento de contraseñas.
- Emitir eventos relacionados con autenticación y seguridad.
- Proteger recursos que requieran autenticación.
- Verificar el estado de la cuenta y del correo electrónico cuando corresponda.

El módulo de autenticación no debe encargarse de:

- Persistir directamente la entidad de usuario.
- Implementar directamente el algoritmo de hash de contraseñas.
- Enviar correos electrónicos.
- Implementar proveedores de notificaciones.
- Describir cómo otros módulos consumen los eventos emitidos.
- Ejecutar procesos internos pertenecientes a otros módulos.

# Registro de usuario

## Flujo

1. El usuario inicia el proceso de registro.
2. El módulo de autenticación recibe la información necesaria.
3. Valida los datos recibidos.
4. Normaliza el correo electrónico y el nombre de usuario.
5. Verifica que el correo electrónico no esté registrado.
6. Verifica que el nombre de usuario no esté registrado.
7. Valida que la contraseña cumpla la política definida.
8. Procesa la contraseña mediante el servicio compartido de contraseñas.
9. Solicita al módulo de usuarios la creación de la cuenta.
10. El usuario se crea con:
    - Un identificador UUID generado directamente por PostgreSQL.
    - Un estado inicial predeterminado.
    - Un rol inicial predeterminado.
    - El correo electrónico sin verificar.
    - La fecha de verificación con valor `null`.
    - El hash de la contraseña.

11. Genera un token temporal para la verificación del correo electrónico.
12. Emite un evento que informa que el usuario fue registrado.
13. Genera un token JWT de acceso.
14. Devuelve el token de acceso como resultado del registro.

## Finalización del registro

El registro se considera completado cuando:

- El usuario fue creado correctamente.
- El token temporal de verificación fue generado.
- El evento de registro fue emitido.
- El token JWT de acceso fue generado.

La ausencia de consumidores para el evento no debe impedir la creación del usuario ni la emisión del
token de acceso.

## Estado del usuario registrado

El usuario recién creado debe:

- Tener un `status` predeterminado.
- Tener un `role` predeterminado.
- Tener `verifiedAt` con valor `null`.
- Poder autenticarse mediante el token de acceso recibido.
- Poder ser restringido en operaciones que requieran correo verificado.

El cliente no debe poder seleccionar libremente el rol o el estado durante el registro.

# Evento de usuario registrado

Cuando el registro se complete correctamente, el módulo de autenticación debe emitir un evento que
represente el hecho de que el usuario fue registrado.

Conceptualmente, el evento puede denominarse:

```text
UserRegistered
```

El evento puede incluir:

- Identificador del usuario.
- Correo electrónico.
- Nombre de usuario.
- Token o referencia temporal de verificación.
- Fecha y hora del registro.

El evento no debe incluir:

- Contraseña.
- Hash de contraseña.
- Token JWT de acceso.
- Claves privadas.
- Secretos.
- Información sensible innecesaria.

La responsabilidad del módulo de autenticación termina después de emitir el evento.

# Verificación del correo electrónico

## Flujo

1. El módulo de autenticación recibe el token temporal de verificación.
2. Localiza la información asociada al token.
3. Valida que el token:
   - Exista.
   - Sea válido.
   - No haya expirado.
   - No haya sido utilizado.
   - Esté asociado a un usuario existente.

4. Comprueba el estado actual de verificación del usuario.
5. Si el correo ya fue verificado, devuelve una respuesta idempotente.
6. Solicita al módulo de usuarios marcar el correo como verificado.
7. Registra la fecha y hora de verificación en `verifiedAt`.
8. Invalida el token temporal.
9. Emite un evento que informa que el correo fue verificado.
10. Confirma que el proceso se completó correctamente.

Conceptualmente, el evento puede denominarse:

```text
UserEmailVerified
```

## Resultado

Cuando la verificación se complete:

- `verifiedAt` debe contener la fecha y hora de la verificación.
- El token utilizado no debe poder reutilizarse.
- El usuario debe poder acceder a funcionalidades que requieran correo verificado.

# Reenvío de verificación

## Flujo

1. El usuario solicita una nueva verificación.
2. El módulo de autenticación recibe y normaliza el identificador requerido.
3. Localiza la cuenta cuando exista.
4. Comprueba que el correo todavía no esté verificado.
5. Invalida los tokens de verificación anteriores, según la estrategia definida.
6. Genera un nuevo token temporal de verificación.
7. Emite un evento que solicita una nueva verificación.
8. Devuelve una respuesta genérica.

Conceptualmente, el evento puede denominarse:

```text
UserEmailVerificationRequested
```

La respuesta no debe confirmar:

- Si el usuario existe.
- Si el correo está registrado.
- Si el correo ya fue verificado.
- Si el evento fue procesado por otro componente.

Este proceso debe estar protegido mediante rate limiting.

# Inicio de sesión

## Credenciales

El usuario debe poder iniciar sesión utilizando:

- Correo electrónico y contraseña.
- Nombre de usuario y contraseña.

Debe proporcionar exactamente uno de los siguientes identificadores:

- `email`.
- `userName`.

## Flujo

1. El usuario proporciona sus credenciales.
2. El módulo de autenticación normaliza el identificador.
3. Verifica si existe una restricción temporal aplicable.
4. Si existe una restricción activa, rechaza el intento.
5. Localiza al usuario mediante correo electrónico o nombre de usuario.
6. Verifica que el estado de la cuenta permita iniciar sesión.
7. Verifica la contraseña mediante el servicio compartido de contraseñas.
8. Si las credenciales son inválidas:
   - Registra el intento fallido.
   - Actualiza el contador correspondiente.
   - Determina si se alcanzó el límite permitido.
   - Aplica una restricción temporal cuando corresponda.
   - Devuelve una respuesta genérica.

9. Si las credenciales son válidas:
   - Reinicia los contadores aplicables.
   - Elimina las restricciones vencidas relacionadas.
   - Genera un token JWT de acceso.
   - Registra el acceso exitoso.
   - Devuelve el token de acceso.

Las respuestas ante credenciales inválidas no deben revelar:

- Si el usuario existe.
- Si el correo está registrado.
- Si el nombre de usuario está registrado.
- Si la contraseña es incorrecta.
- Qué criterio interno provocó el rechazo.

# Protección contra ataques de fuerza bruta

El módulo de autenticación debe incluir un mecanismo específico para controlar intentos fallidos de
inicio de sesión.

Este mecanismo debe ser independiente del rate limiting general de la API.

## Diferencia entre mecanismos

El rate limiting debe limitar la cantidad de solicitudes realizadas durante un período determinado.

El control de intentos fallidos debe registrar errores de autenticación y aplicar restricciones
temporales según el comportamiento detectado.

Ambos mecanismos deben utilizarse de forma complementaria.

## Registro de intentos fallidos

Cada intento fallido debe incrementar un contador temporal.

El contador puede asociarse a una combinación de:

- Identificador normalizado utilizado para iniciar sesión.
- Identificador interno del usuario, cuando pueda determinarse.
- Dirección IP.
- Contexto relevante de la solicitud.

No debe utilizarse únicamente la dirección IP, porque varios usuarios pueden compartir una misma
conexión.

Tampoco debe utilizarse únicamente la cuenta, porque un atacante podría provocar bloqueos
deliberados sobre usuarios legítimos.

## Configuración

El mecanismo debe permitir configurar:

- Número máximo de intentos fallidos.
- Ventana de tiempo para contabilizarlos.
- Duración inicial de la restricción.
- Incremento progresivo ante reincidencias.
- Tiempo necesario para reiniciar el contador.
- Criterios utilizados para asociar los intentos.

Estos valores deben mantenerse en la configuración centralizada.

## Restricción temporal

Cuando se alcance el límite:

1. Se registra una restricción temporal.
2. Los nuevos intentos se rechazan durante el período configurado.
3. No se continúa verificando la contraseña mientras la restricción esté activa.
4. El incidente se registra mediante el logger.
5. Puede emitirse un evento de seguridad.
6. La respuesta permanece genérica.

Conceptualmente, el evento puede denominarse:

```text
UserLoginTemporarilyBlocked
```

La restricción:

- Debe ser temporal.
- No debe bloquear permanentemente una cuenta.
- Puede aumentar progresivamente ante reincidencias.
- No debe revelar públicamente sus criterios internos.

## Intento fallido

Cuando se produzca un intento fallido, puede emitirse el evento:

```text
UserLoginFailed
```

El evento no debe incluir:

- Contraseña proporcionada.
- Hash de contraseña.
- Tokens.
- Encabezados de autorización.
- Cuerpos completos de solicitudes.
- Información sensible innecesaria.

## Inicio de sesión exitoso

Cuando el inicio de sesión sea exitoso:

1. Se reinician los contadores aplicables.
2. Se eliminan las restricciones vencidas.
3. Se genera el token JWT.
4. Se registra el acceso.
5. Puede emitirse un evento de autenticación exitosa.

Conceptualmente:

```text
UserLoginSucceeded
```

# Token JWT de acceso

El módulo de autenticación debe generar un token JWT después de:

- Un registro completado correctamente.
- Un inicio de sesión exitoso.

## Contenido

El token debe incluir únicamente la información necesaria para identificar al usuario y aplicar
reglas de autorización.

Puede incluir conceptualmente:

- Identificador del usuario.
- Rol.
- Estado de la cuenta.
- Estado de verificación del correo.
- Fecha de emisión.
- Fecha de expiración.

No debe incluir:

- Contraseña.
- Hash de contraseña.
- Información sensible.
- Datos innecesarios del perfil.

## Configuración

La configuración del JWT debe mantenerse fuera del código fuente.

Debe incluir:

- Clave de firma.
- Algoritmo permitido.
- Duración.
- Emisor, cuando corresponda.
- Audiencia, cuando corresponda.

## Validación

La validación debe comprobar:

- Firma.
- Algoritmo esperado.
- Fecha de expiración.
- Emisor, cuando esté configurado.
- Audiencia, cuando esté configurada.
- Estructura del token.
- Identificador del usuario.
- Estado válido de la cuenta, cuando corresponda.

# Acceso a recursos protegidos

## Flujo

1. El usuario envía una solicitud con el token JWT.
2. El módulo de autenticación extrae el token.
3. Valida la firma, la estructura y la expiración.
4. Identifica al usuario asociado.
5. Comprueba el estado de la cuenta.
6. Comprueba el estado de verificación del correo cuando el recurso lo requiera.
7. Permite continuar cuando todas las condiciones sean válidas.
8. Rechaza la solicitud cuando el token sea inválido o haya expirado.
9. Rechaza la solicitud cuando el estado de la cuenta no permita el acceso.
10. Rechaza las operaciones que requieran correo verificado cuando `verifiedAt` sea `null`.

La identidad autenticada debe quedar disponible durante el ciclo de vida de la solicitud.

# Solicitud de recuperación de contraseña

## Flujo

1. El usuario inicia el proceso de recuperación.
2. El módulo de autenticación recibe y normaliza el correo electrónico.
3. Localiza la cuenta cuando exista.
4. Devuelve siempre una respuesta genérica.
5. Si la cuenta existe:
   - Genera un token temporal de recuperación.
   - Persiste únicamente la información segura necesaria para validarlo.
   - Emite un evento de recuperación de contraseña.

Conceptualmente, el evento puede denominarse:

```text
UserPasswordResetRequested
```

La respuesta no debe confirmar:

- Si el usuario existe.
- Si el correo está registrado.
- Si el evento fue emitido.
- Si otro componente procesó la solicitud.

## Token de recuperación

El token debe:

- Tener una duración limitada.
- Ser de un solo uso.
- Invalidarse después de utilizarse.
- No almacenarse en texto plano.
- No registrarse en logs.
- Estar asociado al usuario correspondiente.
- Contar con protección frente a reutilización.

# Restablecimiento de contraseña

## Flujo

1. El módulo de autenticación recibe el token temporal y la nueva contraseña.
2. Valida que el token:
   - Exista.
   - Sea válido.
   - No haya expirado.
   - No haya sido utilizado.
   - Esté asociado al usuario correspondiente.

3. Valida la nueva contraseña.
4. Procesa la contraseña mediante el servicio compartido.
5. Solicita al módulo de usuarios actualizar el hash almacenado.
6. Invalida el token temporal.
7. Reinicia los intentos fallidos o restricciones aplicables.
8. Registra el cambio.
9. Emite un evento que informa que la contraseña fue modificada.
10. Confirma que el proceso se completó correctamente.

Conceptualmente, el evento puede denominarse:

```text
UserPasswordChanged
```

# Reglas del modelo de usuario

El módulo de autenticación debe respetar las siguientes reglas del modelo de usuario.

## `status`

- Debe ser un enum.
- Debe representar el estado de la cuenta.
- Debe tener un valor predeterminado al registrar un usuario.
- Debe utilizarse para determinar si la cuenta puede autenticarse.

Los valores concretos se definirán posteriormente.

## `role`

- Debe ser un enum.
- Debe representar el nivel de acceso del usuario.
- Debe tener un valor predeterminado.
- No debe poder seleccionarse libremente durante el registro.

Los valores concretos se definirán posteriormente.

## `userName`

Debe:

- Ser obligatorio.
- Ser único.
- Tener un máximo de 20 caracteres.
- Contener únicamente:
  - Letras.
  - Números.
  - Punto.
  - Guion.
  - Guion bajo.

- No contener espacios.
- Normalizarse antes de persistirse o buscarse.
- Compararse sin distinguir entre mayúsculas y minúsculas.

Regla conceptual:

```regex
^[a-zA-Z0-9._-]{1,20}$
```

## `email`

Debe:

- Ser obligatorio.
- Tener un formato válido.
- Ser único.
- Tener un máximo de 100 caracteres.
- Eliminar espacios externos.
- Convertirse a minúsculas.
- Compararse sin distinguir entre mayúsculas y minúsculas.

## `verifiedAt`

Debe:

- Contener la fecha y hora de verificación del correo.
- Tener valor inicial `null`.
- Indicar que el correo no ha sido verificado cuando sea `null`.
- Actualizarse únicamente cuando la verificación se complete.

## Contraseña

La contraseña recibida debe:

- Tener entre 6 y 16 caracteres.
- Contener caracteres alfanuméricos.
- Permitir los caracteres especiales habituales para contraseñas.
- No contener espacios.
- Validarse antes de procesarse.
- Convertirse en un hash mediante el servicio compartido.
- No persistirse en texto plano.
- No incluirse en logs, eventos ni respuestas.

El modelo persistido debe almacenar únicamente `passwordHash`.

# Comunicación mediante eventos

El módulo de autenticación puede emitir los siguientes eventos conceptuales:

```text
UserRegistered
UserEmailVerificationRequested
UserEmailVerified
UserLoginFailed
UserLoginTemporarilyBlocked
UserLoginSucceeded
UserPasswordResetRequested
UserPasswordChanged
```

Los eventos deben:

- Representar hechos ocurridos o solicitudes explícitas.
- Tener nombres claros.
- Contener únicamente la información necesaria.
- Evitar contraseñas, hashes, tokens de acceso y secretos.
- Permitir versionado cuando sea necesario.
- Poder procesarse de forma idempotente.
- Evitar dependencias directas con módulos externos.

# Consideraciones de seguridad

El módulo debe:

- Evitar revelar si un usuario existe.
- Evitar registrar contraseñas, hashes o tokens.
- Aplicar rate limiting a operaciones sensibles.
- Controlar intentos fallidos de inicio de sesión.
- Aplicar restricciones temporales ante fuerza bruta.
- Utilizar mensajes genéricos para credenciales inválidas.
- Mantener las claves JWT fuera del código fuente.
- Limitar la duración de los tokens temporales.
- Invalidar los tokens después de utilizarlos.
- Evitar la reutilización de tokens.
- Restringir operaciones según el estado del usuario.
- Permitir exigir correo verificado según el recurso.
- Mantener separadas las responsabilidades de autenticación, usuarios, contraseñas y notificaciones.
