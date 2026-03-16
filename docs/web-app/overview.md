---
id: overview
title: Web App
sidebar_label: Visión General
---

# Web App

## ¿Qué es ColabBoard?

ColabBoard es una **plataforma web de gestión de proyectos colaborativos** que permite a equipos trabajar juntos en tareas organizadas en tableros visuales estilo Kanban. Imagina Trello o Jira, pero diseñado específicamente para colaboración en tiempo real.

La aplicación web (`ColabBoard_FE`) es la **interfaz de usuario** que los usuarios finales ven y usan. Está construida como una aplicación React moderna y se despliega en Cloudflare Pages.

## ¿Qué puedes hacer en ColabBoard?

### Para Usuarios Individuales
- **Crear cuenta**: Regístrate con email y contraseña
- **Configurar perfil**: Nombre de usuario, foto, preferencias
- **Crear espacios de trabajo**: Organiza tus proyectos

### Para Equipos
- **Invitar miembros**: Añade colaboradores a tus espacios de trabajo
- **Crear tareas**: Define qué hacer, cuándo y quién lo hace
- **Organizar en tableros**: Arrastra tareas entre columnas (Por Hacer, En Progreso, Hecho)
- **Ver progreso en tiempo real**: Actualizaciones instantáneas cuando alguien mueve una tarea
- **Historial de cambios**: Revisa quién cambió qué y cuándo

## Cómo funciona técnicamente

### Arquitectura General
```
Usuario → Navegador Web → ColabBoard_FE (React) → API Gateway → Microservicios
```

La aplicación web:
- **No almacena datos**: Todo se guarda en bases de datos de los microservicios
- **Se comunica vía APIs**: Envía requests HTTP a los servicios backend
- **Actualiza en tiempo real**: Recibe notificaciones vía Server-Sent Events (SSE)

### Tecnologías Principales

| Tecnología | ¿Para qué sirve? | ¿Por qué la elegimos? |
|------------|------------------|----------------------|
| **React 19** | Construir la interfaz de usuario | Framework moderno, componentes reutilizables |
| **TypeScript** | Añadir tipos a JavaScript | Previene errores, mejor desarrollo |
| **Vite** | Construir y servir la app | Rápido, compatible con Cloudflare |
| **TailwindCSS** | Estilos y diseño | Rápido de usar, consistente |
| **Zustand** | Recordar estado (login, tema) | Simple, sin boilerplate |
| **React Query** | Cargar datos del servidor | Caching automático, manejo de errores |

## Flujo de Uso Típico

1. **Registro/Login**: Usuario crea cuenta o inicia sesión
2. **Dashboard**: Ve lista de espacios de trabajo
3. **Crear Workspace**: Nuevo proyecto/equipo
4. **Invitar Miembros**: Añadir compañeros
5. **Crear Tareas**: Definir trabajo por hacer
6. **Trabajar**: Mover tareas por el tablero Kanban
7. **Colaborar**: Ver cambios de otros en tiempo real

## Características Destacadas

### Tablero Kanban Interactivo
- **3 columnas**: TODO (por hacer), DOING (en progreso), DONE (hecho)
- **Arrastrar y soltar**: Mueve tareas fácilmente
- **Actualizaciones optimistas**: Los cambios aparecen inmediatamente
- **Corrección automática**: Si algo falla, se revierte

### Tiempo Real
- **Presencia**: Ve quién más está viendo el tablero
- **Notificaciones**: Toasts para eventos importantes
- **Sincronización**: Cambios se propagan instantáneamente

### Gestión de Tareas
- **Detalles completos**: Título, descripción, prioridad, fecha límite
- **Asignación**: Quién es responsable
- **Historial**: Registro de todos los cambios
- **Deshacer**: Revertir cambios recientes

## Desarrollo y Despliegue

### Para Desarrolladores
```bash
# Instalar dependencias
npm install

# Ejecutar localmente
npm run dev

# Construir para producción
npm run build
```

### Despliegue Automático
- **Plataforma**: Cloudflare Pages
- **Trigger**: Push a rama `master`
- **URL**: Automática en `colabboard.github.io`

## ¿Quieres contribuir?

La aplicación está diseñada para ser **modular y extensible**. Cada "feature" (autenticación, tablero, tareas) está en su propia carpeta, facilitando añadir nuevas funcionalidades.

