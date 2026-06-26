---
sidebar_position: 6
title: Managed Connections
---

Managed Connections help plugin developers and administrators operate long-lived connections in a production deployment.

Some plugins do not only call an external API and return. They keep a client, sidecar, worker, or tunnel connected for a long time. Examples include enterprise messaging bridges, outbound Lark or Feishu long connections, server-sent event streams, TCP tunnels, and worker bridges. In a multi-pod deployment, the connection is physically owned by one API pod, while administrators and normal requests may hit another pod.

Managed Connections make those connections visible, diagnosable, and controllable across the cluster.

Each managed connection also has a direction:

- **Inbound**: the platform accepts an external client connection, such as a sidecar tunnel or browser worker bridge.
- **Outbound**: the platform dials and holds a connection to an external service, such as a Lark or Feishu long connection.
- **Internal**: the platform manages an internal worker, bridge, or stream.

## What It Gives You

For administrators:

- a global list of active or recently disconnected plugin connections
- connection status based on heartbeat and lease
- owner instance, remote address, last seen time, and recent errors
- connection direction, such as inbound tunnel or outbound service connection
- plugin-specific metadata such as account bindings
- management actions such as disconnect

For plugin developers:

- a shared registry instead of plugin-specific connection tables
- owner-pod command routing for actions such as disconnect or send request
- a consistent pattern for multi-pod production deployments
- a place to store operational metadata without expanding the platform schema

## When to Use It

Use Managed Connections when a plugin owns a long-lived resource that is tied to one API instance:

- WebSocket or Socket.IO clients
- outbound WebSocket connections to messaging platforms
- reverse tunnel sidecars
- SSE streams
- TCP tunnel clients
- background bridge workers
- custom long-running transport clients

Do not use it for ordinary short HTTP API calls, scheduled jobs that do not keep a connection open, or business records that should live in a plugin-owned data model.

## How It Works

Managed Connections use two platform services:

- **Postgres registry**: stores connection identity, owner instance, status, lease, timestamps, tenant/organization scope, and metadata.
- **Redis command router**: sends a management command to the API pod that owns the live connection.

The normal lifecycle is:

1. A plugin accepts a long-lived client connection.
2. The plugin registers the connection with the platform.
3. The plugin refreshes heartbeat and metadata while the client remains connected.
4. Admin views read the shared registry and show all visible connections.
5. Management actions are routed to the owner pod.
6. If a connection stops heartbeating, the lease expires and the record becomes stale.

## Lark Long Connection Example

`@xpert-ai/plugin-lark` uses Managed Connections for outbound long connections to Lark or Feishu OpenAPI. When an integration uses `long_connection` mode, the plugin opens an outbound WebSocket and registers the live session like this:

```text
pluginName: @xpert-ai/plugin-lark
connectionType: lark_long_connection
connectionKey: <lark-app-key>
transportType: websocket
direction: outbound
```

While the session is live, `LarkLongConnectionService` refreshes heartbeat and metadata such as tenant or organization scope, integration count, last connected time, last seen time, and recent errors.

In the Lark integration view:

- the Status page shows connection mode, state, connection key, direction, transport, owner instance, heartbeat, last connected time, and errors
- the Connections page lists the active global long connection record
- reconnect and disconnect actions are routed to the pod that owns the live WebSocket

This is why administrators can manage Lark long connections even when the browser request lands on a different API pod than the WebSocket itself.

## Status Meaning

- **Connected**: the connection is active and its lease has not expired.
- **Stale**: the connection stopped heartbeating. The owner pod may have crashed or lost connectivity.
- **Disconnected**: the plugin or an administrator closed the connection.
- **Error**: the plugin reported an operational error for the connection.

Online state is based on lease, not only on whether the current pod has a local in-memory client.

## Metadata

Managed Connection metadata is plugin-defined. It should stay operational and compact.

Good metadata examples:

- client name
- external instance id
- bindings to plugin business objects
- last sync time
- last ping time
- last error summary

Large business data should remain in the plugin's own tables.

## Developer Notes

Plugins access this capability through `@xpert-ai/plugin-sdk` tokens:

- `MANAGED_CONNECTION_REGISTRY_TOKEN`
- `CONNECTION_COMMAND_ROUTER_TOKEN`

The platform owns database and Redis details. A plugin should only adapt its protocol and publish useful metadata.

Recommended identity:

```text
pluginName + connectionType + connectionKey
```

For example:

```text
@xpert-ai/plugin-lark + lark_long_connection + <lark-app-key>
```

## Current Limits

- The first implementation is scoped to one API cluster and shared database.
- Redis Pub/Sub is used for low-latency commands, not durable command storage.
- If the owner pod disappears, the record becomes stale after the lease TTL.
- Cross-region or cross-cluster connection management should be added as a higher-level platform routing layer.
