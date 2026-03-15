---
id: overview
title: API Gateway
sidebar_label: Overview
---

# API Gateway

The `ColabBoard_Api_Gateway` is a **.NET 9 YARP reverse proxy** deployed on **GCP Cloud Run**. All browser API traffic flows through it — it routes requests to the appropriate downstream microservice, handles CORS, and passes through SSE connections with buffering disabled.

## Technology Stack

| Component | Technology |
|---|---|
| Runtime | .NET 9, ASP.NET Core |
| Proxy engine | YARP (Yet Another Reverse Proxy) 2.3 |
| Hosting | GCP Cloud Run (`southamerica-west1`) |

## Cloud Run URL

```
https://colabboard-api-gateway-173469174364.southamerica-west1.run.app
```

This is the value set as `VITE_API_BASE_URL` in the frontend.

## Route Table

| Route Pattern | Downstream Cluster | Destination | Notes |
|---|---|---|---|
| `/auth/{**}` | `auth-cluster` | Sessions MS (Cloud Run, `us-central1`) | Login, register, verify |
| `/stream` | `sse-cluster` | SSE Service (Cloud Run, `southamerica-west1`) | SSE passthrough (buffering disabled) |
| `/api/profile/{**}` | `profile-cluster` | Profile MS (Cloud Run, `us-central1`) | Profile CRUD |
| `/workspaces/{**}` | `workspace-cluster` | workspace-ms (placeholder) | — |
| `/tasks/{**}` | `tasks-cluster` | tasks-ms (placeholder) | — |

All routes apply the `X-Forwarded` header transformation so downstream services can read the original client IP and protocol.

## CORS

CORS is enabled globally:

- **Allowed origins**: all (configured as wildcard — to be restricted to the Cloudflare Pages domain once all services are stable)
- **Allowed headers**: all
- **Allowed methods**: all
- **Credentials**: allowed

## SSE Passthrough Middleware

The `/stream` route requires special treatment because YARP (and Kestrel) buffer responses by default, which breaks Server-Sent Events. A custom middleware intercepts requests to `/stream` and:

1. Sets `IHttpResponseBodyFeature.DisableBuffering()` to disable Kestrel buffering.
2. Adds the `X-Accel-Buffering: no` response header to disable Nginx-style proxy buffering upstream.

This ensures SSE data is flushed to the client immediately, not held in a buffer.

## Forwarded Headers

`ForwardedHeadersMiddleware` is configured to forward:

- `X-Forwarded-For` — original client IP address
- `X-Forwarded-Proto` — original protocol (`https`)

Downstream services receive these headers and can use them for logging or IP-based logic.

## Configuration

Routes and cluster destinations are defined in `appsettings.json` under the YARP `ReverseProxy` section. No secrets are required by the gateway itself — it only routes traffic.

## Deployment

The gateway is deployed to GCP Cloud Run. Because it only proxies HTTP requests, it does not need persistent connections or special CPU settings — standard Cloud Run defaults apply.

```bash
gcloud run deploy colabboard-api-gateway \
  --image <IMAGE> \
  --region southamerica-west1 \
  --port 8080
```
