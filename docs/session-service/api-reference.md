---
id: api-reference
title: Session Service API Reference
sidebar_label: API Reference
---

# Session Service API Reference

## Base URL
`http://localhost:8080`

## Autenticación
Todos los endpoints requieren un JWT válido en el header `Authorization: Bearer <token>`, excepto los marcados como públicos.

## Endpoints

### Registro (Públicos)

#### POST /auth/register
Crea usuario con email + contraseña.

**Request:**
```json
{
  "email": "usuario@ejemplo.com",
  "password": "Contraseña123!",
  "displayName": "Juan Pérez"
}
```

**Response (201):**
```json
{
  "message": "User created successfully",
  "user": {
    "uid": "abc123xyz",
    "email": "usuario@ejemplo.com",
    "phoneNumber": null,
    "emailVerified": false,
    "displayName": "Juan Pérez",
    "photoUrl": null,
    "providerId": "firebase",
    "creationTimestamp": 1710000000000,
    "lastSignInTimestamp": null
  }
}
```

#### POST /auth/register/phone
Crea usuario con teléfono (formato E.164).

**Request:**
```json
{
  "phoneNumber": "+34612345678",
  "displayName": "Juan Pérez"
}
```

#### POST /auth/register/full
Crea usuario con email, contraseña y teléfono.

### Login (Públicos)

#### POST /auth/login
Login con email + contraseña.

**Request:**
```json
{
  "email": "usuario@ejemplo.com",
  "password": "Contraseña123!"
}
```

**Response (200):**
```json
{
  "idToken": "eyJhbGciOiJSUzI1NiIsImtpZCI6IjEyMyJ9...",
  "refreshToken": "AMf-vBy1234567890...",
  "expiresIn": "3600",
  "localId": "abc123xyz",
  "email": "usuario@ejemplo.com"
}
```

#### POST /auth/login/phone/send
Envía código SMS (paso 1).

**Request:**
```json
{
  "phoneNumber": "+34612345678",
  "recaptchaToken": "token-del-frontend"
}
```

**Response (200):**
```json
{
  "sessionInfo": "AQS7doLaS3k2qrMr..."
}
```

#### POST /auth/login/phone/verify
Verifica código SMS (paso 2).

**Request:**
```json
{
  "sessionInfo": "AQS7doLaS3k2qrMr...",
  "code": "123456"
}
```

### Gestión de Usuario (Protegidos)

#### GET /auth/me
Obtiene información del usuario autenticado.

**Response (200):**
```json
{
  "uid": "abc123xyz",
  "email": "usuario@ejemplo.com",
  "phoneNumber": "+34612345678",
  "emailVerified": false,
  "displayName": "Juan Pérez",
  "photoUrl": null,
  "providerId": "firebase",
  "creationTimestamp": 1710000000000,
  "lastSignInTimestamp": 1710000000000
}
```

#### POST /auth/revoke/{uid}
Revoca todas las sesiones del usuario.

#### DELETE /auth/user/{uid}
Elimina la cuenta del usuario.

### Utilidades

#### POST /auth/verify
Valida un token JWT.

**Request:**
```json
{
  "token": "eyJhbGciOiJSUzI1NiI..."
}
```

**Response (200):**
```json
{
  "valid": true,
  "user": {
    "uid": "abc123xyz",
    "email": "usuario@ejemplo.com",
    // ... otros claims
  }
}
```

## Códigos de Error

- `400` - Request inválido
- `401` - Token inválido o faltante
- `403` - Acceso denegado
- `404` - Usuario no encontrado
- `409` - Usuario ya existe