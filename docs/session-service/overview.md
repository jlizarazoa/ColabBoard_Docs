---
id: overview
title: Session Service
sidebar_label: Overview
---

# Session Service

El **Session Service** es el microservicio central de autenticación y gestión de sesiones en ColabBoard. Actúa como puente entre la aplicación y Firebase Authentication, delegando la seguridad a Firebase mientras proporciona una API REST consistente para registro, login y validación de usuarios.

## Propósito

- **Registro de usuarios**: Soporta email/contraseña, teléfono (SMS) y autenticación híbrida.
- **Autenticación**: Login mediante email/contraseña, SMS o proveedores OAuth (Google).
- **Gestión de sesiones**: Validación de tokens JWT, revocación de sesiones y obtención de información del usuario.
- **Integración**: Proporciona endpoints para que otros microservicios validen tokens sin necesidad de Firebase SDK.

## Stack Tecnológico

- **Lenguaje**: Java 17
- **Framework**: Spring Boot 3.4.0
- **Firebase**: Admin SDK para operaciones de servidor, REST API para flujos de login
- **Documentación**: OpenAPI/Swagger UI en `/docs`
- **Despliegue**: Docker / Google Cloud Run

## Arquitectura

El servicio sigue una arquitectura hexagonal con separación clara entre:

- **Controladores**: Manejo de requests HTTP
- **Servicios**: Lógica de negocio con Firebase
- **Filtros**: Validación de headers y autenticación
- **Configuración**: Inicialización de Firebase y Swagger

## Flujo de Autenticación

1. Cliente envía JWT al API Gateway
2. Gateway valida el token y extrae UID
3. Gateway reenvía request con header `X-User-Id`
4. Session Service confía en el gateway (no valida JWT directamente)

## Endpoints Principales

### Registro
- `POST /auth/register` - Email + contraseña
- `POST /auth/register/phone` - Solo teléfono (SMS)
- `POST /auth/register/full` - Email + contraseña + teléfono

### Login
- `POST /auth/login` - Email + contraseña
- `POST /auth/login/phone/send` - Enviar código SMS
- `POST /auth/login/phone/verify` - Verificar código SMS

### Gestión de Usuario
- `GET /auth/me` - Información del usuario autenticado
- `POST /auth/revoke/{uid}` - Revocar todas las sesiones
- `DELETE /auth/user/{uid}` - Eliminar cuenta

### Utilidades
- `POST /auth/verify` - Validar token JWT (para otros servicios)

## Configuración

Requiere credenciales de Firebase Admin SDK (`firebase-credentials.json`) y Web API Key.

## Documentación Detallada

- [API Reference](api-reference.md) - Endpoints completos con ejemplos
- [Setup](setup.md) - Configuración e instalación
