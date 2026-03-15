---
id: pubsub-standard
title: Pub/Sub Messaging Standard
sidebar_label: Pub/Sub Messaging Standard
---

# Pub/Sub Messaging Standard

This document defines how Google Cloud Pub/Sub is used as the event broker in ColabBoard, the canonical message schema, and the complete catalog of events each microservice is responsible for publishing and consuming.

---

## How the Broker Works

```
Microservice           Pub/Sub                  SSE Service             Browser
(publisher)            (broker)                 (consumer)
    │                     │                          │                      │
    │── publish event ──▶ │                          │                      │
    │                     │── deliver message ──────▶│                      │
    │                     │                          │── SSE event ────────▶│
    │                     │                          │  (to matching        │
    │                     │                          │   connections)       │
```

1. **Publisher** — any microservice that changes shared state (workspace-ms, tasks-ms) publishes a message to the `workspace-events` topic.
2. **Broker** — Cloud Pub/Sub durably stores the message and delivers it to all subscribers. The `colabboard-events-sub` pull subscription is consumed by the SSE service.
3. **SSE Service** — pulls messages from the subscription, inspects `eventType`, and pushes the appropriate SSE event to all browser connections scoped to the same `workspaceId` (and optionally `userId`).
4. **Browser** — the frontend's `useSSE` hook receives the event and reacts (invalidate query cache, redirect, show notification, etc.).

### Infrastructure

| Resource | Value |
|---|---|
| GCP Project | `colabboard-prod` |
| Topic | `workspace-events` |
| Subscription | `colabboard-events-sub` (pull, ack-deadline 30s) |
| Publisher SA | `colabboard-publisher-sa` → `roles/pubsub.publisher` on topic |
| Subscriber SA | `colabboard-sse-sa` → `roles/pubsub.subscriber` on subscription |

---

## Base Message Schema

Every message published to `workspace-events` **must** conform to this envelope:

```json
{
  "eventType":   "string",   // SCREAMING_SNAKE_CASE identifier — see catalog below
  "eventId":     "string",   // UUIDv4 — used for deduplication
  "version":     "string",   // schema version, e.g. "1.0"
  "timestamp":   "string",   // ISO 8601 UTC, e.g. "2026-03-15T12:00:00Z"
  "source":      "string",   // publishing service name, e.g. "workspace-ms"
  "workspaceId": "string",   // workspace this event belongs to
  "userId":      "string",   // UID of the user who triggered the action
  "payload":     {}          // event-specific data — defined per event below
}
```

### Rules

- `eventId` must be unique per event. The SSE service uses it for deduplication in future implementations.
- `timestamp` is when the action occurred on the server, not when the message was published.
- `payload` must be a JSON object (never null or an array).
- All string IDs are treated as opaque — do not assume format or length.
- Unknown `eventType` values are logged and discarded by the SSE service; they do not cause errors.

---

## Event Catalog

### workspace-ms

#### `USER_ADDED_TO_WORKSPACE_EVENT`
Published when a user is granted access to a workspace.

```json
{
  "eventType":   "USER_ADDED_TO_WORKSPACE_EVENT",
  "eventId":     "uuid",
  "version":     "1.0",
  "timestamp":   "2026-03-15T12:00:00Z",
  "source":      "workspace-ms",
  "workspaceId": "ws-abc123",
  "userId":      "uid-of-actor",
  "payload": {
    "addedUserId":   "uid-of-new-member",
    "role":          "member"
  }
}
```

**SSE behavior:** Push to all connections scoped to `workspaceId`. Frontend invalidates member list.

---

#### `USER_REMOVED_FROM_WORKSPACE_EVENT` ✅ implemented
Published when a user's access to a workspace is revoked.

```json
{
  "eventType":   "USER_REMOVED_FROM_WORKSPACE_EVENT",
  "eventId":     "uuid",
  "version":     "1.0",
  "timestamp":   "2026-03-15T12:00:00Z",
  "source":      "workspace-ms",
  "workspaceId": "ws-abc123",
  "userId":      "uid-of-actor",
  "payload": {
    "removedUserId": "uid-of-removed-member"
  }
}
```

**SSE behavior:** Terminate the SSE connection of `removedUserId` for `workspaceId` with reason `access_revoked`. Push a member list update to remaining connections.

---

#### `WORKSPACE_UPDATED_EVENT`
Published when workspace metadata (name, description) is changed.

```json
{
  "eventType":   "WORKSPACE_UPDATED_EVENT",
  "eventId":     "uuid",
  "version":     "1.0",
  "timestamp":   "2026-03-15T12:00:00Z",
  "source":      "workspace-ms",
  "workspaceId": "ws-abc123",
  "userId":      "uid-of-actor",
  "payload": {
    "name":        "New Workspace Name",
    "description": "Updated description"
  }
}
```

**SSE behavior:** Push to all connections for `workspaceId`. Frontend refreshes workspace details.

---

#### `WORKSPACE_ROLE_CHANGED_EVENT`
Published when a member's role is changed (e.g. member → admin).

