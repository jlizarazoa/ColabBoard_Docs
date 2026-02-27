---
id: gcp-pubsub
title: GCP Pub/Sub Setup
sidebar_label: GCP Pub/Sub
---

# GCP Pub/Sub Setup

GCP Pub/Sub is the production message broker used by the SSE Service to receive workspace events.

## Topic & Subscription

| Resource | Name | Description |
|---|---|---|
| Topic | `workspace-events` | Receives all workspace-related events |
| Subscription | `colabboard-sse-sub` | Pull subscription consumed by the SSE Service |

## Setup Commands

```bash
# Create the topic
gcloud pubsub topics create workspace-events --project=<PROJECT_ID>

# Create the pull subscription for the SSE Service
gcloud pubsub subscriptions create colabboard-sse-sub \
  --topic=workspace-events \
  --ack-deadline=30 \
  --project=<PROJECT_ID>
```

## IAM Permissions

```bash
# Grant the SSE Service Cloud Run SA the subscriber role
gcloud pubsub subscriptions add-iam-policy-binding colabboard-sse-sub \
  --member="serviceAccount:<SSE_SERVICE_SA>@<PROJECT_ID>.iam.gserviceaccount.com" \
  --role="roles/pubsub.subscriber"
```

## Message Schema

All messages must be JSON with this shape:

```json
{
  "eventType": "USER_REMOVED_FROM_WORKSPACE_EVENT",
  "userId": "user-123",
  "workspaceId": "ws-456",
  "timestamp": "2026-02-26T12:00:00Z"
}
```

## Publish a Test Event (local testing)

```bash
gcloud pubsub topics publish workspace-events \
  --message='{"eventType":"USER_REMOVED_FROM_WORKSPACE_EVENT","userId":"user-123","workspaceId":"ws-1","timestamp":"2026-02-26T12:00:00Z"}' \
  --project=<PROJECT_ID>
```
