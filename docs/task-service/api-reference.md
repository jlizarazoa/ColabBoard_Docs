---
id: api-reference
title: Task Service API Reference
sidebar_label: API Reference
---

# Task Service API Reference

## Base URL
`http://localhost:8080`

## Autenticación
Todos los endpoints requieren `Authorization: Bearer <token>`.

## Endpoints

### POST /api/tasks
Crear nueva tarea.

**Request:**
```json
{
  "title": "Implement login page",
  "description": "Build login form with validation",
  "priority": "high",
  "workspace_id": "11111111-1111-1111-1111-111111111111",
  "due_date": "2026-04-01T00:00:00Z",
  "metadata": {"sprint": 3, "points": 8}
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "title": "Implement login page",
    "status": "pending",
    "priority": "high",
    "workspace_id": "11111111-1111-1111-1111-111111111111",
    "creator_id": "firebase-uid",
    "version": 1,
    "created_at": "2026-03-02T00:00:00Z"
  }
}
```

### GET /api/tasks?workspace_id=UUID
Listar tareas del workspace.

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "a1b2c3d4-...",
      "title": "Implement login page",
      "status": "pending",
      "priority": "high",
      "version": 1,
      "assignments": [
        {"user_id": "...", "assigned_at": "..."}
      ]
    }
  ]
}
```

### PUT /api/tasks/:id
Actualizar tarea (requiere `version`).

**Request:**
```json
{
  "title": "Implement login page v2",
  "priority": "medium",
  "version": 1
}
```

### PATCH /api/tasks/:id/status
Cambiar estado (requiere `version`).

**Request:**
```json
{
  "status": "in_progress",
  "version": 1
}
```

### POST /api/tasks/:id/assign
Asignar usuario a tarea.

**Request:**
```json
{
  "user_id": "user-uuid"
}
```

### DELETE /api/tasks/:id
Soft delete de tarea.

## Control de Concurrencia

Envía `version` actual en updates. Si hay conflicto, recibe `409 Conflict` y debe reintentar con nueva versión.

## Códigos de Error

- `400` - Request inválido
- `401` - Token faltante
- `404` - Tarea no encontrada
- `409` - Conflicto de versión