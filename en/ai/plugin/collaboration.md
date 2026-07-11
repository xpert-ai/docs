---
sidebar_position: 8
title: Real-time Collaboration
description: Let users, agents, and system processes safely co-edit the same live document in plugin applications.
---

# Real-time Collaboration

Xpert Collaboration is a platform capability for real-time collaboration in plugin applications. Multiple users, Agents, and system jobs can operate on the same business document while the platform handles synchronization, persistence, presence, reconnect recovery, and cross-node propagation.

Plugins continue to define their own business model and editing experience, such as the slide structure of a presentation, the shape tree of a canvas, or spreadsheet cells. The platform operates the shared collaboration infrastructure. Presentation Studio and Pencil are reference Agentic Apps built on this capability.

<Tip>
Collaboration manages live working state, not business version history. Saving versions, publishing, approvals, and exports remain explicit plugin business actions.
</Tip>

## Product capabilities

- **Real-time multi-user editing**: Yjs CRDT updates merge independent edits and deterministically converge on same-field conflicts.
- **Human-Agent co-editing**: Agent tool operations use the same authoritative document and appear as virtual collaborators in the participant list and editing surface.
- **Live cursors and selections**: Plugins can display page location, normalized pointers, element focus, relative text selections, and viewport information.
- **Reconnect recovery**: A reconnecting client requests the missing state-vector-relative delta, with periodic synchronization as a repair path for temporary message loss.
- **Cross-node collaboration**: Redis pub/sub propagates updates and presence to other API nodes. A node can continue local collaboration when Redis is temporarily unavailable.
- **Business-view materialization**: The platform stores authoritative Yjs state while plugins project it into entities optimized for search, export, and business queries.
- **Plugin-owned schemas**: Providers define authorization, initialization, and materialization without plugin-specific WebSocket gateways, sessions, or Redis presence stores.

## Collaborators

Collaboration supports three actor types:

| Type | Typical source | Presentation |
| --- | --- | --- |
| `user` | A person editing through a Workbench or Remote Component | Safe display name, avatar, color, cursor, and selection. |
| `agent` | An Xpert Agent calling plugin middleware tools | Agent name, current operation, target page, or target element. |
| `system` | Background automation or a platform job | System activity without a fabricated mouse trajectory. |

Presence is short-lived runtime state. It is not written into the collaboration document, plugin versions, or audit content. When an Agent has no physical pointer, the UI should show a page- or element-level badge instead of inventing continuous cursor movement.

## Actor identity and client sessions

Collaboration distinguishes a stable actor from each live connection:

- `presenceId` identifies a user, Agent, or system actor without exposing its platform primary key.
- `clientId` identifies one browser tab, device, or virtual presence session.
- `selfClientId` identifies the exact Socket connection receiving a presence snapshot.

One actor may have several active sessions. For example, the same user can open a document in two tabs. A participant list should deduplicate sessions by `presenceId` and still include the local actor. Cursor, selection, and canvas overlays should use remote sessions and exclude only `selfClientId`. Filtering every item with the local `presenceId` would incorrectly hide the user's other tabs and can remove the entire participant list when no other user is connected.

## How it works

```text
Plugin UI + Agent tools
          │ Yjs updates / presence
          ▼
platform.collaboration
          │
          ├── authoritative Yjs state and state vector
          ├── monotonic sequence and idempotent update journal
          ├── secure sessions and one WebSocket gateway
          ├── cross-node Redis update / presence propagation
          └── provider materialization
                         │
                         ▼
                Plugin business entity
```

A resource is uniquely identified by `providerKey + resourceId + tenant/organization scope`. On first access, the platform asks the plugin Provider to initialize the document. Each unique update then locks the document in a database transaction, merges the Yjs update, advances the sequence, and saves the complete state. After commit, the platform broadcasts the update and asks the Provider to materialize the business view.

A materialization failure does not roll back an accepted CRDT update. The platform marks the projection pending or failed and uses Managed Queues to retry the newest state. The live document remains authoritative, so strongly consistent operations such as export or version creation must read current platform state first.

## Presence and operation targets

Presence can include:

- the active page or slide;
- normalized pointer coordinates;
- the active element, text field, or control;
- Yjs Relative Position text cursor and selection data;
- edit mode and viewport information;
- Agent `thinking`, `editing`, `done`, or `failed` status;
- tool name and a user-facing operation label.

Clients send a heartbeat every five seconds by default and offline presence expires automatically. Each client connection has its own server-side expiry, so one active tab cannot keep a disconnected tab alive. The browser client also removes silent remote sessions locally as a fallback when a removal event is lost. Presence has strict size and field limits and must never carry document content, platform tokens, or arbitrary business JSON.

## Reliability

- Local updates are merged over a short batching window to reduce network traffic during typing.
- Update byte hashes provide idempotency, so retries do not advance the sequence twice.
- State vectors transfer only the Yjs data a client is missing.
- Destructive or ordering-sensitive actions can use `expectedSequence` as a compare-and-set guard; normal CRDT edits do not require revision locking.
- The platform always stores a complete Yjs snapshot while retaining only a bounded recent update journal.
- Reads repair a lagging plugin projection, and failed projection jobs retry through Managed Queues.

## Security and isolation

- Every operation passes platform tenant and organization scoping before the plugin Provider performs resource-level authorization.
- The browser receives a short-lived, single-user, single-document session with explicit read or write access. It never receives a platform token, tenant id, or organization id.
- The backend public base URL determines the collaboration endpoint. Plugins must not derive it from `window.location`.
- The platform stores only a hash of the client secret and validates it with a timing-safe comparison.
- Updates, complete documents, and presence payloads have platform size limits.
- Other clients receive an opaque `presenceId`, not a real platform user primary key.

## Plugin integration

Plugins use the `platform.collaboration` capability from `@xpert-ai/plugin-sdk` and register a `@CollaborationDocumentProvider()`:

1. Authorize the business resource in the Provider.
2. Convert existing business state into an initial Yjs update.
3. Materialize authoritative platform state into business entities idempotently.
4. Use the server-side capability to ensure documents, submit updates, and issue collaboration sessions.
5. Use the SDK browser client with caller-owned `Y.Doc` and Socket.IO instances.
6. Use `createCollaborationPresenceStore` to derive deduplicated collaborators and connection-specific remote sessions for the UI.

The runtime capability boundary transports base64 DTOs instead of `Y.Doc` instances. The SDK also does not force React, Yjs, or Socket.IO into plugin bundles. This avoids server bundle growth and conflicts between multiple Yjs runtimes.

## Current boundaries

- The first engine is Yjs; the contract leaves room for other CRDT engines later.
- The platform does not provide generic comments, approvals, business versions, or React editor components.
- Plugins own their Yjs schema, UI, version policy, export semantics, and conflict messaging.
- Workspace Files do not store live Yjs state. File outputs and external sharing should use Workspace Files and Artifacts.

## Related resources

- [Remote Component plugins](./remote-component)
- [Managed Queues](./managed-queues)
- [Artifacts](../agent/artifacts/index)
