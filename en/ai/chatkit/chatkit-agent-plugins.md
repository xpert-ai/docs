---
title: Plugins, Middleware and Experts
sidebar_position: 13
---

ChatKit's unified resource selector adds Agent Plugins, middleware and published digital experts to the current conversation. These resources extend the entry Agent without changing the Assistant's draft or published graph.

## Enable the selector

```ts
import type { ChatKitOptions } from '@xpert-ai/chatkit-types';

const composer: ChatKitOptions['composer'] = {
  projects: { enabled: true },
  resources: { enabled: true },
};
```

Merge this into your existing Xpert hosted API options. `composer.resources.enabled` is off by default. Deploy backend and SDK support for the resource catalog, conversation persistence and workspace Connectors before enabling it.

## Selection experience

The Plugins entry appears below the composer after projects and files, with selected avatars and a count. The first menu lists **resources added to this conversation**, not all packages installed in the organization. Click a selected item again to remove it.

| Submenu | Content and interaction |
| --- | --- |
| Connect plugins | Published standard plugins and executable workspace Connector capabilities. Add an item or start its connection flow. Supports search, pagination and Browse all plugins |
| Middleware | Loads all available middleware configurations. Search and click an item to add it; no plus icon or Browse all action |
| Experts | Loads all available published experts. Search and click an item to add it; no plus icon or Browse all action |

Connect plugins does not download packages from a third-party marketplace or install server code. Importing, configuring and publishing packages are administrator operations.

Middleware and experts have a persistent info icon. Hover or focus it to show one information card at a time; middleware cards also list bound Views. Plugin rows do not have an info icon. When a plugin needs a connection, it opens a connection status and action interface.

Experts use their actual avatars, and middleware uses its configured avatar, with a type icon as fallback. Descriptions support strings and `I18nObject`, resolved using the current language:

```json
{
  "en_US": "Review BOM changes and their impact.",
  "zh_Hans": "审查 BOM 变更及其影响。"
}
```

Menus share theme variables and compact styling with project and file selectors, including transparent borderless search inputs. The expanded panel becomes a bottom drawer on narrow screens. See [Themes and Customization](./chatkit-themes).

## Resource sources

| Resource | `kind` | Capability |
| --- | --- | --- |
| Agent Plugin | `agent_plugin` | A standard resource package identified by root `plugin.json`, providing Skills, remote MCP and Xpert extension references |
| Middleware | `middleware` | An available configuration for an installed provider, instantiated through the existing middleware registry |
| Digital expert | `external_xpert` | An authorized published expert, executed through the collaborator invocation path |

Standard packages differ from native Xpert code plugins. Administrators import them from Git with a ref and optional subdirectory, or from ZIP, then publish bindings to authorized workspaces. `extensions["cn.xpertai"]` can declare middleware presets, logical expert references and Connector dependencies. It does not load server code dynamically.

The catalog combines managed bindings and backend discovery: installed user-addable middleware providers with valid default configurations, and accessible published experts. Providers missing required configuration, the current Assistant and experts already in its graph are not offered as duplicate additions. Managed bindings take precedence, and disabling one cannot be bypassed through discovery.

Packages support Skills and Streamable HTTP MCP. Unsupported stdio/legacy SSE and invalid components receive diagnostics and are isolated from valid components. Plugins are selected as a whole; `partial` means only valid components are usable. Marketplace subscriptions, legacy Codex/Claude manifests, arbitrary remote Agent URLs and package Hooks are outside this integration's scope.

## Workspace connections and authorization

A Connector supplies an external service connection and credentials. A plugin supplies Agent capabilities that may depend on one or more such connections. Credential-only Connectors are not listed as separate selectable capabilities.

**Connections belong to the workspace, not to individual users.** Users access the Assistant's workspace connections through their Assistant runtime permissions. Configuration and usage permissions are separate:

- Users with connection configuration permission see Connect account, which opens the host's target Connector configuration/OAuth flow.
- Other users see guidance to contact a workspace administrator, with no personal authorization entry.
- After connection, ChatKit checks backend readiness before continuing the resource addition. Cancellation or failure preserves the draft and existing selections.

Provide `composer.resources.onConnect` to handle the connection in the host:

```ts
import type {
  ChatKitOptions,
  WorkspaceConnectorConnectHandler,
} from '@xpert-ai/chatkit-types';

// Implement in the host: revalidate the Assistant, workspace, binding and
// configuration permission; open the flow and await completion or cancellation.
// Never return credentials to ChatKit.
declare const openWorkspaceConnector: WorkspaceConnectorConnectHandler;

const composer: ChatKitOptions['composer'] = {
  resources: {
    enabled: true,
    onConnect: openWorkspaceConnector,
  },
};
```

