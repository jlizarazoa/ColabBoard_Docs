---
id: overview
title: API Gateway
sidebar_label: Visión General
---

# API Gateway

El `ColabBoard_Api_Gateway` es un **reverse proxy YARP en .NET 9** desplegado en **GCP Cloud Run**. Todo el tráfico de la API del navegador pasa a través de él — enruta los requests al microservicio correspondiente, gestiona CORS y pasa las conexiones SSE con el buffering desactivado.

## Stack Tecnológico

| Componente | Tecnología |
|---|---|
| Runtime | .NET 9, ASP.NET Core |
| Motor de proxy | YARP (Yet Another Reverse Proxy) 2.3 |
| Hosting | GCP Cloud Run (`southamerica-west1`) |

## URL en Cloud Run

```
https://colabboard-api-gateway-173469174364.southamerica-west1.run.app
```

Este es el valor configurado como `VITE_API_BASE_URL` en el frontend.

## Tabla de Rutas

| Patrón de Ruta | Cluster Downstream | Destino | Notas |
|---|---|---|---|
| `/auth/{**}` | `auth-cluster` | Sessions MS (Cloud Run, `us-central1`) | Login, registro, verificación |
| `/stream` | `sse-cluster` | SSE Service (Cloud Run, `southamerica-west1`) | SSE passthrough (buffering desactivado) |
| `/api/profile/{**}` | `profile-cluster` | Profile MS (Cloud Run, `us-central1`) | CRUD de perfil |
| `/workspaces/{**}` | `workspace-cluster` | workspace-ms (placeholder) | — |
| `/tasks/{**}` | `tasks-cluster` | tasks-ms (placeholder) | — |

Todas las rutas aplican la transformación de headers `X-Forwarded` para que los servicios downstream puedan leer la IP y el protocolo originales del cliente.

## CORS

CORS está habilitado globalmente:

- **Orígenes permitidos**: todos (configurado como wildcard — a restringir al dominio de Cloudflare Pages una vez que todos los servicios estén estables)
- **Headers permitidos**: todos
- **Métodos permitidos**: todos
- **Credenciales**: permitidas

## Middleware de Passthrough SSE

La ruta `/stream` requiere un tratamiento especial porque YARP (y Kestrel) buferizan las respuestas por defecto, lo que rompe Server-Sent Events. Un middleware personalizado intercepta los requests a `/stream` y:

1. Llama a `IHttpResponseBodyFeature.DisableBuffering()` para desactivar el buffering de Kestrel.
2. Añade el header de respuesta `X-Accel-Buffering: no` para desactivar el buffering de proxies estilo Nginx.

Esto garantiza que los datos SSE se envíen al cliente inmediatamente, sin quedar en un buffer.

## Headers Reenviados

`ForwardedHeadersMiddleware` está configurado para reenviar:

- `X-Forwarded-For` — IP original del cliente
- `X-Forwarded-Proto` — protocolo original (`https`)

Los servicios downstream reciben estos headers y pueden usarlos para logging o lógica basada en IP.

## Configuración

Las rutas y destinos de los clusters se definen en `appsettings.json` bajo la sección `ReverseProxy` de YARP. El gateway en sí no requiere secretos — solo enruta el tráfico.

## Despliegue

El gateway se despliega en GCP Cloud Run. Como solo hace proxy de requests HTTP, no necesita conexiones persistentes ni configuración especial de CPU — se aplican los valores por defecto de Cloud Run.

```bash
gcloud run deploy colabboard-api-gateway \
  --image <IMAGE> \
  --region southamerica-west1 \
  --port 8080
```
