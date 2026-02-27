---
id: configuration
title: Configuration Reference
sidebar_label: Configuration Reference
---

# Configuration Reference

All configuration is provided via **environment variables**. The service uses the standard ASP.NET Core `IConfiguration` system, so variables can also be set in `appsettings.json` or `appsettings.Development.json` for local development.

## Required Variables

| Variable | Type | Description |
|---|---|---|
| `JWT_SECRET` | `string` | HMAC-SHA256 signing secret. **Minimum 32 characters.** The service throws `InvalidOperationException` at startup if this is absent. |

## Optional Variables

| Variable | Type | Default | Description |
|---|---|---|---|
| `JWT_ISSUER` | `string` | *(empty)* | Expected JWT issuer. If empty, issuer validation is skipped. |
| `JWT_CLOCK_SKEW_SECONDS` | `int` | `30` | Clock skew tolerance (seconds) for token expiry validation. |
| `MESSAGING_PROVIDER` | `string` | `None` | Message broker to use: `None` \| `RabbitMQ` \| `PubSub` |
| `RABBITMQ_CONNECTION_STRING` | `string` | — | RabbitMQ AMQP connection string. Required when `MESSAGING_PROVIDER=RabbitMQ`. Example: `amqp://guest:guest@localhost` |
| `PUBSUB_PROJECT_ID` | `string` | — | GCP project ID. Required when `MESSAGING_PROVIDER=PubSub`. |
| `PUBSUB_SUBSCRIPTION_ID` | `string` | — | GCP Pub/Sub subscription name. Required when `MESSAGING_PROVIDER=PubSub`. |
| `HEARTBEAT_INTERVAL_SECONDS` | `int` | `15` | How often (seconds) to send an SSE heartbeat comment to keep the connection alive. |
| `ASPNETCORE_URLS` | `string` | `http://+:8080` | Kestrel listen address. Set automatically in the Docker image. |

## Local Development

Create a `.env` file at the repository root (never commit this file):

```env
JWT_SECRET=my-local-dev-secret-at-least-32-chars!
JWT_ISSUER=
JWT_CLOCK_SKEW_SECONDS=30
MESSAGING_PROVIDER=None
HEARTBEAT_INTERVAL_SECONDS=15
```

### PowerShell

```powershell
$env:JWT_SECRET = "my-local-dev-secret-at-least-32-chars!"
dotnet run --project src/ColabBoard.SSE
```

### Docker Compose (example)

```yaml
services:
  sse:
    build: .
    ports:
      - "8080:8080"
    environment:
      JWT_SECRET: "my-local-dev-secret-at-least-32-chars!"
      MESSAGING_PROVIDER: "RabbitMQ"
      RABBITMQ_CONNECTION_STRING: "amqp://guest:guest@rabbitmq"
    depends_on:
      - rabbitmq

  rabbitmq:
    image: rabbitmq:3-management
    ports:
      - "5672:5672"
      - "15672:15672"
```

## Production (GCP Secret Manager)

Store `JWT_SECRET` in Secret Manager and mount it into Cloud Run as an environment variable:

```bash
# Create the secret
echo -n "my-production-secret-at-least-32-chars!" | \
  gcloud secrets create colabboard-jwt-secret --data-file=-

# Deploy with secret mounted
gcloud run deploy colabboard-sse \
  --set-secrets JWT_SECRET=colabboard-jwt-secret:latest
```

## appsettings.Development.json

For IDE-based local development, you can set variables in `appsettings.Development.json`:

```json
{
  "JWT_SECRET": "my-local-dev-secret-at-least-32-chars!",
  "MESSAGING_PROVIDER": "None",
  "HEARTBEAT_INTERVAL_SECONDS": 15
}
```

:::caution
Never commit real secrets to this file. Use a secret manager or a `.gitignore`d `.env` file.
:::
