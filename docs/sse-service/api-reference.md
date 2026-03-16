---
id: api-reference
title: Referencia de API
sidebar_label: Referencia de API
---

# Referencia de API

El SSE Service expone dos endpoints HTTP.

---

## `GET /stream`

Abre un stream persistente de **Server-Sent Events** para un usuario y workspace específicos.

### Parámetros de Query

| Parámetro | Tipo | Requerido | Descripción |
|---|---|---|---|
| `workspaceId` | `string` | **Sí** | ID del workspace al que suscribirse |
| `token` | `string` | **Sí** | JWT válido firmado con HS256 |

### Ejemplo de Request

```bash
curl -N "http://localhost:5263/stream?workspaceId=ws-1&token=<jwt>"
```

### Respuesta

**Éxito — `200 OK`**

Headers:

```
Content-Type: text/event-stream
Cache-Control: no-cache
Connection: keep-alive
X-Accel-Buffering: no
X-Content-Type-Options: nosniff
```

**Preámbulo SSE inicial** (enviado inmediatamente al conectar):

```
id: 1
retry: 5000

event: connected
data: {"status":"ok"}

```

**Heartbeat periódico** (cada `HEARTBEAT_INTERVAL_SECONDS`, por defecto 15s):

```
: heartbeat

```

El heartbeat es una línea de comentario SSE. Los clientes la ignoran; existe únicamente para evitar timeouts del proxy o load balancer en conexiones inactivas.

**Evento de terminación iniciado por el servidor** (p. ej. acceso revocado o apagado del servidor):

```
event: connection-terminated
data: {"reason":"access_revoked"}

```

| Valor de `reason` | Disparador |
|---|---|
| `access_revoked` | Se recibió `USER_REMOVED_FROM_WORKSPACE_EVENT` desde Pub/Sub |
| `server_shutdown` | El contenedor recibió `SIGTERM` (apagado graceful) |

Tras recibir `connection-terminated`, los clientes deben dejar de reconectarse (el acceso fue revocado) o permitir que el `EventSource` del navegador se reconecte pasado el periodo de gracia del apagado.

---

**Respuestas de error:**

| Condición | Status | Cuerpo |
|---|---|---|
| Parámetro `token` ausente | `401` | `{"code":"MISSING_TOKEN","message":"A 'token' query parameter is required.","timestamp":"..."}` |
| Token inválido o expirado | `401` | `{"code":"UNAUTHORIZED","message":"Token is invalid or expired.","timestamp":"..."}` |
| Parámetro `workspaceId` ausente | `400` | `{"code":"MISSING_WORKSPACE_ID","message":"The 'workspaceId' query parameter is required.","timestamp":"..."}` |

---

## `GET /health`

Devuelve el estado de salud actual del servicio. Apto para health checks del load balancer.

### Respuesta — `200 OK`

```json
{
  "status": "healthy",
  "activeConnections": 42,
  "uptime": "00.02:15:30"
}
```

| Campo | Tipo | Descripción |
|---|---|---|
| `status` | `string` | Siempre `"healthy"` cuando el servicio está en ejecución |
| `activeConnections` | `int` | Número de conexiones SSE activas actualmente |
| `uptime` | `string` | Tiempo activo del servicio en formato `dd.hh:mm:ss` |

### Ejemplo de Request

```bash
curl "http://localhost:5263/health"
```

---

## Referencia de Eventos SSE

| Nombre del evento | Cuándo se envía | Forma del dato |
|---|---|---|
| `connected` | Inmediatamente al abrir el stream | `{"status":"ok"}` |
| *(comentario de heartbeat)* | Cada `HEARTBEAT_INTERVAL_SECONDS` | `: heartbeat` (sin campo `event`) |
| `connection-terminated` | Cierre iniciado por el servidor | `{"reason":"<reason>"}` |

### Ejemplo en el Cliente (JavaScript)

```javascript
const token = await getJwt(); // obtener desde tu flujo de autenticación
const es = new EventSource(
  `/stream?workspaceId=${workspaceId}&token=${token}`
);

es.addEventListener('connected', (e) => {
  console.log('SSE stream abierto', JSON.parse(e.data));
});

es.addEventListener('connection-terminated', (e) => {
  const { reason } = JSON.parse(e.data);
  console.warn('Conexión terminada por el servidor:', reason);
  if (reason === 'access_revoked') {
    es.close(); // No reconectar automáticamente cuando el acceso fue revocado
    redirectToLogin();
  }
});

es.onerror = (err) => {
  console.error('Error SSE, se reconectará tras el intervalo de retry', err);
};
```
