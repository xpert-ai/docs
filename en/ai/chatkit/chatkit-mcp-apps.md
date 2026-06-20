---
title: MCP Apps
sidebar_position: 11
---

<Info>
Render MCP tool results as interactive inline apps in ChatKit.
</Info>

MCP Apps let an MCP server return an HTML application as part of a tool result. In Xpert + ChatKit, a tool can declare a UI resource with `_meta.ui.resourceUri`, and ChatKit renders that resource as an inline iframe in the conversation. The iframe communicates with the Xpert backend through the standard MCP Apps JSON-RPC bridge.

Use MCP Apps when a model-visible tool needs to produce a rich, interactive result such as a chart, dashboard, map, form, media browser, or drilldown analysis. For static structured cards, keep using ChatKit Widgets. For persistent workbench pages or integration configuration screens, keep using Xpert extension views.

## What Xpert Supports

The Xpert MCP Apps host supports:

- tool metadata discovery through `_meta.ui.resourceUri`
- inline `McpApp` ChatKit message components
- `ui://` MCP resources with MIME type `text/html;profile=mcp-app`
- JSON-RPC bridge methods including `ui/initialize`, `ui/notifications/tool-input`, `ui/notifications/tool-result`, `tools/call`, `resources/read`, `ui/open-link`, `ui/message`, `ui/update-model-context`, `ui/request-display-mode`, and `ui/notifications/size-changed`
- app-only tools through `_meta.ui.visibility = ['app']`
- resource CSP, browser permissions, `domain`, and `prefersBorder` from MCP App resource metadata
- short-lived app instances with history refresh recovery from safe message metadata
- plugin-managed MCP servers installed from Xpert plugins

ChatKit implements the MCP Apps bridge directly. It does not implement ChatGPT-specific `window.openai` APIs. MCP Apps can still be authored so they remain portable across hosts by relying on the standard bridge first.

## Architecture

```mermaid
sequenceDiagram
    participant User
    participant ChatKit
    participant Agent as Xpert Agent
    participant Host as Xpert MCP Apps Host
    participant MCP as MCP Server

    User->>ChatKit: Ask for an interactive result
    ChatKit->>Agent: Send message
    Agent->>MCP: tools/call model-visible tool
    MCP-->>Agent: Tool result + _meta.ui.resourceUri
    Agent-->>ChatKit: McpApp message component
    ChatKit->>Host: GET /mcp-apps/{appInstanceId}/resource
    Host->>MCP: resources/read ui://...
    MCP-->>Host: text/html;profile=mcp-app
    Host-->>ChatKit: HTML, CSP, initial tool result
    ChatKit->>ChatKit: Render sandboxed iframe
    ChatKit-->>MCP: tools/call / resources/read via host RPC
```

The chat history stores only safe metadata such as `appInstanceId`, `resourceUri`, `toolName`, `toolsetId`, and `serverName`. The raw HTML is not stored in the conversation. On page refresh, the backend can reconnect to the toolset and rebuild an expired app instance from the stored metadata.

## Runtime Metadata Contract

ChatKit does not inspect arbitrary MCP server implementation details. It relies on the Xpert backend to preserve the MCP App metadata discovered from the selected Toolset.

At runtime, an MCP tool becomes app-capable when Xpert sees `_meta.ui.resourceUri` and the resource URI uses the `ui://` scheme. Tool `_meta.ui` should only carry `resourceUri` and `visibility`. Resource security and rendering metadata such as CSP, browser permissions, `domain`, and `prefersBorder` belongs on the MCP App resource `_meta.ui`. Xpert reads `resources/read` content item metadata first and falls back to `resources/list` metadata when the read result does not include it.

Visibility controls who can call the tool:

| Visibility | Meaning |
| --- | --- |
| `model` | The tool may be exposed to the LLM. |
| `app` | The iframe may call the tool through `tools/call`. |

A common pattern is to expose one model-visible tool that opens the app, plus one or more app-only tools used by the iframe.

Xpert filters non-model-visible tools out of the LLM tool list. The MCP Apps host also rejects iframe calls to tools that are not app-visible or are disabled in the Xpert Toolset.

For plugin-side metadata and tool registration examples, see [MCP Tools and MCP Apps](../plugin/mcp-tools-and-apps).

## Resource Requirements

The app resource must return HTML with the MCP App profile MIME type `text/html;profile=mcp-app`. Registering the resource is the MCP server's responsibility; validating and sandboxing it is the host's responsibility.

Security defaults are intentionally strict:

- the initial App HTML must come from a `ui://` resource
- raw HTML is fetched at render time and is not persisted in chat history
- CSP defaults to deny-by-default, with explicit domains from resource `_meta.ui.csp`
- camera, microphone, geolocation, and clipboard-write are denied unless resource `_meta.ui.permissions` explicitly requests them
- iframe `resources/read` calls are limited to the same MCP server and reject browser/script schemes such as `http://`, `https://`, `javascript://`, `data://`, and `blob://`
- resource `domain` does not create a dedicated origin in v1; it is treated as unsupported host metadata
- iframe tool calls always go through the Xpert backend and its tenant, organization, workspace, toolset, and tool-enabled checks

## Bridge Methods

Inside the iframe, use JSON-RPC messages through `postMessage`. The app should initialize itself before requesting host capabilities. The initialize request includes the app identity, app capabilities, and protocol version:

