---
id: setup
title: Session Service Setup
sidebar_label: Setup
---

# Session Service Setup

## Requisitos

- Java 17+
- Maven 3.6+
- Credenciales de Firebase

## Configuración de Firebase

1. Ve a [Firebase Console](https://console.firebase.google.com)
2. Selecciona tu proyecto
3. Ve a **Project Settings → Service Accounts**
4. Haz clic en **Generate new private key**
5. Guarda el archivo JSON como `firebase-credentials.json` en la raíz del proyecto

## Variables de Entorno

Crea un archivo `src/main/resources/application.properties`:

```properties
firebase.credentials.path=./firebase-credentials.json
firebase.web-api-key=tu-web-api-key
server.port=8080
```

## Ejecución Local

```bash
mvn clean install
mvn spring-boot:run
```

Accede a:
- API: http://localhost:8080
- Swagger: http://localhost:8080/docs

## Docker

```bash
docker build -t sessions-ms .
docker run -p 8080:8080 sessions-ms
```

## Despliegue en Cloud Run

```bash
gcloud run deploy sessions-ms \
  --source . \
  --region us-central1 \
  --allow-unauthenticated
```