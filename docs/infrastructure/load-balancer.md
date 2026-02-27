---
id: load-balancer
title: Load Balancer Settings
sidebar_label: Load Balancer
---

# GCP Load Balancer Settings

The GCP HTTPS Load Balancer fronts the SSE Service. Standard backend timeouts are 30–60 seconds, which would kill persistent SSE connections. These settings must be explicitly configured.

## Required Settings

| Setting | Required Value | Where to Set | Reason |
|---|---|---|---|
| **Backend Service Timeout** | `3600s` (1 hour) | Backend service → Edit → Timeout | Keeps SSE connections alive up to 1 hour |
| **Connection Draining Timeout** | `300s` (5 min) | Backend service → Connection draining | Allows in-flight SSE connections to drain gracefully during deploys |
| **Cloud Run Request Timeout** | `3600s` | Cloud Run service config | Must match or exceed the backend timeout |

## gcloud CLI

```bash
# Update backend service timeout
gcloud compute backend-services update colabboard-sse-backend \
  --global \
  --timeout=3600

# Update connection draining timeout
gcloud compute backend-services update colabboard-sse-backend \
  --global \
  --connection-draining-timeout=300
```

## Why These Settings Matter

SSE connections are long-lived HTTP requests. If the load balancer timeout is less than the client's connection lifetime:
- The load balancer closes the TCP connection after the timeout.
- The browser `EventSource` detects the disconnect and immediately reconnects (causing a reconnect storm on deploys).
- Users see frequent brief interruptions.

With `3600s` timeout and `retry: 5000` on the client, SSE streams remain stable for up to 1 hour and reconnect gracefully on server restarts.

## Health Check

Configure the load balancer health check to target `/health`:

| Field | Value |
|---|---|
| Protocol | HTTP |
| Port | 8080 |
| Path | `/health` |
| Check interval | `10s` |
| Healthy threshold | `1` |
| Unhealthy threshold | `3` |
