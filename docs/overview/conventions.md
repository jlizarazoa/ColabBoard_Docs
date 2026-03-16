---
id: conventions
title: Convenciones Compartidas
sidebar_label: Convenciones Compartidas
---

# Convenciones Compartidas

Convenciones utilizadas por el SSE Service. Otros servicios documentarán sus convenciones en iteraciones futuras.

## Autenticación JWT

El SSE Service utiliza **JWTs firmados con HMAC-SHA256** (HS256) para la autenticación. El secreto de firma se inyecta como la variable de entorno `JWT_SECRET`.

### Claims del Token

| Claim | Campo estándar | Descripción |
|---|---|---|
| `sub` / `userId` | `ClaimTypes.NameIdentifier` | Identificador único del usuario |
| `email` | `ClaimTypes.Email` | Dirección de email del usuario |
| `iss` | `JWT_ISSUER` (opcional) | Emisor del token; validación omitida si está vacío |
| `exp` | Estándar | Timestamp de expiración |

### Desfase de Reloj

Los servicios aceptan una tolerancia `JWT_CLOCK_SKEW_SECONDS` configurable (por defecto `30s`) para manejar pequeñas diferencias de reloj entre emisores y validadores de tokens.

### Clientes SSE

El `EventSource` del navegador no puede establecer headers HTTP, por lo que el JWT se pasa como parámetro de query `?token=`. El `JwtQueryStringMiddleware` del SSE Service lo mueve al contexto de validación antes de procesar el request.

---

## Formato de Respuesta de Error

Todas las respuestas de error en todos los servicios usan esta estructura JSON:

```json
{
  "code": "ERROR_CODE",
  "message": "Descripción legible por humanos.",
  "timestamp": "2026-02-26T12:00:00.000Z"
}
```

En C#, se define como:

```csharp
public record ErrorResponse(string Code, string Message, DateTime Timestamp)
{
    public static ErrorResponse Create(string code, string message) =>
        new(code, message, DateTime.UtcNow);
}
```

### Códigos de Error Comunes

| Código | HTTP Status | Significado |
|---|---|---|
| `MISSING_TOKEN` | 401 | Sin parámetro `token` en la query de `/stream` |
| `UNAUTHORIZED` | 401 | Token inválido, expirado o malformado |
| `MISSING_WORKSPACE_ID` | 400 | Sin parámetro `workspaceId` en la query de `/stream` |

---

## Nomenclatura de Variables de Entorno

- Todas las variables de entorno usan `UPPER_SNAKE_CASE`.
- Los secretos nunca se incluyen en el repositorio; se inyectan en tiempo de ejecución mediante GCP Secret Manager o un archivo `.env` local.
- Las variables opcionales tienen valores por defecto documentados; las requeridas lanzan `InvalidOperationException` al inicio si no están presentes.

### Variables Compartidas

| Variable | Descripción |
|---|---|
| `JWT_SECRET` | Secreto de firma HMAC-SHA256 (mínimo 32 caracteres) |
| `JWT_ISSUER` | Emisor esperado del token; vacío = omitir validación |

---

## Eventos de Workspace (Formato de Mensaje Pub/Sub)

Todos los mensajes publicados en el topic Pub/Sub `workspace-events` deben cumplir este esquema JSON:

```json
{
  "eventType": "USER_REMOVED_FROM_WORKSPACE_EVENT",
  "userId": "user-123",
  "workspaceId": "ws-456",
  "timestamp": "2026-02-26T12:00:00.000Z"
}
```

En C#:

```csharp
public record WorkspaceEvent(
    string EventType,
    string UserId,
    string WorkspaceId,
    DateTime Timestamp);
```

### Tipos de Evento Registrados

| Tipo de Evento | Consumidor | Efecto |
|---|---|---|
| `USER_REMOVED_FROM_WORKSPACE_EVENT` | SSE Service | Termina todas las conexiones SSE para ese par `userId + workspaceId` |
