---
id: conventions
title: Shared Conventions
sidebar_label: Shared Conventions
---

# Shared Conventions

All ColabBoard microservices follow these conventions to ensure consistency.

## JWT Authentication

All services that require authentication use **HMAC-SHA256 signed JWTs** (HS256). The signing secret is stored in **GCP Secret Manager** and injected as the `JWT_SECRET` environment variable.

### Token Claims

| Claim | Standard field | Description |
|---|---|---|
| `sub` / `userId` | `ClaimTypes.NameIdentifier` | Unique user identifier |
| `email` | `ClaimTypes.Email` | User email address |
| `iss` | `JWT_ISSUER` (optional) | Token issuer; validation skipped if blank |
| `exp` | Standard | Expiry timestamp |

### Clock Skew

Services accept a configurable `JWT_CLOCK_SKEW_SECONDS` tolerance (default `30s`) to handle minor clock drift between token issuers and validators.

### SSE Clients

Browser `EventSource` cannot set HTTP headers, so the JWT is passed as a `?token=` query parameter. The `JwtQueryStringMiddleware` in the SSE Service moves it into the validation context before the request is processed.

---

## Error Response Format

All error responses across all services use this JSON shape:

```json
{
  "code": "ERROR_CODE",
  "message": "Human-readable description.",
  "timestamp": "2026-02-26T12:00:00.000Z"
}
```

In C#, this is defined as:

```csharp
public record ErrorResponse(string Code, string Message, DateTime Timestamp)
{
    public static ErrorResponse Create(string code, string message) =>
        new(code, message, DateTime.UtcNow);
}
```

### Common Error Codes

| Code | HTTP Status | Meaning |
|---|---|---|
| `MISSING_TOKEN` | 401 | No `token` query parameter on `/stream` |
| `UNAUTHORIZED` | 401 | Token is invalid, expired, or malformed |
| `MISSING_WORKSPACE_ID` | 400 | No `workspaceId` query parameter on `/stream` |

---

## Environment Variable Naming

- All environment variables are `UPPER_SNAKE_CASE`.
- Secrets are never committed to the repository; they are injected at runtime via GCP Secret Manager or a local `.env` file.
- Optional variables have documented defaults; required variables throw `InvalidOperationException` at startup if absent.

### Shared Variables

| Variable | Services | Description |
|---|---|---|
| `JWT_SECRET` | SSE Service, Session Service | HMAC-SHA256 signing secret (min 32 chars) |
| `JWT_ISSUER` | SSE Service | Expected token issuer; blank = skip validation |

---

## Workspace Events (Pub/Sub Message Shape)

All messages published to the `workspace-events` Pub/Sub topic must conform to this JSON schema:

```json
{
  "eventType": "USER_REMOVED_FROM_WORKSPACE_EVENT",
  "userId": "user-123",
  "workspaceId": "ws-456",
  "timestamp": "2026-02-26T12:00:00.000Z"
}
```

In C#:

```csharp
public record WorkspaceEvent(
    string EventType,
    string UserId,
    string WorkspaceId,
    DateTime Timestamp);
```

### Registered Event Types

| Event Type | Publisher | Consumer | Effect |
|---|---|---|---|
| `USER_REMOVED_FROM_WORKSPACE_EVENT` | Session Service | SSE Service | Terminates all SSE connections for that `userId + workspaceId` pair |

---

## Logging

All services use structured logging via the .NET `ILogger` abstraction with **Serilog** (or the built-in Microsoft logger in simple services). Log property names use `PascalCase` to match the structured log format expected by Cloud Logging.

Example:

```
Connection registered. connectionId=abc123 userId=user-1 workspaceId=ws-1 total=5
```
