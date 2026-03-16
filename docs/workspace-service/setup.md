---
id: setup
title: Workspace Service Setup
sidebar_label: Setup
---

# Workspace Service Setup

## Requisitos

- Java 17+
- Maven 3.6+
- PostgreSQL

## Variables de Entorno

```properties
spring.datasource.url=jdbc:postgresql://localhost:5433/workspace_db
spring.datasource.username=workspace_user
spring.datasource.password=workspace_pass
server.port=3063
gcp.pubsub.project-id=colabboard-prod
gcp.pubsub.topic=workspace-events
```

## Ejecución Local

```bash
mvn clean install
mvn spring-boot:run
```

## Docker

```bash
./scripts/run-docker.sh
```

## Base de Datos

Usa Docker Compose para PostgreSQL local.

## Pub/Sub

Configura credenciales de GCP. Desactiva con `gcp.pubsub.enabled=false`.

## Despliegue

Compatible con Google Cloud Run + Cloud SQL.