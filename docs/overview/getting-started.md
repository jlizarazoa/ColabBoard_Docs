---
id: getting-started
title: Getting Started
sidebar_label: Getting Started
---

# Getting Started

This guide walks a new developer through setting up a local ColabBoard development environment.

## Prerequisites

| Tool | Version | Purpose |
|---|---|---|
| [.NET 9 SDK](https://dotnet.microsoft.com/download) | 9.0+ | Build and run the SSE Service |
| [Docker Desktop](https://www.docker.com/products/docker-desktop/) | 24+ | Containerised runs |
| [Node.js](https://nodejs.org/) | 20+ | Web App frontend |
| [gcloud CLI](https://cloud.google.com/sdk/docs/install) | Latest | GCP deployment |
| [RabbitMQ](https://www.rabbitmq.com/) | 3.x | Local event broker (optional) |

## Clone the Repositories

```bash
# SSE Service
git clone https://github.com/tomasparramonroy/colabBoard_SSE_service.git
cd colabBoard_SSE_service
```

## Start the SSE Service locally

```bash
# 1. Set the required JWT_SECRET environment variable (min 32 characters)
$env:JWT_SECRET = "my-local-dev-secret-at-least-32-chars!"

# 2. Run the service (listens on http://localhost:5263)
dotnet run --project src/ColabBoard.SSE

# 3. In another terminal, generate a test JWT
.\gen-token.ps1

# 4. Open an SSE stream
curl.exe -N "http://localhost:5263/stream?workspaceId=ws-1&token=<generated_token>"

# 5. Check health
curl.exe "http://localhost:5263/health"
```

## Start RabbitMQ (optional — for local event testing)

```bash
docker run -d -p 5672:5672 -p 15672:15672 rabbitmq:3-management
```

Then set these additional environment variables before starting the SSE Service:

```bash
$env:MESSAGING_PROVIDER = "RabbitMQ"
$env:RABBITMQ_CONNECTION_STRING = "amqp://guest:guest@localhost"
```

## Run tests

```bash
dotnet test
```

## Start the Web App locally

```bash
cd colabBoard_wa
npm install

# create a local env file
echo "VITE_API_BASE_URL=https://colabboard-api-gateway-173469174364.southamerica-west1.run.app" > .env.local
echo "VITE_USE_MOCKS=true" >> .env.local

npm run dev
# App available at http://localhost:5173
```

With `VITE_USE_MOCKS=true`, workspace and task endpoints are handled by **MSW** (Mock Service Worker) so no local backend is required. Auth, profile, and SSE always hit the real backend.

## Next Steps

- Read the [SSE Service overview](../sse-service/overview) to understand the service architecture.
- Read the [Web App overview](../web-app/overview) to understand the frontend.
- Read the [API Gateway overview](../api-gateway/overview) for the proxy routing table.
- Review the [Configuration Reference](../sse-service/configuration) for all environment variables.
- See the [Deployment guide](../sse-service/deployment) for Docker and GCP Cloud Run instructions.