Si eres nuevo en React, esta es una excelente aplicación para aprender patrones modernos de desarrollo frontend.

## Despliegue

| Configuración | Valor |
|---|---|
| Hosting | Cloudflare Pages (Workers mode) |
| Repositorio GitHub | `ColabBoard/ColabBoard_FE` (rama: `master`) |
| Despliegue automático | Cada push a `master` dispara un nuevo despliegue |
| Enrutamiento SPA | `wrangler.toml` → `not_found_handling = "single-page-application"` |
| URL base de la API | `VITE_API_BASE_URL` (configurado en el dashboard de Cloudflare) |

Las variables de entorno **no se incluyen en el control de versiones** — se configuran en el dashboard de Cloudflare:

| Variable | Valor |
|---|---|
| `VITE_API_BASE_URL` | `https://colabboard-api-gateway-173469174364.southamerica-west1.run.app` |
| `VITE_USE_MOCKS` | `false` |

## Rutas

| Ruta | Acceso | Descripción |
|---|---|---|
| `/login` | Pública | Login con email y contraseña |
| `/register` | Pública | Registro de nueva cuenta |
| `/workspaces` | Protegida | Dashboard con grid de workspaces |
| `/workspaces/:id` | Protegida | Tablero Kanban de un workspace |
| `/profile/setup` | Protegida | Configuración inicial de perfil |

Las rutas protegidas están envueltas en un componente `ProtectedRoute` que redirige a los usuarios no autenticados a `/login`.

## Autenticación

1. El login hace un POST a `/auth/login` via el API Gateway (redirigido al Sessions MS).
2. El Sessions MS devuelve un `idToken` (JWT).
3. El token y los metadatos del usuario (`uid`, `email`) se almacenan en **Zustand `authStore`**, persistido en `localStorage`.
4. Cada request de Axios adjunta automáticamente `Authorization: Bearer <idToken>` mediante un interceptor.
5. Al cerrar sesión, `clearAuth()` limpia el store y `localStorage`.

El `EventSource` del navegador (usado para SSE) no puede establecer headers HTTP, por lo que el token se pasa como parámetro `?token=` a `/stream`.

## Funcionalidades

### Panel de Workspaces

- Obtiene los workspaces del usuario desde `GET /workspaces`.
- Muestra los workspaces como una grid responsive de tarjetas con nombre, descripción, número de miembros y fecha de creación.
- El modal de creación hace POST a `POST /workspaces`.
- Skeleton loaders mientras se cargan los datos.

### Tablero Kanban

- Obtiene las tareas desde `GET /tasks?workspaceId=<id>` y las agrupa por estado en tres columnas: **TODO**, **DOING**, **DONE**.
- Drag-and-drop impulsado por **@dnd-kit** con un `PointerSensor` (distancia de activación de 5 px para evitar arrastres accidentales al hacer clic).
- Arrastrar una tarjeta dispara una **actualización optimista**: la tarea se mueve inmediatamente en la caché local de React Query. El request `PATCH /tasks/:id/status` se ejecuta en segundo plano; si falla, la caché se restaura desde un snapshot previo al arrastre.
- Un overlay de arrastre con efecto de rotación y sombra muestra la tarjeta siendo arrastrada.

### Panel de Detalle de Tarea

- Hacer clic en una tarjeta abre un drawer deslizante en la derecha.
- Dos pestañas: **Detalles** (campos editables) e **Historial** (registro de auditoría).
- Campos de tarea: título, descripción, estado (`TODO`/`DOING`/`DONE`), prioridad (`LOW`/`MEDIUM`/`HIGH`), avatar del asignado, fecha límite.
- El formulario de **Edición** guarda cambios via `PUT /tasks/:id`.
- El botón **Deshacer** revierte el cambio más reciente.
- La pestaña de Historial muestra una lista cronológica de cambios con timestamps.

### SSE en Tiempo Real

- Al montar el tablero, `useSSE()` abre un `EventSource` hacia `/stream?workspaceId=<id>&token=<idToken>`.
- Un componente `SSEStatusIndicator` muestra el estado de la conexión:
  - Pulso ámbar → conectando
  - Pulso teal → conectado
  - Rojo → desconectado
- Manejadores de eventos:

