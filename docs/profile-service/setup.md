---
id: setup
title: Profile Service Setup
sidebar_label: Setup
---

# Profile Service Setup

## Requisitos

- Go 1.25+
- PostgreSQL
- Docker (opcional)

## Variables de Entorno

Crea un archivo `.env`:

```bash
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=profilems
PORT=8080
```

## Ejecución Local

```bash
go mod tidy
go run cmd/api/main.go
```

## Docker

```bash
docker build -t profilems .
docker run -p 8080:8080 \
  -e DB_HOST=host.docker.internal \
  -e DB_USER=postgres \
  -e DB_PASSWORD=postgres \
  -e DB_NAME=profilems \
  profilems
```

## Base de Datos

Ejecuta el script `init.sql` para crear las tablas.

## Despliegue

Compatible con Google Cloud Run. Configura variables de entorno y Cloud SQL.