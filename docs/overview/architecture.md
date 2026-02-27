---
id: architecture
title: Architecture Overview
sidebar_label: Architecture
---

# ColabBoard — Architecture Overview

ColabBoard is a set of loosely-coupled microservices that together deliver a real-time collaborative workspace platform. Each service has a single, well-defined responsibility and communicates over HTTP or an async message bus.

## System Architecture Diagram

```mermaid
graph TB
    Client["🖥️ Web Client (EventSource)"]

    subgraph GCP["Google Cloud Platform"]
        LB["☁️ GCP Load Balancer\n(TLS, timeout: 3600s)"]
        CR["📡 SSE Service\n(Cloud Run)"]
        PubSub["📨 GCP Pub/Sub\nTopic: workspace-events"]
        SM["🔐 Secret Manager\n(JWT_SECRET)"]
    end

    subgraph SessionLayer["Session Layer"]
        SessionMS["🔐 Session Service\n(colabBoard_session_ms)"]
        SessionDB["🗄️ Session DB\n(colabBoard_session_db)"]
    end

    Client -->|"GET /stream?workspaceId=...&token=jwt"| LB
    LB --> CR
    CR -->|"Pull subscription"| PubSub
    CR -->|"Read secret"| SM
    SessionMS -->|"Publish USER_REMOVED_FROM_WORKSPACE_EVENT"| PubSub
    SessionMS --> SessionDB
    Client -->|"Auth / Session API"| SessionMS
```

## Services

| Service | Repository | Technology | Responsibility |
|---|---|---|---|
| **SSE Service** | `colabBoard_SSE_service` | ASP.NET Core 9 | Delivers real-time events to browser clients over SSE |
| **Session Service** | `colabBoard_session_ms` | TBD | Manages user sessions, workspace membership |
| **Session Database** | `colabBoard_session_db` | TBD | Persistent store for session and workspace data |
| **Web App** | `colabBoard_wa` | TBD | Browser client — consumes SSE stream, renders UI |
| **Infrastructure** | N/A | GCP | Pub/Sub, Cloud Run, Load Balancer, Secret Manager |

## Data Flow

1. A user authenticates via the **Session Service** and receives a signed JWT.
2. The browser opens a persistent `GET /stream` connection to the **SSE Service**, sending the JWT as a query parameter.
3. The **JWT Middleware** validates the token. On success the connection is registered in the in-memory `ConnectionManager`.
4. The browser receives an initial `connected` event and periodic `: heartbeat` comments to keep the TCP connection alive through load-balancer and proxy timeouts.
5. When a workspace administrator removes a user, the **Session Service** publishes a `USER_REMOVED_FROM_WORKSPACE_EVENT` to the **GCP Pub/Sub** topic.
6. The SSE Service's `EventListenerService` receives the event and calls `ConnectionManager.TerminateConnection()`, which sends an `event: connection-terminated` SSE event to the browser and closes the stream.
7. The browser `EventSource` API automatically attempts to reconnect after the configured `retry: 5000` ms delay.

## Service Dependency Map

```mermaid
graph LR
    WA["Web App"] -->|EventSource| SSE["SSE Service"]
    WA -->|REST| Session["Session Service"]
    Session -->|SQL| DB["Session DB"]
    Session -->|Publish| PubSub["GCP Pub/Sub"]
    SSE -->|Subscribe| PubSub
    SSE -->|"JWT_SECRET (env)"| Secrets["Secret Manager"]
    Session -->|"Secrets"| Secrets
```
