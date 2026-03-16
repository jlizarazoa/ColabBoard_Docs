---
id: overview
title: Workspace Service
sidebar_label: Overview
---

# Workspace Service

El **Workspace Service** es un microservicio en Java que gestiona espacios de trabajo colaborativos y control de acceso en ColabBoard. Permite crear salas de colaboración, gestionar miembros con roles específicos y publicar eventos de cambios.

## Propósito

- **Gestión de workspaces**: Crear y administrar salas de colaboración
- **Control de acceso**: Roles OWNER, ADMIN, MEMBER con permisos granulares
- **Gestión de miembros**: Añadir colaboradores, cambiar roles
- **Eventos**: Publicación de cambios a Pub/Sub

## Stack Tecnológico

- **Lenguaje**: Java 17
- **Framework**: Spring Boot 3.4
- **Base de datos**: PostgreSQL con JPA/Hibernate
- **Eventos**: Google Cloud Pub/Sub
- **API**: Spring Web + OpenAPI/Swagger

## Roles y Permisos

| Rol | Permisos |
|-----|----------|
| **OWNER** | Crear workspace, eliminar, añadir miembros, cambiar roles |
| **ADMIN** | Añadir miembros (solo MEMBER) |
| **MEMBER** | Ver workspace, sin permisos de gestión |

## Base de Datos

### Tabla `workspaces`
- `id` (UUID, PK)
- `name` (VARCHAR)
- `owner_id` (VARCHAR, UID de Firebase)

### Tabla `workspace_members`
- `workspace_id` (FK)
- `user_id` (VARCHAR)
- `role` (OWNER/ADMIN/MEMBER)

## Endpoints Principales

- `POST /workspaces` - Crear workspace
- `GET /workspaces` - Listar mis workspaces
- `GET /workspaces/{id}` - Ver workspace
- `POST /workspaces/{id}/members` - Añadir miembro
- `PATCH /workspaces/{id}/members/{userId}` - Cambiar rol
- `DELETE /workspaces/{id}` - Eliminar workspace

## Autenticación

Confía en el API Gateway. Recibe `X-User-Id` en headers y valida permisos internamente.

## Eventos Pub/Sub

Publica a `workspace-events`:
- `USER_ADDED_TO_WORKSPACE_EVENT`
- `WORKSPACE_ROLE_CHANGED_EVENT`

## Documentación Detallada

- [API Reference](api-reference.md)
- [Setup](setup.md)