---
id: api-reference
title: API Reference
sidebar_label: API Reference
---

# API Reference

The SSE Service exposes two HTTP endpoints.

---

## `GET /stream`

Opens a persistent **Server-Sent Events** stream for a specific user and workspace.

### Query Parameters

| Parameter | Type | Required | Description |
|---|---|---|---|
| `workspaceId` | `string` | **Yes** | The workspace ID to subscribe to |
| `token` | `string` | **Yes** | A valid HS256-signed JWT |

### Request Example

```bash
curl -N "http://localhost:5263/stream?workspaceId=ws-1&token=<jwt>"
```

### Response

**Success — `200 OK`**

Headers:

```
Content-Type: text/event-stream
Cache-Control: no-cache
Connection: keep-alive
X-Accel-Buffering: no
X-Content-Type-Options: nosniff
```

**Initial SSE preamble** (sent immediately on connection):

```
id: 1
retry: 5000

event: connected
data: {"status":"ok"}

```

**Periodic heartbeat** (every `HEARTBEAT_INTERVAL_SECONDS`, default 15s):

```
: heartbeat

```

The heartbeat is an SSE comment line. Clients ignore it; it exists solely to prevent proxy/load-balancer timeout on idle connections.

**Server-initiated termination event** (e.g. access revoked or server shutdown):

```
event: connection-terminated
data: {"reason":"access_revoked"}

```

| `reason` value | Trigger |
|---|---|
| `access_revoked` | `USER_REMOVED_FROM_WORKSPACE_EVENT` received from Pub/Sub |
| `server_shutdown` | Container received `SIGTERM` (graceful shutdown) |

After receiving `connection-terminated`, clients should stop reconnecting (the access has been revoked) or allow the browser `EventSource` to reconnect after the graceful shutdown grace period.

---

**Error responses:**

| Condition | Status | Body |
|---|---|---|
| Missing `token` query parameter | `401` | `{"code":"MISSING_TOKEN","message":"A 'token' query parameter is required.","timestamp":"..."}` |
| Invalid / expired token | `401` | `{"code":"UNAUTHORIZED","message":"Token is invalid or expired.","timestamp":"..."}` |
| Missing `workspaceId` parameter | `400` | `{"code":"MISSING_WORKSPACE_ID","message":"The 'workspaceId' query parameter is required.","timestamp":"..."}` |

---

## `GET /health`

Returns the current health status of the service. Suitable for load-balancer health checks.

### Response — `200 OK`

```json
{
  "status": "healthy",
  "activeConnections": 42,
  "uptime": "00.02:15:30"
}
```

| Field | Type | Description |
|---|---|---|
| `status` | `string` | Always `"healthy"` when the service is running |
| `activeConnections` | `int` | Number of currently open SSE connections |
| `uptime` | `string` | Service uptime in `dd.hh:mm:ss` format |

### Request Example

```bash
curl "http://localhost:5263/health"
```

---

## SSE Event Reference

| Event name | When sent | Data shape |
|---|---|---|
| `connected` | Immediately on stream open | `{"status":"ok"}` |
| *(heartbeat comment)* | Every `HEARTBEAT_INTERVAL_SECONDS` | `: heartbeat` (no event field) |
| `connection-terminated` | Server-initiated close | `{"reason":"<reason>"}` |

### Client-Side Example (JavaScript)

```javascript
const token = await getJwt(); // obtain from your auth flow
const es = new EventSource(
  `/stream?workspaceId=${workspaceId}&token=${token}`
);

es.addEventListener('connected', (e) => {
  console.log('SSE stream opened', JSON.parse(e.data));
});

es.addEventListener('connection-terminated', (e) => {
  const { reason } = JSON.parse(e.data);
  console.warn('Connection terminated by server:', reason);
  if (reason === 'access_revoked') {
    es.close(); // Don't auto-reconnect when access has been revoked
    redirectToLogin();
  }
});

es.onerror = (err) => {
  console.error('SSE error, will auto-reconnect after retry interval', err);
};
```
