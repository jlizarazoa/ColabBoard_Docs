---
id: gcp-pubsub
title: Configuración de GCP Pub/Sub
sidebar_label: GCP Pub/Sub
---

# Configuración de GCP Pub/Sub

GCP Pub/Sub es el broker de mensajes en producción utilizado por el SSE Service para recibir eventos de workspace.

## Topic y Suscripción

| Recurso | Nombre | Descripción |
|---|---|---|
| Topic | `workspace-events` | Recibe todos los eventos relacionados con workspaces |
| Suscripción | `colabboard-sse-sub` | Suscripción pull consumida por el SSE Service |

## Comandos de Configuración

```bash
# Crear el topic
gcloud pubsub topics create workspace-events --project=<PROJECT_ID>

# Crear la suscripción pull para el SSE Service
gcloud pubsub subscriptions create colabboard-sse-sub \
  --topic=workspace-events \
  --ack-deadline=30 \
  --project=<PROJECT_ID>
```

## Permisos IAM

```bash
# Otorgar al SA de Cloud Run del SSE Service el rol de suscriptor
gcloud pubsub subscriptions add-iam-policy-binding colabboard-sse-sub \
  --member="serviceAccount:<SSE_SERVICE_SA>@<PROJECT_ID>.iam.gserviceaccount.com" \
  --role="roles/pubsub.subscriber"
```

## Esquema del Mensaje

Todos los mensajes deben ser JSON con esta estructura:

```json
{
  "eventType": "USER_REMOVED_FROM_WORKSPACE_EVENT",
  "userId": "user-123",
  "workspaceId": "ws-456",
  "timestamp": "2026-02-26T12:00:00Z"
}
```

## Publicar un Evento de Prueba (testing local)

```bash
gcloud pubsub topics publish workspace-events \
  --message='{"eventType":"USER_REMOVED_FROM_WORKSPACE_EVENT","userId":"user-123","workspaceId":"ws-1","timestamp":"2026-02-26T12:00:00Z"}' \
  --project=<PROJECT_ID>
```
