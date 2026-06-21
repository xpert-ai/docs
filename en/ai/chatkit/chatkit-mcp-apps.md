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

The chat history stores only safe metadata such as `appInstanceId`, `resourceUri`, `toolName`, `toolsetId`, and `serverName`, plus size-limited snapshots of the initial tool input/result. The raw HTML is not stored in the conversation. On page refresh, the backend can reconnect to the toolset and rebuild an expired app instance from the stored metadata.

## History Replay And Initial Tool Results

An MCP App usually needs the triggering tool call's `tool-input` and `tool-result` during initialization. Xpert + ChatKit resolves that data in this order:

1. **Use the live app instance first**: while the in-memory app instance is still valid, the resource response returns the complete initial `toolResult` kept on the live instance.
2. **Revive when the live instance is gone**: after a history refresh, a closed Agent Toolset, or a backend restart, the MCP Apps Host reconnects to the Toolset, reads the `ui://` resource again, and creates a fresh app instance.
3. **Fall back to small snapshots in chat history**: if the message contains a size-limited initial `toolResult`, ChatKit replays it through `ui/notifications/tool-result`; if no replayable result is available, ChatKit sends only `ui/notifications/tool-input` and does not invent an empty result.

To keep chat messages from becoming large data blobs, Xpert does not inline every tool result into message content. By default, only standardized `CallToolResult` payloads whose serialized size is at most `128KB` are persisted inline. Oversized results store only `toolResultSize` and `toolResultTruncated: true`. The backend threshold can be configured with:

```bash
XPERT_MCP_APP_HISTORY_TOOL_RESULT_MAX_BYTES=131072
```

This keeps live runs fully interactive while preventing history messages from ballooning. Small results can be replayed directly from history; large results should provide a graceful fallback such as a summary, a rerun prompt, or app-visible tools that page or reload data on demand. If a product needs full replay of large historical results, store them in a dedicated artifact store rather than expanding message content.

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

The resource can also declare display metadata in `_meta.ui`: `title`, `description`, and `icon`. `title` and `description` may be strings or Xpert-style `I18nObject` values. `icon` uses the shared `IconDefinition` shape. ChatKit stores only this safe descriptor in the message history, localizes the text with the current ChatKit language, and renders the icon/title/description in the MCP App message header.

Security defaults are intentionally strict:

- the initial App HTML must come from a `ui://` resource
- raw HTML is fetched at render time and is not persisted in chat history
- CSP defaults to deny-by-default, with explicit domains from resource `_meta.ui.csp`
- camera, microphone, geolocation, and clipboard-write are denied unless resource `_meta.ui.permissions` explicitly requests them
- iframe `resources/read` calls are limited to the same MCP server and reject browser/script schemes such as `http://`, `https://`, `javascript://`, `data://`, and `blob://`
- resource `domain` does not create a dedicated origin in v1; it is treated as unsupported host metadata
- iframe tool calls always go through the Xpert backend and its tenant, organization, workspace, toolset, and tool-enabled checks

## Theme Variables

Before ChatKit writes an MCP App HTML document into the iframe, it injects host theme variables into the app `<head>`. Variables use the generic `--mcp-app-*` prefix so other MCP Apps hosts can reuse the same contract:

```html
<style id="mcp-app-host-theme">
  :root {
    color-scheme: light;
    --mcp-app-color-background: hsl(0 0% 100%);
    --mcp-app-color-foreground: hsl(222.2 84% 4.9%);
    --mcp-app-color-primary: hsl(221.2 83.2% 53.3%);
  }
</style>
```

MCP Apps should use the public `--mcp-app-*` variables instead of depending on ChatKit internal classes or private tokens. The current host provides:

