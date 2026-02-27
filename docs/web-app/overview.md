---
id: overview
title: Web App
sidebar_label: Overview
---

# Web App

> **Coming soon** — to be documented by the Web App team.

The `colabBoard_wa` is the browser-side application that renders the collaborative workspace UI.

## Planned Coverage

- `EventSource` integration with the SSE Service
- Token acquisition and query-string token passing
- Handling `connected`, `connection-terminated`, and reconnection logic
- UI components and state management
- Build and deployment

## EventSource Quick Reference

```javascript
const es = new EventSource(
  `/stream?workspaceId=${workspaceId}&token=${jwt}`
);

es.addEventListener('connected', (e) => { /* stream open */ });
es.addEventListener('connection-terminated', (e) => {
  const { reason } = JSON.parse(e.data);
  if (reason === 'access_revoked') es.close();
});
```

---

*To add documentation, create `.md` files in `docs/web-app/`, update `sidebars.ts`, and submit a PR. See [Contributing](../contributing) for details.*
