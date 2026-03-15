---
id: architecture
title: Architecture Overview
sidebar_label: Architecture
---

# ColabBoard — Architecture Overview

ColabBoard is a set of microservices that together deliver a real-time collaborative workspace platform.

## Full System Architecture

```mermaid
graph TB
    CF["☁️ Cloudflare Pages\n(React 19 SPA)"]

    subgraph GW["API Gateway — Cloud Run (southamerica-west1)"]
        YARP["YARP Reverse Proxy\n(.NET 9)"]
    end

    subgraph Services["Microservices — Cloud Run (us-central1)"]
        SessionsMS["🔐 Sessions MS\n(Auth: login / register / verify)"]
        ProfileMS["👤 Profile MS\n(Profile CRUD)"]
        SSEService["📡 SSE Service\n(Real-time events)"]
    end

    subgraph GCP["GCP Infrastructure"]
        PubSub["📨 Pub/Sub\nTopic: workspace-events\nSub: colabboard-events-sub"]
        LB["☁️ GCP Load Balancer\n(timeout: 3600s)"]
    end

    CF -->|"All API calls\nVITE_API_BASE_URL"| YARP
    YARP -->|"/auth/{**}"| SessionsMS
    YARP -->|"/api/profile/{**}"| ProfileMS
    YARP -->|"/stream\n(SSE passthrough)"| LB
    LB --> SSEService
    SSEService -->|"Pull subscription"| PubSub
```

## Request Flow

| Browser Request | Route | Handled By |
|---|---|---|
| `POST /auth/login` | API Gateway → Sessions MS | Authentication |
| `POST /auth/register` | API Gateway → Sessions MS | Registration |
| `GET /api/profile/me` | API Gateway → Profile MS | Profile fetch |
| `POST /api/profile` | API Gateway → Profile MS | Profile creation |
| `GET /stream?...&token=...` | API Gateway → Load Balancer → SSE Service | Real-time events |

## SSE Service Internal Components

```mermaid
flowchart TD
    MW["JwtQueryStringMiddleware\n(validates token via Sessions MS)"]
    EP["GET /stream\nStreamEndpoint"]
    CM["ConnectionManager\n(ConcurrentDictionary)"]
    ELS["EventListenerService\n(BackgroundService)"]
    SUB["IEventSubscriber\n├ PubSubEventSubscriber\n├ RabbitMqEventSubscriber\n└ NullEventSubscriber"]

    MW -->|"userId injected"| EP
    EP <-->|"Register / Remove"| CM
    ELS --> SUB
    ELS -->|"TerminateConnection"| CM
    CM -->|"CTS.Cancel()"| EP
```

## SSE Data Flow (step-by-step)

1. The browser opens a persistent `GET /stream?workspaceId=...&token=<jwt>` connection via `EventSource`.
2. The **API Gateway** proxies the request to the **SSE Service** with response buffering disabled.
3. **`JwtQueryStringMiddleware`** validates the token by calling Sessions MS `/auth/verify`. On success, `userId` is stored in `HttpContext.Items`.
4. **`StreamEndpoint`** sets SSE headers and writes the initial `connected` event with `retry: 5000`.
5. The connection is registered in **`ConnectionManager`**. Periodic `heartbeat` comments keep the TCP connection alive every 15 s.
6. **`EventListenerService`** receives a `USER_REMOVED_FROM_WORKSPACE_EVENT` from Pub/Sub and calls `ConnectionManager.TerminateConnection()`, which sends `event: connection-terminated` to the browser.
7. The browser's `useSSE` hook handles the event — for `access_revoked` it redirects to `/workspaces`; for `server_shutdown` it shows a "Reconnecting…" toast and allows `EventSource` to auto-reconnect after 5 s.

## Services

| Service | Technology | Status | Cloud Run Region |
|---|---|---|---|
| **Web App** | React 19, Vite 6 | Deployed (Cloudflare Pages) | — |
| **API Gateway** | .NET 9, YARP | Deployed | `southamerica-west1` |
| **SSE Service** | .NET 9, ASP.NET Core | Deployed | `southamerica-west1` |
| **Sessions MS** | — | Deployed | `us-central1` |
| **Profile MS** | — | Deployed | `us-central1` |
| **Workspace MS** | — | Planned | — |
| **Tasks MS** | — | Planned | — |
