---
id: api-reference
title: Workspace Service API Reference
sidebar_label: API Reference
---

# Workspace Service API Reference

## Base URL
`http://localhost:3063`

## Autenticación
Todos los endpoints requieren header `X-User-Id` (inyectado por API Gateway).

## Endpoints

### POST /workspaces
Crear nuevo workspace.

**Headers:** X-User-Id, Content-Type: application/json

**Request:**
```json
{
  "name": "Mi sala de diseño"
}
```

**Response (201):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Mi sala de diseño",
  "ownerId": "user-123"
}
```

### GET /workspaces
Listar workspaces donde el usuario es miembro.

**Response (200):**
```json
[
  {
    "id": "550e8400-...",
    "name": "Mi sala de diseño",
    "ownerId": "user-123"
  }
]
```

### GET /workspaces/{id}
Ver detalles de un workspace.

**Response (200):**
```json
{
  "id": "550e8400-...",
  "name": "Mi sala de diseño",
  "ownerId": "user-123",
  "members": [
    {
      "userId": "user-123",
      "role": "OWNER"
    }
  ]
}
```

### POST /workspaces/{id}/members
Añadir miembro al workspace.

**Request:**
```json
{
  "userId": "user-456",
  "role": "MEMBER"
}
```

### PATCH /workspaces/{id}/members/{userId}
Cambiar rol de un miembro.

**Request:**
```json
{
  "role": "ADMIN"
}
```

### DELETE /workspaces/{id}
Eliminar workspace (solo owner).

## Roles

- **OWNER**: Control total
- **ADMIN**: Puede añadir miembros (solo MEMBER)
- **MEMBER**: Solo lectura

## Códigos de Error

- `400` - Request inválido
- `401` - X-User-Id faltante
- `403` - Permisos insuficientes
- `404` - Workspace no encontrado