```js
const id = 1;
window.parent.postMessage({
  jsonrpc: '2.0',
  id,
  method: 'ui/initialize',
  params: {
    protocolVersion: '2026-01-26',
    appInfo: {
      name: 'sales-dashboard',
      version: '0.1.0',
    },
    appCapabilities: {
      availableDisplayModes: ['inline'],
    },
  },
}, '*');
```

ChatKit responds with the standard `McpUiInitializeResult` shape:

```js
{
  jsonrpc: '2.0',
  id: 1,
  result: {
    protocolVersion: '2026-01-26',
    hostInfo: {
      name: 'xpert-chatkit',
      version: '1.0.0',
      title: 'Xpert ChatKit',
    },
    hostCapabilities: {
      serverTools: {},
      serverResources: {},
      openLinks: {},
      message: { text: {} },
      updateModelContext: { text: {}, structuredContent: {} },
    },
    hostContext: {
      displayMode: 'inline',
      availableDisplayModes: ['inline'],
      toolInfo: {
        tool: { name: 'sales_overview' },
      },
    },
  },
}
```

After initialization, ChatKit sends the original tool input and then a standard MCP `CallToolResult` payload:

```js
{
  jsonrpc: '2.0',
  method: 'ui/notifications/tool-input',
  params: {
    arguments: {
      year: 2026,
      groupBy: 'region',
    },
  },
}
```

```js
{
  jsonrpc: '2.0',
  method: 'ui/notifications/tool-result',
  params: {
    content: [
      { type: 'text', text: 'Revenue by region for 2026.' },
    ],
    structuredContent: {
      chart: {
        labels: ['West', 'East'],
        values: [7600000, 6500000],
      },
    },
    toolName: 'sales_overview',
    toolCallId: 'call_123',
    // Legacy compatibility only; new apps should read params.content and params.structuredContent.
    result: {},
  }
}
```

The app can then call app-visible tools:

```js
window.parent.postMessage({
  jsonrpc: '2.0',
  id: 2,
  method: 'tools/call',
  params: {
    name: 'sales_drilldown',
    arguments: {
      year: 2026,
      groupBy: 'product',
      filters: { region: 'West' },
    },
  },
}, '*');
```

The app can ask the host to open external links safely:

```js
window.parent.postMessage({
  jsonrpc: '2.0',
  id: 3,
  method: 'ui/open-link',
  params: {
    url: 'https://example.com/report',
  },
}, '*');
```

The app can also send follow-up user messages or model context back to the host:

```js
window.parent.postMessage({
  jsonrpc: '2.0',
  id: 4,
  method: 'ui/update-model-context',
  params: {
    content: [{ type: 'text', text: 'User selected West region.' }],
    structuredContent: {
      filters: { region: 'West' },
    },
  },
}, '*');
```

For dynamic height, notify ChatKit after rendering:

```js
window.parent.postMessage({
  jsonrpc: '2.0',
  method: 'ui/notifications/size-changed',
  params: { height: document.body.scrollHeight },
}, '*');
```

## Authoring and Packaging

The recommended way to ship an MCP App in Xpert is as a plugin-managed MCP server. The plugin owns the MCP server entrypoint, tool metadata, `ui://` resource, app-only tools, and install policy. ChatKit only hosts the resulting app instance.

For the plugin-side implementation flow, manifest schema, package layout, and local testing checklist, see [MCP Tools and MCP Apps](../plugin/mcp-tools-and-apps).

## Relationship to Other Xpert UI Surfaces

MCP Apps are one of several UI extension points in Xpert:

| Surface | Best for | Runtime model |
| --- | --- | --- |
| ChatKit Widgets | Declarative cards and structured UI data | Data-driven ChatKit renderer |
| MCP Apps | Interactive HTML apps returned by tool calls | Session-inline iframe with MCP bridge |
| Extension Views | Persistent workbench or integration pages | Xpert plugin manifest and view host |
| Middleware | Tool registration and workflow interception | Agent runtime behavior |

Do not put arbitrary HTML into the widget renderer. Do not use middleware as the resource host. MCP Apps should use the MCP resource and bridge flow, while extension views should keep using Xpert view manifests and platform data/action providers.

## Enablement and Operations

In production, enable MCP Apps explicitly:

```bash
XPERT_MCP_APPS_ENABLED=true
```

For local development, non-production environments enable MCP Apps by default. For plugin build, install, and runtime-copy checks, see [MCP Tools and MCP Apps](../plugin/mcp-tools-and-apps).

## Troubleshooting

| Symptom | Likely cause | Fix |
| --- | --- | --- |
| Resource fails with 404 after refresh | Old frontend bundle did not send revive metadata, or the Toolset was deleted | Rebuild/reload ChatKit frontend and confirm the message includes `toolsetId` and `resourceUri`. |
| App renders but tool calls fail | Target tool is not app-visible or is disabled | Set `_meta.ui.visibility = ['app']` and enable the tool in the Toolset policy. |
| Resource MIME error | Resource did not return `text/html;profile=mcp-app` | Fix the MCP resource response MIME type. |
| External script blocked | Resource metadata is missing the CSP domain | Add the domain to resource `_meta.ui.csp.resourceDomains`; do not put it on tool `_meta.ui.csp`. |

## See Also

- [MCP Tools](../toolset/mcp-tools/index)
- [ChatKit Widgets](./chatkit-widgets)
- [Client Tools](./chatkit-tool)
- [Skills and Plugins](./chatkit-runtime-capabilities)
- [Plugin Development](../plugin/develop)
- [MCP Tools and MCP Apps](../plugin/mcp-tools-and-apps)
