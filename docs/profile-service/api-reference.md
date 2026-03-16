---
id: api-reference
title: Profile Service API Reference
sidebar_label: API Reference
---

# Profile Service API Reference

## Base URL
`http://localhost:8080`

## Autenticación
Endpoints protegidos requieren `Authorization: Bearer <token>`.

## Endpoints

### POST /api/profile/
Crear perfil de usuario.

**Headers:** Authorization, Content-Type: application/json

**Request:**
```json
{
  "username": "johndoe",
  "full_name": "John Doe",
  "avatar_url": "https://example.com/avatar.png"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "user_id": "firebase-uid",
    "username": "johndoe",
    "full_name": "John Doe",
    "avatar_url": "https://example.com/avatar.png",
    "created_at": "2026-03-14T10:00:00Z",
    "updated_at": "2026-03-14T10:00:00Z"
  }
}
```

### GET /api/profile/me
Obtener perfil propio.

**Headers:** Authorization

**Response (200):**
```json
{
  "success": true,
  "data": {
    "user_id": "firebase-uid",
    "username": "johndoe",
    "full_name": "John Doe",
    "avatar_url": "https://example.com/avatar.png",
    "created_at": "2026-03-14T10:00:00Z",
    "updated_at": "2026-03-14T10:00:00Z",
    "preferences": {
      "theme": "dark",
      "language": "es",
      "email_notifications": true
    }
  }
}
```

### GET /api/profile/{userID}
Obtener perfil público de cualquier usuario.

**Response (200):** Similar a GET /me pero sin preferences.

### PUT /api/profile/
Actualizar perfil propio.

**Headers:** Authorization, Content-Type: application/json

**Request:** Campos opcionales a actualizar
```json
{
  "username": "johndoe_v2",
  "full_name": "John Doe Jr."
}
```

### PUT /api/profile/preferences
Actualizar preferencias.

**Request:**
```json
{
  "theme": "light",
  "language": "en",
  "email_notifications": false
}
```

## Códigos de Error

- `400` - Request inválido
- `401` - Token faltante o inválido
- `404` - Perfil no encontrado
- `409` - Username ya existe