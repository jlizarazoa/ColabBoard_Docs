---
id: overview
title: Web App
sidebar_label: Overview
---

# Web App

The `colabBoard_wa` is a **React 19** single-page application that provides the ColabBoard user interface. It is deployed on **Cloudflare Pages** and communicates exclusively through the **API Gateway**.

## Technology Stack

| Dependency | Version | Purpose |
|---|---|---|
| React | 19 | UI framework |
| TypeScript | 5 | Type safety |
| Vite | 6 | Build tool (required by Cloudflare Pages v2) |
| React Router DOM | 7 | Client-side routing |
| TanStack React Query | 5 | Server state, caching, background refetch |
| Zustand | 5 | Client state (auth, profile, theme) |
| Axios | — | HTTP client with auth interceptor |
| @dnd-kit | — | Drag-and-drop for Kanban columns |
| Tailwind CSS | 4 | Utility CSS (PostCSS) |
| Sonner | — | Toast notifications |
| date-fns | — | Date formatting |
| MSW | v2 | API mocking in local development |

## Deployment

| Setting | Value |
|---|---|
| Hosting | Cloudflare Pages (Workers mode) |
| GitHub repo | `ColabBoard/ColabBoard_FE` (branch: `master`) |
| Auto-deploy | Every push to `master` triggers a new deployment |
| SPA routing | `wrangler.toml` → `not_found_handling = "single-page-application"` |
| API base URL | `VITE_API_BASE_URL` (set in Cloudflare dashboard) |

Environment variables are **not committed to source control** — they are set in the Cloudflare dashboard:

| Variable | Value |
|---|---|
| `VITE_API_BASE_URL` | `https://colabboard-api-gateway-173469174364.southamerica-west1.run.app` |
| `VITE_USE_MOCKS` | `false` |

## Routes

| Path | Access | Description |
|---|---|---|
| `/login` | Public | Email + password login |
| `/register` | Public | New account registration |
| `/workspaces` | Protected | Workspace grid dashboard |
| `/workspaces/:id` | Protected | Kanban board for a workspace |
| `/profile/setup` | Protected | First-time profile setup |

Protected routes are wrapped in a `ProtectedRoute` component that redirects unauthenticated users to `/login`.

## Authentication

1. Login posts to `/auth/login` via the API Gateway (proxied to Sessions MS).
2. The Sessions MS returns an `idToken` (JWT).
3. The token and user metadata (`uid`, `email`) are stored in **Zustand `authStore`**, persisted to `localStorage`.
4. Every Axios request automatically attaches `Authorization: Bearer <idToken>` via a request interceptor.
5. On logout, `clearAuth()` wipes the store and `localStorage`.

Browser `EventSource` (used for SSE) cannot set HTTP headers, so the token is passed as the `?token=` query parameter to `/stream`.

## Features

### Workspace Dashboard

- Fetches the user's workspaces from `GET /workspaces`.
- Displays workspaces as a responsive card grid with name, description, member count, and creation date.
- Create-workspace modal posts to `POST /workspaces`.
- Skeleton loaders while data is fetching.

### Kanban Board

- Fetches tasks from `GET /tasks?workspaceId=<id>` and groups them by status into three columns: **TODO**, **DOING**, **DONE**.
- Drag-and-drop powered by **@dnd-kit** with a `PointerSensor` (5 px activation distance to prevent accidental drag on click).
- Dragging a card triggers an **optimistic update**: the task moves immediately in the local React Query cache. The `PATCH /tasks/:id/status` request runs in the background; if it fails, the cache is restored from a pre-drag snapshot.
- A drag overlay with a rotation and shadow effect shows the card being dragged.

### Task Detail Panel

- Clicking a task card opens a slide-in drawer on the right.
- Two tabs: **Details** (editable fields) and **History** (audit trail).
- Task fields: title, description, status (`TODO`/`DOING`/`DONE`), priority (`LOW`/`MEDIUM`/`HIGH`), assignee avatar, due date.
- The **Edit** form saves changes via `PUT /tasks/:id`.
- The **Undo** button reverts the most recent change.
- History tab shows a chronological list of changes with timestamps.

