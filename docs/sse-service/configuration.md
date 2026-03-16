---
id: configuration
title: Referencia de Configuración
sidebar_label: Referencia de Configuración
---

# Referencia de Configuración

Toda la configuración se proporciona mediante **variables de entorno**. El servicio usa el sistema estándar `IConfiguration` de ASP.NET Core, por lo que las variables también pueden definirse en `appsettings.json` o `appsettings.Development.json` para desarrollo local.

## Variables Requeridas

| Variable | Tipo | Descripción |
|---|---|---|
| `JWT_SECRET` | `string` | Secreto de firma HMAC-SHA256. **Mínimo 32 caracteres.** El servicio lanza `InvalidOperationException` al inicio si está ausente. |

## Variables Opcionales

| Variable | Tipo | Por defecto | Descripción |
|---|---|---|---|
| `JWT_ISSUER` | `string` | *(vacío)* | Emisor JWT esperado. Si está vacío, la validación del emisor se omite. |
| `JWT_CLOCK_SKEW_SECONDS` | `int` | `30` | Tolerancia de desfase de reloj (segundos) para la validación de expiración del token. |
| `MESSAGING_PROVIDER` | `string` | `None` | Broker de mensajes a usar: `None` \| `RabbitMQ` \| `PubSub` |
| `RABBITMQ_CONNECTION_STRING` | `string` | — | Cadena de conexión AMQP de RabbitMQ. Requerida cuando `MESSAGING_PROVIDER=RabbitMQ`. Ejemplo: `amqp://guest:guest@localhost` |
| `PUBSUB_PROJECT_ID` | `string` | — | ID del proyecto GCP. Requerida cuando `MESSAGING_PROVIDER=PubSub`. |
| `PUBSUB_SUBSCRIPTION_ID` | `string` | — | Nombre de la suscripción GCP Pub/Sub. Requerida cuando `MESSAGING_PROVIDER=PubSub`. |
| `HEARTBEAT_INTERVAL_SECONDS` | `int` | `15` | Frecuencia (en segundos) con la que se envía un comentario de heartbeat SSE para mantener la conexión activa. |
| `ASPNETCORE_URLS` | `string` | `http://+:8080` | Dirección de escucha de Kestrel. Se configura automáticamente en la imagen Docker. |

## Desarrollo Local

Crea un archivo `.env` en la raíz del repositorio (nunca lo incluyas en el repositorio):

```env
JWT_SECRET=my-local-dev-secret-at-least-32-chars!
JWT_ISSUER=
JWT_CLOCK_SKEW_SECONDS=30
MESSAGING_PROVIDER=None
HEARTBEAT_INTERVAL_SECONDS=15
```

### PowerShell

```powershell
$env:JWT_SECRET = "my-local-dev-secret-at-least-32-chars!"
dotnet run --project src/ColabBoard.SSE
```

### Docker Compose (ejemplo)

```yaml
services:
  sse:
    build: .
    ports:
      - "8080:8080"
    environment:
      JWT_SECRET: "my-local-dev-secret-at-least-32-chars!"
      MESSAGING_PROVIDER: "RabbitMQ"
      RABBITMQ_CONNECTION_STRING: "amqp://guest:guest@rabbitmq"
    depends_on:
      - rabbitmq

  rabbitmq:
    image: rabbitmq:3-management
    ports:
      - "5672:5672"
      - "15672:15672"
```

## Producción (GCP Secret Manager)

Guarda `JWT_SECRET` en Secret Manager y móntalo en Cloud Run como variable de entorno:

```bash
# Crear el secreto
echo -n "my-production-secret-at-least-32-chars!" | \
  gcloud secrets create colabboard-jwt-secret --data-file=-

# Desplegar con el secreto montado
gcloud run deploy colabboard-sse \
  --set-secrets JWT_SECRET=colabboard-jwt-secret:latest
```

## appsettings.Development.json

Para desarrollo local desde el IDE, puedes definir las variables en `appsettings.Development.json`:

```json
{
  "JWT_SECRET": "my-local-dev-secret-at-least-32-chars!",
  "MESSAGING_PROVIDER": "None",
  "HEARTBEAT_INTERVAL_SECONDS": 15
}
```

:::caution
Nunca incluyas secretos reales en este archivo. Usa un gestor de secretos o un archivo `.env` ignorado por `.gitignore`.
:::
