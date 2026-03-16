---
id: deployment
title: Docker & Despliegue
sidebar_label: Docker & Despliegue
---

# Docker & Despliegue

## Docker

### Dockerfile Multi-Etapa

El servicio usa un Dockerfile de dos etapas para minimizar el tamaño de la imagen:

| Etapa | Imagen base | Propósito |
|---|---|---|
| `build` | `mcr.microsoft.com/dotnet/sdk:9.0` | Restaurar, compilar y publicar |
| `runtime` | `mcr.microsoft.com/dotnet/aspnet:9.0-alpine` | Ejecutar el output publicado |

El servicio se ejecuta como **usuario no root** (`appuser`) dentro del contenedor.

### Build

```bash
docker build -t colabboard-sse:latest .
```

### Ejecutar (local)

```bash
docker run --rm -p 8080:8080 \
  -e JWT_SECRET="my-local-dev-secret-at-least-32-chars!" \
  colabboard-sse:latest
```

### Ejecutar (con RabbitMQ)

```bash
# 1. Iniciar RabbitMQ
docker run -d -p 5672:5672 -p 15672:15672 --name rabbitmq rabbitmq:3-management

# 2. Iniciar el SSE Service conectado a RabbitMQ
docker run --rm -p 8080:8080 \
  -e JWT_SECRET="my-local-dev-secret-at-least-32-chars!" \
  -e MESSAGING_PROVIDER=RabbitMQ \
  -e RABBITMQ_CONNECTION_STRING="amqp://guest:guest@host.docker.internal" \
  colabboard-sse:latest
```

### Verificar que falla sin JWT_SECRET

```bash
docker run --rm colabboard-sse:latest
# Esperado: InvalidOperationException: Missing required configuration: 'JWT_SECRET'
```

---

## Despliegue en GCP

### Subir al Container Registry

```bash
# Etiquetar para GCP Artifact Registry
docker tag colabboard-sse:latest gcr.io/<PROJECT_ID>/colabboard-sse:latest

# Push
docker push gcr.io/<PROJECT_ID>/colabboard-sse:latest
```

### Desplegar en Cloud Run

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

:::tip Usa Secret Manager para JWT_SECRET
En producción, monta `JWT_SECRET` desde **GCP Secret Manager** en lugar de pasarlo directamente como variable de entorno:
```bash
--set-secrets JWT_SECRET=colabboard-jwt-secret:latest
```
:::

---

## Configuración del GCP Load Balancer

El GCP Load Balancer debe configurarse con timeouts extendidos para soportar conexiones SSE de larga duración:

| Configuración | Valor recomendado | Motivo |
|---|---|---|
| **Timeout del Backend Service** | `3600s` | Mantiene las conexiones SSE activas hasta 1 hora |
| **Timeout de Connection Draining** | `300s` | Permite que las conexiones en curso se drenen durante los despliegues |
| **Timeout de Request en Cloud Run** | `3600s` | Debe coincidir con el timeout del backend |
| **Asignación de CPU** | Siempre (`--no-cpu-throttling`) | Evita la suspensión de CPU en conexiones SSE inactivas |
| **Min Instances** | `1` | Elimina la latencia de cold-start para conexiones persistentes |
| **Session Affinity** | `NONE` | Las conexiones son stateless por instancia; el balanceo es libre |

---

## Apagado Graceful

Cuando el contenedor recibe `SIGTERM` (p. ej. `docker stop` o scale-down de Cloud Run):

```mermaid
sequenceDiagram
    participant Docker/CR as Docker / Cloud Run
    participant Host as .NET Host
    participant CM as ConnectionManager
    participant Client as Cliente Navegador

    Docker/CR->>Host: SIGTERM
    Host->>CM: ApplicationStopping → TerminateAll("server_shutdown")
    CM->>Client: event: connection-terminated\ndata: {"reason":"server_shutdown"}
    Note over Host: Thread.Sleep(500ms)
    Host->>Host: Proceso termina
    Client->>Client: EventSource se reconecta automáticamente tras retry: 5000ms
```

1. Se dispara `ApplicationStopping` → `ConnectionManager.TerminateAll("server_shutdown")`
2. Todos los clientes conectados reciben `event: connection-terminated` con `reason: "server_shutdown"`.
3. Una espera de 500ms da tiempo a los hilos de request para enviar el evento de terminación antes de que el proceso finalice.
4. El `EventSource` del navegador se reconecta automáticamente tras 5 segundos.

---

## Pruebas de Carga

```bash
# Instalar k6: https://k6.io/docs/get-started/installation/
k6 run --vus 1000 --duration 60s k6-load-test.js
```
