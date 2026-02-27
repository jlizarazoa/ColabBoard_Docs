---
id: cloud-run
title: Cloud Run Configuration
sidebar_label: Cloud Run
---

# Cloud Run Configuration

The SSE Service runs on **GCP Cloud Run** with settings tuned for persistent SSE connections.

## Recommended Service Configuration

| Setting | Value | Reason |
|---|---|---|
| Container port | `8080` | Default Kestrel port inside the container |
| CPU allocation | Always (`--no-cpu-throttling`) | Prevents CPU suspension on idle SSE connections |
| Minimum instances | `1` | Eliminates cold-start latency for first connection |
| Request timeout | `3600s` | Must match Load Balancer backend timeout |
| Concurrency | `1000` (default) | Each SSE connection is a long-lived request |

## Deploy Command

```bash
gcloud run deploy colabboard-sse \
  --image gcr.io/<PROJECT_ID>/colabboard-sse:latest \
  --region <REGION> \
  --port 8080 \
  --no-cpu-throttling \
  --min-instances 1 \
  --timeout 3600 \
  --set-secrets JWT_SECRET=colabboard-jwt-secret:latest \
  --set-env-vars MESSAGING_PROVIDER=PubSub,PUBSUB_PROJECT_ID=<PROJECT_ID>,PUBSUB_SUBSCRIPTION_ID=colabboard-sse-sub
```

## Service Account

Create a dedicated service account and grant only the required roles:

```bash
# Create service account
gcloud iam service-accounts create colabboard-sse-sa \
  --display-name="ColabBoard SSE Service Account"

# Grant Pub/Sub subscriber
gcloud pubsub subscriptions add-iam-policy-binding colabboard-sse-sub \
  --member="serviceAccount:colabboard-sse-sa@<PROJECT_ID>.iam.gserviceaccount.com" \
  --role="roles/pubsub.subscriber"

# Grant Secret Manager secret accessor
gcloud secrets add-iam-policy-binding colabboard-jwt-secret \
  --member="serviceAccount:colabboard-sse-sa@<PROJECT_ID>.iam.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```