The handler receives `{ assistantId, bindingId }` and returns `Promise<{ status: 'connected' | 'cancelled' }>`. The binding identifies the Connector resolved by the authorization response, not a plugin package ID. For iframe integrations, the Web Component bridges the `onConnectWorkspaceConnector` command to the host. Use compatible UI and Web Component versions.

Historical personal OAuth credentials are not copied into shared connections. An administrator must configure a workspace connection and republish the plugin version when necessary.

<Note>
`composer.connectors` is deprecated but has not been removed. Standard plugins use `composer.resources`, with Connector dependencies connected through `onConnect`. In the current version, also retain `composer.connectors: { enabled: true }` to show native Connector capabilities in the unified menu; the Xpert Cloud host enables both options. When the unified selector is enabled, the old + → Connectors entry is hidden. Connector configuration, OAuth and execution remain supported.
</Note>

## Persistence, caching and execution

- New-conversation selections are validated as drafts and submitted with the first message. Sending does not clear them.
- Existing conversations save the complete selection through dedicated resource endpoints and restore it after reload or conversation changes.
- Catalog caches are scoped to the client, Assistant and project. Switching between the three menus does not refresh them. Explicit refresh, window focus or a scope change triggers fresh reads. Middleware and experts load all pages and search locally.
- Project changes revalidate resources; conversation changes restore that conversation's selection. Cached catalog data never substitutes for backend authorization.
- References pin configuration versions. Upgrading a plugin does not silently replace existing selections. Invalid items retain a status so users can remove or reselect them.
- `revision` prevents concurrent overwrites. A conflict returns `409`; reload the server selection before applying another change.
- Changes apply to the next execution. Running and resumed executions use the original snapshot, while revoked permissions still block subsequent calls.
- Dynamic resources attach only to the entry Agent. Child experts keep their own configuration. Required middleware cannot be disabled; duplicates are deduplicated and incompatible configurations are rejected.

| Server status | Meaning |
| --- | --- |
| `ready` | Available |
| `requires_auth` | Workspace connection needs configuration or connection |
| `configuration_required` | Administrator configuration is missing |
| `partial` | Some components are available |
| `unavailable` | Invalid or inaccessible; cannot be added |

The client also shows verification states. A temporarily missing catalog item must not erase a historical selection.

## SDK and existing capability selection

All ChatKit requests to Xpert use `@xpert-ai/xpert-sdk`. Standard plugins, middleware and experts have a separate `runtimeResources` selection:

```json
{
  "revision": 0,
  "resources": [
    { "bindingId": "<binding ID from the catalog>", "version": "<configuration version from the catalog>" }
  ]
}
```

Use the catalog's binding IDs and versions rather than constructing them. Existing-conversation reads and writes take a conversation ID, not a thread ID.

| SDK method | Purpose |
| --- | --- |
| `assistants.getResources(assistantId, options)` | Catalog search by project, kind and query, with `offset` / `limit` |
| `assistants.validateResources(assistantId, selection, projectId)` | Validate a complete unsaved selection |
| `assistants.authorizeResource(assistantId, input)` | Resolve a plugin MCP component's workspace connection and configuration permission |
| `conversations.getRuntimeResources(conversationId)` | Read conversation selection |
| `conversations.updateRuntimeResources(conversationId, selection)` | Save the complete selection with its revision |
| `connectors.runtimeOptions(assistantId, options)` / `connectors.runtimeStatus(assistantId, bindingId)` | Native Connector catalog and readiness |

Native Connectors in the unified UI still use `connectorBindingIds`; not every entry becomes a `runtimeResources` reference. Existing `runtimeCapabilities.plugins.nodeKeys` identifies **middleware nodes already in the Assistant graph**, and `subAgents.nodeKeys` identifies graph experts. See [Skills and Graph Capabilities](./chatkit-runtime-capabilities). One-message `/` tokens and persistent conversation resources are separate mechanisms.

## Verify the integration

1. Add a plugin that needs no connection, send a message, reload and switch conversations to verify restoration.
2. Add middleware and an expert; verify actual invocation without modifying the Assistant's published graph.
3. Switch menus to check caching, then hover different info icons to check that only the current card appears and middleware Views are listed.
4. Check connection prompts with and without configuration permission. Cancel without losing the draft, then complete a connection and continue adding the resource.
5. Verify removal, concurrent updates, project changes and disabled bindings produce the expected selection and availability state.
