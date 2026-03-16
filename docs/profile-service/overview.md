---
id: overview
title: Profile Service
sidebar_label: Overview
---

# Profile Service

El **Profile Service** es un microservicio en Go que gestiona perfiles de usuario extendidos en ColabBoard. Complementa la autenticación básica proporcionada por el Session Service con información adicional como nombre de usuario, nombre completo y preferencias personales.

## Propósito

- **Perfiles extendidos**: Almacena información adicional más allá de la autenticación básica
- **Preferencias**: Tema visual, idioma, notificaciones
- **Público y privado**: Algunos datos son públicos (para mostrar en UI), otros requieren autenticación
- **Validación**: Asegura unicidad de usernames y formato correcto

## Stack Tecnológico

- **Lenguaje**: Go 1.25
- **Framework**: Gin (HTTP router)
- **Base de datos**: PostgreSQL con GORM ORM
- **Autenticación**: Firebase JWT (valida payload, no firma)
- **Despliegue**: Docker / Google Cloud Run

## Arquitectura

Sigue el patrón de arquitectura hexagonal:

- **Controladores**: Manejo de requests HTTP
- **Servicios**: Lógica de negocio y validaciones
- **Repositorios**: Acceso a datos con GORM
- **Middleware**: Extracción de UID del JWT

## Base de Datos

### Tabla `user_profiles`
| Campo | Tipo | Descripción |
|-------|------|-------------|
| `user_id` | string | PK, UID de Firebase |
| `username` | string | Nombre único (4-20 chars) |
| `full_name` | string | Nombre completo |
| `avatar_url` | string | URL opcional del avatar |
| `created_at` | timestamp | Auto-generado |
| `updated_at` | timestamp | Auto-actualizado |

### Tabla `user_preferences`
| Campo | Tipo | Descripción |
|-------|------|-------------|
| `user_id` | string | FK a user_profiles |
| `theme` | string | "light" o "dark" |
| `language` | string | Código de idioma (ej: "es") |
| `email_notifications` | bool | Notificaciones por email |

## Endpoints Principales

### Gestión de Perfiles
- `POST /api/profile/` - Crear perfil (requiere auth)
- `GET /api/profile/me` - Ver mi perfil (requiere auth)
- `GET /api/profile/{userID}` - Ver perfil público (público)
- `PUT /api/profile/` - Actualizar perfil (requiere auth)

### Preferencias
- `PUT /api/profile/preferences` - Actualizar preferencias (requiere auth)

## Autenticación

No valida la firma del JWT (confía en el API Gateway). Extrae el `user_id` del payload para identificar al usuario.

## Documentación Detallada

- [API Reference](api-reference.md) - Endpoints con ejemplos
- [Setup](setup.md) - Configuración e instalación