### Real-Time SSE

- On board mount, `useSSE()` opens an `EventSource` to `/stream?workspaceId=<id>&token=<idToken>`.
- An `SSEStatusIndicator` component shows the connection state:
  - Amber pulse → connecting
  - Teal pulse → connected
  - Red → disconnected
- Event handlers:

| SSE Event | Reason | Frontend Action |
|---|---|---|
| `connected` | — | Set status = `connected` |
| `connection-terminated` | `access_revoked` | Clear workspace from state, redirect to `/workspaces`, show toast |
| `connection-terminated` | `server_shutdown` | Show "Reconnecting…" toast; `EventSource` auto-reconnects after 5 s |

### Profile

- On every protected page load, `useProfile()` checks for an existing profile via `GET /api/profile/me` (with `X-USER-ID` header).
- If no profile exists, the user is redirected to `/profile/setup`.
- `ProfileSetupPage` collects `username`, `full_name`, and `avatar_url`, then posts to `POST /api/profile`.

## State Management

Three Zustand stores, all persisted to `localStorage`:

| Store | Fields | Methods |
|---|---|---|
| `authStore` | `idToken`, `uid`, `email`, `isAuthenticated` | `setAuth()`, `clearAuth()` |
| `profileStore` | `profile` | `setProfile()`, `clearProfile()` |
| `themeStore` | `theme` (dark / light) | `toggleTheme()` |

## Data Fetching

- **Axios client** (`src/api/apiClient.ts`): base URL from `VITE_API_BASE_URL`, auto-attaches `Authorization` header.
- **React Query client**: `staleTime: 30 000 ms`, `retry: 1`.
- Query keys: `['workspaces']`, `['tasks', workspaceId]`, `['task', taskId]`, `['profile']`.
- Profile endpoints additionally send `X-USER-ID: <uid>` per-request.

## Local Development with MSW Mocks

Workspace and task endpoints are mocked in development so the frontend can run without a live backend:

```bash
# .env.local
VITE_API_BASE_URL=http://localhost:5173  # not used — MSW intercepts
VITE_USE_MOCKS=true
```

Auth (`/auth/*`), profile (`/api/profile/*`), and SSE (`/stream`) always hit the real backend regardless of `VITE_USE_MOCKS`.

## Design System

Custom CSS properties on `:root` / `.dark`:

| Token | Purpose |
|---|---|
| `--cb-bg` | Page background |
| `--cb-surface` | Card / panel background |
| `--cb-accent` | Primary brand colour |
| `--cb-border-*` | Border shades |

Typefaces: **Syne** (headings, weight 400–800) + **Outfit** (body, weight 300–600).

Utility classes: `cb-input`, `cb-label`, `cb-btn-primary`, `cb-btn-ghost`, `cb-skeleton`.

Animations: `fade-in`, `fade-in-up`.

Dark mode toggled by adding / removing the `dark` class on `<html>`.

## Project Structure

```
colabBoard_wa/
├── src/
│   ├── App.tsx                  # QueryClientProvider + RouterProvider
│   ├── router/index.tsx         # Route definitions
│   ├── api/apiClient.ts         # Axios client with auth interceptor
│   ├── mocks/                   # MSW setup and handlers
│   ├── lib/jwt.ts               # JWT decoding utilities
│   ├── store/                   # Zustand stores (auth, profile, theme)
│   └── features/
│       ├── auth/                # Login, register, hooks
│       ├── workspaces/          # Workspace grid, create modal, hooks
│       ├── board/               # Kanban board, SSE hook, status indicator
│       ├── tasks/               # Task detail panel, edit form, history, hooks
│       └── profile/             # Profile setup page, hooks
├── wrangler.toml                # Cloudflare Pages SPA routing config
└── vite.config.ts
```

## Running Locally

```bash
cd colabBoard_wa
npm install

# create a local env file
echo "VITE_API_BASE_URL=https://colabboard-api-gateway-173469174364.southamerica-west1.run.app" > .env.local
echo "VITE_USE_MOCKS=true" >> .env.local

npm run dev
# App available at http://localhost:5173
```