```json
{
  "eventType":   "WORKSPACE_ROLE_CHANGED_EVENT",
  "eventId":     "uuid",
  "version":     "1.0",
  "timestamp":   "2026-03-15T12:00:00Z",
  "source":      "workspace-ms",
  "workspaceId": "ws-abc123",
  "userId":      "uid-of-actor",
  "payload": {
    "targetUserId": "uid-of-affected-member",
    "oldRole":      "member",
    "newRole":      "admin"
  }
}
```

**SSE behavior:** Push to all connections for `workspaceId`. Frontend refreshes permissions.

---

### tasks-ms

#### `TASK_CREATED_EVENT`
Published when a new task is created in a workspace.

```json
{
  "eventType":   "TASK_CREATED_EVENT",
  "eventId":     "uuid",
  "version":     "1.0",
  "timestamp":   "2026-03-15T12:00:00Z",
  "source":      "tasks-ms",
  "workspaceId": "ws-abc123",
  "userId":      "uid-of-creator",
  "payload": {
    "taskId":      "task-xyz",
    "title":       "New task title",
    "status":      "TODO",
    "priority":    "MEDIUM",
    "assigneeId":  "uid-of-assignee",
    "dueDate":     "2026-04-01"
  }
}
```

**SSE behavior:** Push to all connections for `workspaceId` except the creator. Frontend invalidates board task list so the new card appears.

---

#### `TASK_UPDATED_EVENT`
Published when a task's details (title, description, assignee, priority, due date) are changed.

```json
{
  "eventType":   "TASK_UPDATED_EVENT",
  "eventId":     "uuid",
  "version":     "1.0",
  "timestamp":   "2026-03-15T12:00:00Z",
  "source":      "tasks-ms",
  "workspaceId": "ws-abc123",
  "userId":      "uid-of-editor",
  "payload": {
    "taskId":     "task-xyz",
    "changes": {
      "title":       "Updated title",
      "description": "Updated description",
      "assigneeId":  "uid-of-new-assignee",
      "priority":    "HIGH",
      "dueDate":     "2026-04-10"
    }
  }
}
```

`changes` contains only the fields that changed. Omit unchanged fields.

**SSE behavior:** Push to all connections for `workspaceId` except the actor. Frontend invalidates `['task', taskId]` and `['tasks', workspaceId]`.

---

#### `TASK_STATUS_CHANGED_EVENT`
Published when a task is moved between columns (status changes). Separate from `TASK_UPDATED_EVENT` to allow lightweight handling.

```json
{
  "eventType":   "TASK_STATUS_CHANGED_EVENT",
  "eventId":     "uuid",
  "version":     "1.0",
  "timestamp":   "2026-03-15T12:00:00Z",
  "source":      "tasks-ms",
  "workspaceId": "ws-abc123",
  "userId":      "uid-of-actor",
  "payload": {
    "taskId":    "task-xyz",
    "oldStatus": "TODO",
    "newStatus": "DOING"
  }
}
```

**SSE behavior:** Push to all connections for `workspaceId` except the actor. Frontend applies an optimistic-style update to the board and syncs the detail panel.

---

#### `TASK_DELETED_EVENT`
Published when a task is permanently deleted.

```json
{
  "eventType":   "TASK_DELETED_EVENT",
  "eventId":     "uuid",
  "version":     "1.0",
  "timestamp":   "2026-03-15T12:00:00Z",
  "source":      "tasks-ms",
  "workspaceId": "ws-abc123",
  "userId":      "uid-of-actor",
  "payload": {
    "taskId": "task-xyz"
  }
}
```

**SSE behavior:** Push to all connections for `workspaceId`. Frontend removes the card from the board. If the detail panel is open for that task, close it with a toast notification.

---

## Connected Users (Presence)

Knowing which members are currently viewing a workspace requires a presence mechanism. Two approaches are available depending on requirements:

### Option A — SSE Service exposes a presence endpoint (recommended, no Pub/Sub needed)
The SSE service's `ConnectionManager` already tracks all active connections per workspace. Add an endpoint:

```
GET /stream/presence?workspaceId=<id>
Authorization: Bearer <token>
→ 200 { "connectedUserIds": ["uid-1", "uid-2"] }
```

The frontend calls this on board mount and refreshes periodically or on each `USER_SESSION_*` event.

### Option B — Publish session events via Pub/Sub
tasks-ms or a future presence-ms publishes these when users open/close a board:

#### `USER_SESSION_STARTED_EVENT`
```json
{
  "eventType":   "USER_SESSION_STARTED_EVENT",
  "eventId":     "uuid",
  "version":     "1.0",
  "timestamp":   "2026-03-15T12:00:00Z",
  "source":      "sse-service",
  "workspaceId": "ws-abc123",
  "userId":      "uid-of-user",
  "payload": {
    "displayName": "Alice Johnson",
    "avatarUrl":   "https://..."
  }
}
```

#### `USER_SESSION_ENDED_EVENT`
```json
{
  "eventType":   "USER_SESSION_ENDED_EVENT",
  "eventId":     "uuid",
  "version":     "1.0",
  "timestamp":   "2026-03-15T12:00:00Z",
  "source":      "sse-service",
  "workspaceId": "ws-abc123",
  "userId":      "uid-of-user",
  "payload": {}
}
```

