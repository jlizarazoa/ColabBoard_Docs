---
id: overview
title: Task Service
sidebar_label: Overview
---

# Task Service

El **Task Service** es un microservicio en Go que gestiona tareas dentro de espacios de trabajo colaborativos. Proporciona operaciones CRUD completas con características avanzadas como control de concurrencia optimista, eliminación suave y publicación de eventos.

## Propósito

- **Gestión de tareas**: Crear, leer, actualizar y eliminar tareas
- **Asignación**: Asignar usuarios a tareas específicas
- **Estados**: Seguimiento de progreso (pending, in_progress, done)
- **Historial**: Auditoría completa de cambios
- **Eventos**: Publicación de eventos a Pub/Sub para integración

## Stack Tecnológico

- **Lenguaje**: Go 1.25
- **Framework**: Gin
- **Base de datos**: PostgreSQL con GORM
- **Eventos**: Google Cloud Pub/Sub
- **Autenticación**: Firebase JWT

## Características Principales

### Control de Concurrencia
Cada tarea tiene un campo `version` que se incrementa en cada actualización. Los clientes deben enviar la versión actual para evitar conflictos.

### Eliminación Suave
Las tareas eliminadas permanecen en la base de datos con `deleted_at` establecido, pero no aparecen en consultas normales.

### Historial de Cambios
Cada modificación se registra en `task_history` con `old_value` y `new_value`.

## Base de Datos

### Tabla `tasks`
- `id` (UUID, PK)
- `title`, `description`
- `status` (pending/in_progress/done)
- `priority` (low/medium/high)
- `workspace_id`, `creator_id`
- `due_date`, `metadata` (JSONB)
- `version` (para concurrencia)
- `deleted_at` (soft delete)

### Tabla `task_assignments`
- `task_id`, `user_id`, `assigned_at`

### Tabla `task_history`
- `task_id`, `changed_by`, `change_type`
- `old_value`, `new_value` (JSONB)

## Endpoints Principales

- `POST /api/tasks` - Crear tarea
- `GET /api/tasks?workspace_id=UUID` - Listar tareas
- `PUT /api/tasks/:id` - Actualizar tarea
- `PATCH /api/tasks/:id/status` - Cambiar estado
- `POST /api/tasks/:id/assign` - Asignar usuario
- `DELETE /api/tasks/:id` - Eliminar tarea

## Eventos Pub/Sub

Publica eventos a `workspace-events`:
- `TaskCreated`, `TaskUpdated`, `TaskStatusChanged`, `TaskAssigned`, `TaskDeleted`

## Documentación Detallada

- [API Reference](api-reference.md)
- [Setup](setup.md)