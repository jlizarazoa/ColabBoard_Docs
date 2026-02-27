---
id: deployment
title: Docker & Deployment
sidebar_label: Docker & Deployment
---

# Docker & Deployment

## Docker

### Multi-Stage Dockerfile

The service uses a two-stage Dockerfile for minimal image size:

| Stage | Base Image | Purpose |
|---|---|---|
| `build` | `mcr.microsoft.com/dotnet/sdk:9.0` | Restore, compile, publish |
| `runtime` | `mcr.microsoft.com/dotnet/aspnet:9.0-alpine` | Run the published output |

The service runs as a **non-root user** (`appuser`) inside the container.

### Build

```bash
docker build -t colabboard-sse:latest .
```

### Run (local)

```bash
docker run --rm -p 8080:8080 \
  -e JWT_SECRET="my-local-dev-secret-at-least-32-chars!" \
  colabboard-sse:latest
```

### Run (with RabbitMQ)

```bash
# 1. Start RabbitMQ
docker run -d -p 5672:5672 -p 15672:15672 --name rabbitmq rabbitmq:3-management

# 2. Start SSE Service connected to RabbitMQ
docker run --rm -p 8080:8080 \
  -e JWT_SECRET="my-local-dev-secret-at-least-32-chars!" \
  -e MESSAGING_PROVIDER=RabbitMQ \
  -e RABBITMQ_CONNECTION_STRING="amqp://guest:guest@host.docker.internal" \
  colabboard-sse:latest
```

### Verify startup fails without JWT_SECRET

```bash
docker run --rm colabboard-sse:latest
# Expected: InvalidOperationException: Missing required configuration: 'JWT_SECRET'
```

---

## GCP Deployment

### Push to Container Registry

```bash
# Tag for GCP Artifact Registry
docker tag colabboard-sse:latest gcr.io/<PROJECT_ID>/colabboard-sse:latest

# Push
docker push gcr.io/<PROJECT_ID>/colabboard-sse:latest
```

### Deploy to Cloud Run

```bash
gcloud run deploy colabboard-sse \
  --image gcr.io/<PROJECT_ID>/colabboard-sse:latest \
  --region <REGION> \
  --port 8080 \
  --no-cpu-throttling \
  --min-instances 1 \
  --timeout 3600 \
  --set-env-vars JWT_SECRET=<secret>,MESSAGING_PROVIDER=PubSub,PUBSUB_PROJECT_ID=<project>,PUBSUB_SUBSCRIPTION_ID=<sub>
```

:::tip Use Secret Manager for JWT_SECRET
In production, mount `JWT_SECRET` from **GCP Secret Manager** rather than passing it directly as an env var:
```bash
--set-secrets JWT_SECRET=colabboard-jwt-secret:latest
```
:::

---

## GCP Load Balancer Configuration

The GCP Load Balancer must be configured with extended timeouts to support long-lived SSE connections:

| Setting | Recommended Value | Reason |
|---|---|---|
| **Backend Service Timeout** | `3600s` | Keeps SSE connections alive up to 1 hour |
| **Connection Draining Timeout** | `300s` | Allows in-flight connections to drain during deploys |
| **Cloud Run Request Timeout** | `3600s` | Must match backend timeout |
| **CPU Allocation** | Always (`--no-cpu-throttling`) | Prevents CPU suspension on idle SSE connections |
| **Min Instances** | `1` | Eliminates cold-start latency for persistent connections |
| **Session Affinity** | `NONE` | Connections are stateless per-instance; load balance freely |

---

## Graceful Shutdown

When the container receives `SIGTERM` (e.g., `docker stop` or Cloud Run scale-down):

```mermaid
sequenceDiagram
    participant Docker/CR as Docker / Cloud Run
    participant Host as .NET Host
    participant CM as ConnectionManager
    participant Client as Browser Client

    Docker/CR->>Host: SIGTERM
    Host->>CM: ApplicationStopping → TerminateAll("server_shutdown")
    CM->>Client: event: connection-terminated\ndata: {"reason":"server_shutdown"}
    Note over Host: Thread.Sleep(500ms)
    Host->>Host: Process exits
    Client->>Client: EventSource auto-reconnects after retry: 5000ms
```

1. `ApplicationStopping` fires → `ConnectionManager.TerminateAll("server_shutdown")`
2. All connected clients receive `event: connection-terminated` with `reason: "server_shutdown"`.
3. A 500ms sleep gives the request threads time to flush the termination event before the process exits.
4. Browser `EventSource` automatically reconnects after 5 seconds.

---

## Load Testing

```bash
# Install k6: https://k6.io/docs/get-started/installation/
k6 run --vus 1000 --duration 60s k6-load-test.js
```