**SSE behavior:** Broadcast to all other connections for `workspaceId`. Frontend shows/hides avatar in a presence bar.

---

## Frontend SSE Event Handling Reference

The frontend `useSSE` hook must handle the following named SSE events (in addition to the existing `connected` and `connection-terminated`):

| SSE Event Name | Trigger | Frontend Action |
|---|---|---|
| `connected` | on connect | set status = `connected` |
| `connection-terminated` | access revoked or server shutdown | redirect or show toast |
| `task-created` | `TASK_CREATED_EVENT` received | `invalidateQueries(['tasks', workspaceId])` |
| `task-updated` | `TASK_UPDATED_EVENT` received | `invalidateQueries(['task', taskId])` + `['tasks', workspaceId]` |
| `task-status-changed` | `TASK_STATUS_CHANGED_EVENT` received | update board optimistically |
| `task-deleted` | `TASK_DELETED_EVENT` received | remove card, close panel if open |
| `member-added` | `USER_ADDED_TO_WORKSPACE_EVENT` received | invalidate member list |
| `member-removed` | `USER_REMOVED_FROM_WORKSPACE_EVENT` (for others) | invalidate member list |
| `workspace-updated` | `WORKSPACE_UPDATED_EVENT` received | invalidate workspace details |
| `user-joined` | `USER_SESSION_STARTED_EVENT` received | add avatar to presence bar |
| `user-left` | `USER_SESSION_ENDED_EVENT` received | remove avatar from presence bar |

The SSE service is responsible for mapping each `eventType` from the Pub/Sub message to the corresponding SSE event name sent to the browser.

---

## Publishing Messages from a Microservice

### Connection Details

| Parameter | Value |
|---|---|
| GCP Project ID | `colabboard-prod` |
| Topic | `workspace-events` |
| Topic full resource name | `projects/colabboard-prod/topics/workspace-events` |

Use the official Google Cloud Pub/Sub client library for your stack. Libraries are available for all major languages and frameworks — refer to the [Google Cloud Pub/Sub client libraries documentation](https://cloud.google.com/pubsub/docs/reference/libraries).

The message body must be a **UTF-8 encoded JSON string** conforming to the base schema defined above. No custom message attributes are required.

---

### Authentication

#### Services inside the `colabboard-prod` GCP project

Services running on **Cloud Run** must have the `colabboard-publisher-sa` service account attached. Contact the infrastructure team to have it assigned to your service before deploying.

#### Services in a different GCP project or account

Pub/Sub access is controlled at the resource level — a service account from any GCP project can be granted permission to publish to a topic in `colabboard-prod`. The topic stays in `colabboard-prod`; only access is granted cross-project.

**Steps:**

1. Identify the service account your service runs as in your GCP project (e.g. `my-service@my-project.iam.gserviceaccount.com`).
2. Send that service account email to the ColabBoard infrastructure team.
3. The infra team will grant it `roles/pubsub.publisher` on the `workspace-events` topic:
   ```bash
   gcloud pubsub topics add-iam-policy-binding workspace-events \
     --member="serviceAccount:my-service@my-project.iam.gserviceaccount.com" \
     --role="roles/pubsub.publisher" \
     --project=colabboard-prod
   ```
4. In your service, point the client library at the **full topic resource name** so it resolves to the correct project:
   ```
   projects/colabboard-prod/topics/workspace-events
   ```
   This is important — if you only pass `workspace-events` without the project, the library will default to your own project and fail to find the topic.

For **local development** in this scenario, run `gcloud auth application-default login` with a Google account that has been granted publisher access, or use a service account key file provided by the infra team stored securely and never committed to source control.

| Service Account | `colabboard-publisher-sa@colabboard-prod.iam.gserviceaccount.com` |
|---|---|
| Role granted | `roles/pubsub.publisher` on the `workspace-events` topic |

When running **locally** for development, authenticate using Application Default Credentials (ADC):

```bash
gcloud auth application-default login
```

The client library will pick up credentials automatically from the environment in both cases — no API key or secret needs to be hardcoded in your service.

---

### When to Publish

Publish **after** the database write is committed and the operation is considered successful. Never publish before persisting the change — if the DB write fails after the message is sent, other services will act on an event that never actually happened.

```
1. Validate request
2. Write to database  ← commit
3. Publish event to Pub/Sub  ← only on success
4. Return response to caller
```

---

## Versioning & Backward Compatibility

- The `version` field follows semantic versioning (`major.minor`).
- **Minor bumps** (e.g. `1.0` → `1.1`): additive changes only (new optional fields in `payload`). Consumers must ignore unknown fields.
- **Major bumps** (e.g. `1.0` → `2.0`): breaking changes. A migration period where both versions are published in parallel must be coordinated across all teams before retiring the old version.
- The SSE service must not crash on unknown `eventType` or unexpected `payload` shapes — log a warning and ack the message.
