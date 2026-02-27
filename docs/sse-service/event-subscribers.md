---
id: event-subscribers
title: Event Subscribers
sidebar_label: Event Subscribers
---

# Event Subscribers

The SSE Service decouples event ingestion from connection management via the `IEventSubscriber` abstraction. The concrete implementation is selected at startup based on the `MESSAGING_PROVIDER` environment variable.

## IEventSubscriber Interface

**File:** `src/ColabBoard.SSE/Services/IEventSubscriber.cs`

```csharp
public interface IEventSubscriber
{
    Task StartAsync(Func<WorkspaceEvent, Task> handler, CancellationToken ct);
    Task StopAsync();
}
```

The `handler` delegate is invoked for every message received from the broker. The `EventListenerService` provides this handler and routes events to `ConnectionManager`.

## EventListenerService

**File:** `src/ColabBoard.SSE/Services/EventListenerService.cs`

A .NET `BackgroundService` that:
1. Calls `subscriber.StartAsync(HandleEvent, stoppingToken)` when the host starts.
2. Blocks on `Task.Delay(Timeout.Infinite, stoppingToken)` until the host signals shutdown.
3. Calls `subscriber.StopAsync()` in the `finally` block.

```mermaid
sequenceDiagram
    participant Host
    participant ELS as EventListenerService
    participant Sub as IEventSubscriber
    participant CM as ConnectionManager

    Host->>ELS: ExecuteAsync(stoppingToken)
    ELS->>Sub: StartAsync(HandleEvent, ct)
    Sub-->>ELS: (background message loop)
    loop For each message
        Sub->>ELS: HandleEvent(WorkspaceEvent)
        ELS->>CM: TerminateConnection(userId, workspaceId, reason)
    end
    Host->>ELS: stoppingToken cancelled
    ELS->>Sub: StopAsync()
```

### Event Routing

| `EventType` | Action |
|---|---|
| `USER_REMOVED_FROM_WORKSPACE_EVENT` | `ConnectionManager.TerminateConnection(userId, workspaceId, "access_revoked")` |
| *(any other)* | `LogWarning("Unknown event type")` — ignored |

---

## PubSubEventSubscriber (Production)

**File:** `src/ColabBoard.SSE/Services/PubSubEventSubscriber.cs`

Used when `MESSAGING_PROVIDER=PubSub`. Connects to a **GCP Pub/Sub pull subscription** using the Google Cloud PubSub client library.

### Configuration

| Env Var | Required | Description |
|---|---|---|
| `PUBSUB_PROJECT_ID` | **Yes** | GCP project ID |
| `PUBSUB_SUBSCRIPTION_ID` | **Yes** | Pub/Sub subscription name |

### Behaviour

- Creates a `SubscriberClient` targeting the configured subscription.
- Message processing returns `Ack` on success and `Nack` on deserialization error or exception.
- The stopping token is registered with `_subscriber.StopAsync()` to ensure clean shutdown.

### Required GCP IAM Permissions

The Cloud Run service account needs:
- `roles/pubsub.subscriber` on the subscription

---

## RabbitMqEventSubscriber (Local Development)

**File:** `src/ColabBoard.SSE/Services/RabbitMqEventSubscriber.cs`

Used when `MESSAGING_PROVIDER=RabbitMQ`. Consumes from the `workspace-events` queue using the RabbitMQ .NET client.

### Configuration

| Env Var | Required | Description |
|---|---|---|
| `RABBITMQ_CONNECTION_STRING` | **Yes** | e.g. `amqp://guest:guest@localhost` |

### Queue Declaration

The subscriber declares the queue on startup (idempotent):

```
Queue: workspace-events
Durable: true
Exclusive: false
AutoDelete: false
```

### Behaviour

- Uses `AsyncEventingBasicConsumer` with `autoAck: false`.
- Sends `BasicAck` on success and `BasicNack(requeue: false)` on deserialization error.
- Sends `BasicNack(requeue: true)` on processing exceptions.

### Start RabbitMQ locally

```bash
docker run -d -p 5672:5672 -p 15672:15672 rabbitmq:3-management
# Management UI: http://localhost:15672 (guest/guest)
```

---

## NullEventSubscriber (Default)

**File:** `src/ColabBoard.SSE/Services/NullEventSubscriber.cs`

Used when `MESSAGING_PROVIDER=None` (default). Does nothing — `StartAsync` and `StopAsync` are no-ops. Useful for running the service without any message broker dependency.

---

## Selecting the Provider

The DI registration in `Program.cs`:

```csharp
var messagingProvider = builder.Configuration.GetValue("MESSAGING_PROVIDER", "None");

if (string.Equals(messagingProvider, "RabbitMQ", StringComparison.OrdinalIgnoreCase))
    builder.Services.AddSingleton<IEventSubscriber, RabbitMqEventSubscriber>();
else if (string.Equals(messagingProvider, "PubSub", StringComparison.OrdinalIgnoreCase))
    builder.Services.AddSingleton<IEventSubscriber, PubSubEventSubscriber>();
else
    builder.Services.AddSingleton<IEventSubscriber, NullEventSubscriber>();
```

| `MESSAGING_PROVIDER` | Subscriber | Use case |
|---|---|---|
| `None` (default) | `NullEventSubscriber` | Unit tests, demo runs |
| `RabbitMQ` | `RabbitMqEventSubscriber` | Local integration testing |
| `PubSub` | `PubSubEventSubscriber` | Production (GCP Cloud Run) |