| Variable | Purpose |
| --- | --- |
| `--mcp-app-color-background` / `--mcp-app-color-foreground` | page background and body text |
| `--mcp-app-color-card` / `--mcp-app-color-card-foreground` | cards, panels, chart containers |
| `--mcp-app-color-popover` / `--mcp-app-color-popover-foreground` | popovers and menus |
| `--mcp-app-color-primary` / `--mcp-app-color-primary-foreground` | primary actions, key metrics, chart primary color |
| `--mcp-app-color-secondary` / `--mcp-app-color-secondary-foreground` | secondary actions |
| `--mcp-app-color-muted` / `--mcp-app-color-muted-foreground` | muted backgrounds and supporting text |
| `--mcp-app-color-accent` / `--mcp-app-color-accent-foreground` | hover, selected, and accent states |
| `--mcp-app-color-destructive` / `--mcp-app-color-destructive-foreground` | destructive actions and error states |
| `--mcp-app-color-border`, `--mcp-app-color-input`, `--mcp-app-color-ring` | borders, inputs, focus rings |
| `--mcp-app-color-chart-1` through `--mcp-app-color-chart-5` | chart color hints from the host |
| `--mcp-app-radius` | base border radius |
| `--mcp-app-font-sans`, `--mcp-app-font-mono` | sans and monospace fonts |
| `--mcp-app-color-scheme` | `light` or `dark` |

Recommended app styling:

```css
body {
  margin: 0;
  font-family: var(--mcp-app-font-sans, system-ui, sans-serif);
  color: var(--mcp-app-color-foreground, #0f172a);
  background: var(--mcp-app-color-background, #fff);
}

.panel {
  background: var(--mcp-app-color-card, #fff);
  color: var(--mcp-app-color-card-foreground, #0f172a);
  border: 1px solid var(--mcp-app-color-border, #e2e8f0);
  border-radius: var(--mcp-app-radius, 8px);
}

.primary {
  background: var(--mcp-app-color-primary, #2563eb);
  color: var(--mcp-app-color-primary-foreground, #fff);
}
```

If a charting library needs colors in JavaScript, read the injected CSS variables:

```js
const styles = getComputedStyle(document.documentElement);
const primaryColor = styles
  .getPropertyValue('--mcp-app-color-primary')
  .trim();
```

Note: `--mcp-app-color-chart-*` values are host-provided chart color hints, not a guarantee that they fit every business chart. If the host theme uses neutral or muted chart tokens, the MCP App can define its own semantic data palette such as `--sales-chart-revenue`, `--sales-chart-margin`, or `--risk-chart-high`, while still using `--mcp-app-*` for background, text, borders, fonts, and radius.

`ui/initialize` still returns `hostContext.theme` as the `light` / `dark` string. The same variable map is also returned as `hostContext.themeCssVariables` so apps can initialize chart themes or canvas colors.

ChatKit also passes the current UI language through `hostContext.locale`, `hostContext.language`, and `hostContext.direction`. Before the iframe document runs, ChatKit sets the app HTML `lang` and `dir` attributes to the same values. MCP Apps should use these fields to localize labels, number/date formatting, chart titles, and validation messages inside the app resource.

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
      theme: 'light',
      themeCssVariables: {
        '--mcp-app-color-background': 'hsl(0 0% 100%)',
        '--mcp-app-color-foreground': 'hsl(222.2 84% 4.9%)',
      },
      locale: 'zh-Hans',
      language: 'zh',
      direction: 'ltr',
      toolInfo: {
        tool: {
          name: 'sales_overview',
          inputSchema: {
            type: 'object',
            properties: {},
          },
        },
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
XPERT_MCP_APP_TOKEN_SECRET=<long-random-secret>
```

ChatKit stores only safe MCP App component metadata in chat history. The backend also issues an `appInstanceToken` for each app instance and ChatKit includes it on resource and RPC requests. In production, revive, `tools/call`, and `resources/read` requests are rejected if the signed token is missing, expired, or does not match the tenant, workspace, Toolset, server, tool, and resource URI.

For local development, non-production environments enable MCP Apps by default and tolerate legacy messages without `appInstanceToken`. For plugin build, install, controlled stdio runtime, and runtime-copy checks, see [MCP Tools and MCP Apps](../plugin/mcp-tools-and-apps).

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