| Evento SSE | Razón | Acción en el Frontend |
|---|---|---|
| `connected` | — | Establecer estado = `connected` |
| `connection-terminated` | `access_revoked` | Limpiar workspace del estado, redirigir a `/workspaces`, mostrar toast |
| `connection-terminated` | `server_shutdown` | Mostrar toast "Reconectando…"; `EventSource` se reconecta automáticamente tras 5 s |

### Perfil

- En cada carga de página protegida, `useProfile()` comprueba si existe perfil via `GET /api/profile/me` (con header `X-USER-ID`).
- Si no existe perfil, el usuario es redirigido a `/profile/setup`.
- `ProfileSetupPage` recoge `username`, `full_name` y `avatar_url`, y hace POST a `POST /api/profile`.

## Gestión de Estado

Tres stores de Zustand, todos persistidos en `localStorage`:

| Store | Campos | Métodos |
|---|---|---|
| `authStore` | `idToken`, `uid`, `email`, `isAuthenticated` | `setAuth()`, `clearAuth()` |
| `profileStore` | `profile` | `setProfile()`, `clearProfile()` |
| `themeStore` | `theme` (dark / light) | `toggleTheme()` |

## Carga de Datos

- **Cliente Axios** (`src/api/apiClient.ts`): URL base desde `VITE_API_BASE_URL`, adjunta automáticamente el header `Authorization`.
- **Cliente React Query**: `staleTime: 30 000 ms`, `retry: 1`.
- Query keys: `['workspaces']`, `['tasks', workspaceId]`, `['task', taskId]`, `['profile']`.
- Los endpoints de perfil envían adicionalmente `X-USER-ID: <uid>` por request.

## Desarrollo Local con Mocks MSW

Los endpoints de workspaces y tareas están mockeados en desarrollo para que el frontend pueda ejecutarse sin un backend real:

```bash
# .env.local
VITE_API_BASE_URL=http://localhost:5173  # no se usa — MSW intercepta
VITE_USE_MOCKS=true
```

Auth (`/auth/*`), perfil (`/api/profile/*`) y SSE (`/stream`) siempre conectan al backend real independientemente de `VITE_USE_MOCKS`.

## Sistema de Diseño

Propiedades CSS personalizadas en `:root` / `.dark`:

| Token | Propósito |
|---|---|
| `--cb-bg` | Fondo de página |
| `--cb-surface` | Fondo de tarjetas / paneles |
| `--cb-accent` | Color de marca principal |
| `--cb-border-*` | Tonos de borde |

Tipografías: **Syne** (títulos, peso 400–800) + **Outfit** (cuerpo, peso 300–600).

Clases de utilidad: `cb-input`, `cb-label`, `cb-btn-primary`, `cb-btn-ghost`, `cb-skeleton`.

Animaciones: `fade-in`, `fade-in-up`.

Modo oscuro activado añadiendo / eliminando la clase `dark` en `<html>`.

## Estructura del Proyecto

```
colabBoard_wa/
├── src/
│   ├── App.tsx                  # QueryClientProvider + RouterProvider
│   ├── router/index.tsx         # Definición de rutas
│   ├── api/apiClient.ts         # Cliente Axios con interceptor de auth
│   ├── mocks/                   # Configuración y handlers de MSW
│   ├── lib/jwt.ts               # Utilidades de decodificación JWT
│   ├── store/                   # Stores Zustand (auth, profile, theme)
│   └── features/
│       ├── auth/                # Login, registro, hooks
│       ├── workspaces/          # Grid de workspaces, modal de creación, hooks
│       ├── board/               # Tablero Kanban, hook SSE, indicador de estado
│       ├── tasks/               # Panel de detalle, formulario de edición, historial, hooks
│       └── profile/             # Página de configuración de perfil, hooks
├── wrangler.toml                # Configuración de enrutamiento SPA para Cloudflare Pages
└── vite.config.ts
```

## Ejecución Local

```bash
cd colabBoard_wa
npm install

# Crear un archivo de entorno local
echo "VITE_API_BASE_URL=https://colabboard-api-gateway-173469174364.southamerica-west1.run.app" > .env.local
echo "VITE_USE_MOCKS=true" >> .env.local

npm run dev
# App disponible en http://localhost:5173
```
