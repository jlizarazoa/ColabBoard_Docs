---
id: event-subscribers
title: Suscriptores de Eventos
sidebar_label: Suscriptores de Eventos
---

# Suscriptores de Eventos

El SSE Service desacopla la ingesta de eventos de la gestión de conexiones mediante la abstracción `IEventSubscriber`. La implementación concreta se selecciona al inicio según la variable de entorno `MESSAGING_PROVIDER`.

## Interfaz IEventSubscriber

**Archivo:** `src/ColabBoard.SSE/Services/IEventSubscriber.cs`

```csharp
public interface IEventSubscriber
{
    Task StartAsync(Func<WorkspaceEvent, Task> handler, CancellationToken ct);
    Task StopAsync();
}
```

El delegado `handler` se invoca por cada mensaje recibido del broker. `EventListenerService` provee este handler y enruta los eventos hacia `ConnectionManager`.

## EventListenerService

**Archivo:** `src/ColabBoard.SSE/Services/EventListenerService.cs`

Un `BackgroundService` de .NET que:
1. Llama a `subscriber.StartAsync(HandleEvent, stoppingToken)` cuando el host arranca.
2. Bloquea en `Task.Delay(Timeout.Infinite, stoppingToken)` hasta que el host señala el apagado.
3. Llama a `subscriber.StopAsync()` en el bloque `finally`.

```mermaid
sequenceDiagram
    participant Host
    participant ELS as EventListenerService
    participant Sub as IEventSubscriber
    participant CM as ConnectionManager

    Host->>ELS: ExecuteAsync(stoppingToken)
    ELS->>Sub: StartAsync(HandleEvent, ct)
    Sub-->>ELS: (bucle de mensajes en segundo plano)
    loop Por cada mensaje
        Sub->>ELS: HandleEvent(WorkspaceEvent)
        ELS->>CM: TerminateConnection(userId, workspaceId, reason)
    end
    Host->>ELS: stoppingToken cancelado
    ELS->>Sub: StopAsync()
```

### Enrutamiento de Eventos

| `EventType` | Acción |
|---|---|
| `USER_REMOVED_FROM_WORKSPACE_EVENT` | `ConnectionManager.TerminateConnection(userId, workspaceId, "access_revoked")` |
| *(cualquier otro)* | `LogWarning("Unknown event type")` — ignorado |

---

## PubSubEventSubscriber (Producción)

**Archivo:** `src/ColabBoard.SSE/Services/PubSubEventSubscriber.cs`

Se usa cuando `MESSAGING_PROVIDER=PubSub`. Conecta a una **suscripción pull de GCP Pub/Sub** usando la librería cliente de Google Cloud PubSub.

### Configuración

| Variable de entorno | Requerida | Descripción |
|---|---|---|
| `PUBSUB_PROJECT_ID` | **Sí** | ID del proyecto GCP |
| `PUBSUB_SUBSCRIPTION_ID` | **Sí** | Nombre de la suscripción Pub/Sub |

### Comportamiento

- Crea un `SubscriberClient` apuntando a la suscripción configurada.
- El procesamiento de mensajes devuelve `Ack` en caso de éxito y `Nack` ante errores de deserialización o excepciones.
- El stopping token se registra con `_subscriber.StopAsync()` para garantizar un apagado limpio.

### Permisos IAM Requeridos en GCP

La cuenta de servicio de Cloud Run necesita:
- `roles/pubsub.subscriber` sobre la suscripción

---

## RabbitMqEventSubscriber (Desarrollo Local)

**Archivo:** `src/ColabBoard.SSE/Services/RabbitMqEventSubscriber.cs`

Se usa cuando `MESSAGING_PROVIDER=RabbitMQ`. Consume de la cola `workspace-events` usando el cliente .NET de RabbitMQ.

### Configuración

| Variable de entorno | Requerida | Descripción |
|---|---|---|
| `RABBITMQ_CONNECTION_STRING` | **Sí** | p. ej. `amqp://guest:guest@localhost` |

### Declaración de la Cola

El suscriptor declara la cola al iniciar (operación idempotente):

```
Queue: workspace-events
Durable: true
Exclusive: false
AutoDelete: false
```

### Comportamiento

- Usa `AsyncEventingBasicConsumer` con `autoAck: false`.
- Envía `BasicAck` en caso de éxito y `BasicNack(requeue: false)` ante errores de deserialización.
- Envía `BasicNack(requeue: true)` ante excepciones de procesamiento.

### Iniciar RabbitMQ localmente

```bash
docker run -d -p 5672:5672 -p 15672:15672 rabbitmq:3-management
# UI de gestión: http://localhost:15672 (guest/guest)
```

---

## NullEventSubscriber (Por Defecto)

**Archivo:** `src/ColabBoard.SSE/Services/NullEventSubscriber.cs`

Se usa cuando `MESSAGING_PROVIDER=None` (valor por defecto). No hace nada — `StartAsync` y `StopAsync` son no-ops. Útil para ejecutar el servicio sin ninguna dependencia de broker de mensajes.

---

## Selección del Provider

El registro en DI dentro de `Program.cs`:

```csharp
var messagingProvider = builder.Configuration.GetValue("MESSAGING_PROVIDER", "None");

if (string.Equals(messagingProvider, "RabbitMQ", StringComparison.OrdinalIgnoreCase))
    builder.Services.AddSingleton<IEventSubscriber, RabbitMqEventSubscriber>();
else if (string.Equals(messagingProvider, "PubSub", StringComparison.OrdinalIgnoreCase))
    builder.Services.AddSingleton<IEventSubscriber, PubSubEventSubscriber>();
else
    builder.Services.AddSingleton<IEventSubscriber, NullEventSubscriber>();
```

| `MESSAGING_PROVIDER` | Suscriptor | Caso de uso |
|---|---|---|
| `None` (por defecto) | `NullEventSubscriber` | Tests unitarios, demos |
| `RabbitMQ` | `RabbitMqEventSubscriber` | Tests de integración locales |
| `PubSub` | `PubSubEventSubscriber` | Producción (GCP Cloud Run) |
