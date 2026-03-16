---
id: getting-started
title: Primeros Pasos
sidebar_label: Primeros Pasos
---

# Primeros Pasos

Esta guía explica cómo configurar un entorno de desarrollo local de ColabBoard.

## Requisitos Previos

| Herramienta | Versión | Propósito |
|---|---|---|
| [.NET 9 SDK](https://dotnet.microsoft.com/download) | 9.0+ | Compilar y ejecutar el SSE Service |
| [Docker Desktop](https://www.docker.com/products/docker-desktop/) | 24+ | Ejecución en contenedores |
| [Node.js](https://nodejs.org/) | 20+ | Frontend de la Web App |
| [gcloud CLI](https://cloud.google.com/sdk/docs/install) | Latest | Despliegue en GCP |
| [RabbitMQ](https://www.rabbitmq.com/) | 3.x | Broker de eventos local (opcional) |

## Clonar los Repositorios

```bash
# SSE Service
git clone https://github.com/tomasparramonroy/colabBoard_SSE_service.git
cd colabBoard_SSE_service
```

## Iniciar el SSE Service localmente

```bash
# 1. Configurar la variable de entorno JWT_SECRET (mínimo 32 caracteres)
$env:JWT_SECRET = "my-local-dev-secret-at-least-32-chars!"

# 2. Ejecutar el servicio (escucha en http://localhost:5263)
dotnet run --project src/ColabBoard.SSE

# 3. En otra terminal, generar un JWT de prueba
.\gen-token.ps1

# 4. Abrir un stream SSE
curl.exe -N "http://localhost:5263/stream?workspaceId=ws-1&token=<token_generado>"

# 5. Comprobar el estado de salud
curl.exe "http://localhost:5263/health"
```

## Iniciar RabbitMQ (opcional — para pruebas de eventos locales)

```bash
docker run -d -p 5672:5672 -p 15672:15672 rabbitmq:3-management
```

Luego configurar estas variables de entorno adicionales antes de iniciar el SSE Service:

```bash
$env:MESSAGING_PROVIDER = "RabbitMQ"
$env:RABBITMQ_CONNECTION_STRING = "amqp://guest:guest@localhost"
```

## Ejecutar los Tests

```bash
dotnet test
```

## Iniciar la Web App localmente

```bash
cd colabBoard_wa
npm install

# Crear un archivo de entorno local
echo "VITE_API_BASE_URL=https://colabboard-api-gateway-173469174364.southamerica-west1.run.app" > .env.local
echo "VITE_USE_MOCKS=true" >> .env.local

npm run dev
# App disponible en http://localhost:5173
```

Con `VITE_USE_MOCKS=true`, los endpoints de workspaces y tareas son gestionados por **MSW** (Mock Service Worker), por lo que no se necesita un backend local. Auth, perfil y SSE siempre conectan al backend real.

## Próximos Pasos

- Lee la [descripción del SSE Service](../sse-service/overview) para entender la arquitectura del servicio.
- Lee la [descripción de la Web App](../web-app/overview) para entender el frontend.
- Lee la [descripción del API Gateway](../api-gateway/overview) para la tabla de rutas del proxy.
- Revisa la [Referencia de Configuración](../sse-service/configuration) con todas las variables de entorno.
- Consulta la [guía de Despliegue](../sse-service/deployment) para Docker y GCP Cloud Run.
