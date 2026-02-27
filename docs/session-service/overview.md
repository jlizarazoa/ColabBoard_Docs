---
id: overview
title: Session Service
sidebar_label: Overview
---

# Session Service

> **Coming soon** — to be documented by the Session Service team.

The `colabBoard_session_ms` microservice is responsible for managing user sessions and workspace membership in ColabBoard.

## Responsibilities (planned)

- Authenticate users and issue JWTs signed with the shared `JWT_SECRET`.
- Manage workspace membership (add/remove users).
- Publish `USER_REMOVED_FROM_WORKSPACE_EVENT` to the GCP Pub/Sub `workspace-events` topic when a user is removed from a workspace.

## Integration Points

| Integration | Direction | Protocol |
|---|---|---|
| Session DB (`colabBoard_session_db`) | Read/Write | SQL |
| GCP Pub/Sub `workspace-events` | Publish | Pub/Sub |
| Web App (`colabBoard_wa`) | Serves | REST / HTTP |

---

*To add documentation for this service, create `.md` files in `docs/session-service/`, update `sidebars.ts`, and submit a PR. See [Contributing](../contributing) for details.*
