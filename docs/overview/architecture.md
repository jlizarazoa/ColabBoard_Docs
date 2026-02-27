---
id: architecture
title: Architecture Overview
sidebar_label: Architecture
---

# ColabBoard — Architecture Overview

ColabBoard is a set of microservices that together deliver a real-time collaborative workspace platform. This page documents the system as it is known today; sections for other services will be added in future iterations.

## SSE Service Architecture

```mermaid
graph TB
    Client["🖥️ Web Client (EventSource)"]

    subgraph GCP["Google Cloud Platform"]
        LB["☁️ GCP Load Balancer\n(TLS, timeout: 3600s)"]
        CR["📡 SSE Service\n(Cloud Run)"]
        PubSub["📨 GCP Pub/Sub\nTopic: workspace-events"]
        SM["🔐 Secret Manager\n(JWT_SECRET)"]
    end

    Client -->|"GET /stream?workspaceId=...&token=jwt"| LB
    LB --> CR
    CR -->|"Pull subscription"| PubSub
    CR -->|"JWT_SECRET env var"| SM
```

## SSE Service Internal Components

```mermaid
flowchart TD
    MW["JwtQueryStringMiddleware"]
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

## Data Flow

1. The browser opens a persistent `GET /stream?workspaceId=...&token=<jwt>` connection to the **SSE Service**.
2. **`JwtQueryStringMiddleware`** validates the HS256 JWT. On success, `userId` is stored in `HttpContext.Items`.
3. **`StreamEndpoint`** sets SSE headers and writes the initial `connected` event with `retry: 5000`.
4. The connection is registered in **`ConnectionManager`**. Periodic `: heartbeat` comments keep the TCP connection alive.
5. **`EventListenerService`** receives a `USER_REMOVED_FROM_WORKSPACE_EVENT` from Pub/Sub and calls `ConnectionManager.TerminateConnection()`, which sends `event: connection-terminated` to the browser.
6. The browser `EventSource` automatically reconnects after 5 seconds.

## Services

| Service | Repository | Technology | Status |
|---|---|---|---|
| **SSE Service** | `colabBoard_SSE_service` | ASP.NET Core 9 | Documented |
| **Session Service** | `colabBoard_session_ms` | — | Coming soon |
| **Session Database** | `colabBoard_session_db` | — | Coming soon |
| **Web App** | `colabBoard_wa` | — | Coming soon |
