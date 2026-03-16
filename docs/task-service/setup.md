---
id: setup
title: Task Service Setup
sidebar_label: Setup
---

# Task Service Setup

## Requisitos

- Go 1.25+
- PostgreSQL
- Google Cloud Pub/Sub (opcional)

## Variables de Entorno

```bash
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=taskms
PORT=8080
GCP_PROJECT_ID=colabboard-prod
PUBSUB_TOPIC_ID=workspace-events
```

## Base de Datos

Ejecuta `init.sql` para crear tablas.

## Ejecución Local

```bash
go run ./cmd/api
```

## Docker

```bash
docker build -t taskms .
docker run -p 8080:8080 taskms
```

## Pub/Sub

Configura credenciales de GCP para publicar eventos. Desactiva con `GCP_PROJECT_ID=` vacío.