---
sidebar_position: 5
title: MCP Tools and MCP Apps
---

Plugins can ship MCP servers as installable plugin resources. This is the recommended way to add standard MCP tools, and it is also the recommended way to deliver MCP Apps that render inside ChatKit.

This page focuses on how to package and implement the plugin side. For the ChatKit host runtime, iframe bridge, message rendering, and security model, see [ChatKit MCP Apps](../chatkit/chatkit-mcp-apps).

For a complete business-oriented walkthrough, continue with [Build a Sales Performance MCP App Plugin](../tutorial/echarts-mcp-app). It uses sales performance analysis to show how a model-visible tool, app-only tool, `ui://` resource, and Vanilla TypeScript App work together.

## When to Use This Pattern

Use a plugin-managed MCP server when you want to:

- expose tools through the MCP protocol instead of an Xpert-native ToolsetStrategy
- keep the tool implementation portable across MCP hosts
- return an interactive MCP App from a tool result
- ship app-only tools that are callable by the iframe but not visible to the model
- install, enable, disable, and version the MCP server as part of a plugin

Do not use this pattern for persistent Workbench pages or integration configuration pages. Those should use [Remote Component Plugins](./remote-component) or other view extension surfaces. Do not use Agent middleware as the MCP App resource host; middleware can trigger workflows, but MCP Apps should be served through MCP resources and the MCP Apps host.

## Package Layout

A minimal plugin-managed MCP App package usually has this shape:

```text
tools/my-mcp-app/
├── .xpertai-plugin/
│   └── plugin.json
├── package.json
├── src/
│   ├── index.ts
│   ├── mcp-server.ts
│   └── lib/
│       ├── mcp-tools.ts
│       ├── app-html.ts
│       └── data.ts
└── tsconfig.lib.json
```

The plugin entry in `src/index.ts` can stay lightweight when the package only contributes a plugin-managed MCP server. It should still export normal plugin metadata so the host can list, install, and initialize the plugin.

```ts
import { z } from 'zod';
import type { XpertPlugin } from '@xpert-ai/plugin-sdk';
import { MyMcpAppPluginModule } from './lib/plugin.js';

const plugin: XpertPlugin = {
  meta: {
    name: '@acme/plugin-sales-mcp-app',
    version: '0.1.0',
    category: 'tools',
    targetApps: ['xpert'],
    displayName: 'Sales MCP App',
    description: 'Interactive sales analysis tools delivered through MCP Apps.',
  },
  config: {
    schema: z.object({}),
  },
  register() {
    return { module: MyMcpAppPluginModule, global: true };
  },
};

export default plugin;
```

## package.json

The MCP server entry must be included in the published package and built into `dist`.

```json
{
  "name": "@acme/plugin-sales-mcp-app",
  "version": "0.1.0",
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "bin": {
    "acme-sales-mcp-app": "./dist/mcp-server.js"
  },
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    },
    "./mcp-server": {
      "types": "./dist/mcp-server.d.ts",
      "import": "./dist/mcp-server.js"
    }
  },
  "files": [
    "dist",
    ".xpertai-plugin",
    "README.md"
  ],
  "dependencies": {
    "@modelcontextprotocol/ext-apps": "^1.7.4",
    "@modelcontextprotocol/sdk": "^1.29.0"
  },
  "peerDependencies": {
    "@xpert-ai/plugin-sdk": "^3.9.1",
    "zod": "^3.25.0"
  }
}
```

Keep `@xpert-ai/plugin-sdk` in `peerDependencies` so the host provides the SDK copy. Keep `@modelcontextprotocol/sdk` in `dependencies` when the stdio server imports it directly. MCP Apps plugins should also depend on `@modelcontextprotocol/ext-apps` and use the official `registerAppTool`, `registerAppResource`, and `RESOURCE_MIME_TYPE` helpers. `ext-apps` is ESM-only, so use `"type": "module"` and Node.js 20 or later for the plugin server.

## Plugin Manifest

Declare the MCP server in `.xpertai-plugin/plugin.json`.

```json
{
  "name": "@acme/plugin-sales-mcp-app",
  "version": "0.1.0",
  "targetApps": ["xpert"],
  "targetAppMeta": {
    "xpert": {
      "types": ["mcp-server", "tool"],
      "capabilities": ["mcp-apps", "sales-analysis"]
    }
  },
  "mcpServers": {
    "sales-drilldown": {
      "type": "stdio",
      "command": "node",
      "args": ["${PLUGIN_ROOT}/dist/mcp-server.js"],
      "policy": {
        "enabled": true,
        "defaultToolsApprovalMode": "approve",
        "enabledTools": [
          "sales_overview",
          "sales_drilldown"
        ],
        "tools": {
          "sales_overview": {
            "approvalMode": "approve"
          },
          "sales_drilldown": {
            "approvalMode": "approve"
          }
        }
      }
    }
  }
}
```

Use `${PLUGIN_ROOT}` instead of an absolute installed runtime path. Xpert stores the placeholder in the generated Toolset schema and resolves it at runtime to the currently loaded plugin bundle. This prevents stale `@runtime__...` paths after a plugin is reinstalled or reloaded.

Use `${PLUGIN_DATA}` for plugin-owned writable data if the server needs local state.

## MCP Server Entry

The stdio entry should create the MCP server, register resources and tools, and connect to `StdioServerTransport`.

```ts
#!/usr/bin/env node
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { pathToFileURL } from 'node:url';
import { registerSalesMcpApp } from './lib/mcp-tools.js';

export function createSalesMcpServer() {
  const server = new McpServer({
    name: 'acme-sales-mcp-app',
    version: '0.1.0',
  });

  registerSalesMcpApp(server);
  return server;
}

export async function main() {
  const server = createSalesMcpServer();
  await server.connect(new StdioServerTransport());
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    const message = error instanceof Error ? error.stack || error.message : String(error);
    process.stderr.write(`${message}\n`);
    process.exit(1);
  });
}
```

Do not write normal logs to `stdout` from a stdio MCP server because stdout is reserved for MCP protocol messages. Write diagnostics to `stderr`.

## Register an MCP App Resource

An MCP App resource must use a `ui://` URI and return `text/html;profile=mcp-app`.

```ts
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { ReadResourceResult } from '@modelcontextprotocol/sdk/types.js';
import {
  RESOURCE_MIME_TYPE,
  registerAppResource,
} from '@modelcontextprotocol/ext-apps/server';
import { getDashboardHtml } from './app-html.js';

const SALES_APP_URI = 'ui://sales-dashboard';
const SALES_APP_CSP = {
  resourceDomains: ['https://cdn.jsdelivr.net'],
  connectDomains: [],
  frameDomains: [],
  baseUriDomains: [],
};

function buildDashboardResource(): ReadResourceResult {
  return {
    contents: [
      {
        uri: SALES_APP_URI,
        mimeType: RESOURCE_MIME_TYPE,
        text: getDashboardHtml(),
        _meta: {
          ui: {
            csp: SALES_APP_CSP,
            prefersBorder: true,
          },
        },
      },
    ],
  };
}

export function registerSalesMcpApp(server: McpServer) {
  registerAppResource(
    server,
    'sales-dashboard',
    SALES_APP_URI,
    {
      title: 'Sales Dashboard',
      description: 'Interactive sales dashboard rendered in ChatKit.',
      _meta: {
        ui: {
          csp: SALES_APP_CSP,
          prefersBorder: true,
        },
      },
    },
    () => buildDashboardResource(),
  );
}
```

Resource security and rendering metadata belongs on resource `_meta.ui`. Content item metadata from `resources/read` takes precedence; `_meta.ui` in the `registerAppResource` config appears in `resources/list` and acts as a host fallback. Do not put CSP or permissions on tool `_meta.ui` except as a temporary legacy compatibility fallback.

For small demos, returning HTML from a TypeScript function is acceptable. For production apps, prefer keeping the app source in normal frontend files and bundling it to a static HTML or JS asset during build. The MCP resource handler can then read the built asset from `dist`. This keeps the app maintainable and avoids hand-editing a large template string.

The recommended centralized authoring pattern is to keep the MCP App frontend source inside the plugin package under `src/app`:

```text
src/app/
├── index.html
├── main.ts
└── styles.css
scripts/
└── build-app.mjs
dist/
└── app/
    └── index.html
```

`index.html` owns the shell, `main.ts` owns the standard MCP Apps bridge and interactions, and `styles.css` owns the view styles. Use Vite or esbuild during the plugin build to produce a single `dist/app/index.html` that the MCP resource can return. A server-side helper such as `src/lib/app-html.ts` should only read the built artifact; it should not hand-maintain a large HTML string.

With esbuild, the minimal build script can read `src/app/index.html`, bundle `src/app/main.ts`, inline `src/app/styles.css`, and write `dist/app/index.html`. Wire that into the plugin build, for example:

```json
{
  "scripts": {
    "build:app": "node scripts/build-app.mjs"
  }
}
```

If the package uses Nx, make sure `nx build <plugin>` also runs the App build before or after compiling the server code, and verify the published package includes `dist`, `.xpertai-plugin`, and any scripts or source directories required by the build/runtime path.

## Register Tools

The model-visible tool opens the MCP App by returning `_meta.ui.resourceUri`. It can also return `structuredContent` for the app's initial state and plain text as a fallback for clients that do not render the UI.

```ts
import { registerAppTool } from '@modelcontextprotocol/ext-apps/server';

const overviewMeta = {
  ui: {
    resourceUri: SALES_APP_URI,
    visibility: ['model', 'app'],
  },
  'openai/outputTemplate': SALES_APP_URI,
};

registerAppTool(
  server,
  'sales_overview',
  {
    title: 'Sales Overview',
    description: 'Show an interactive sales dashboard with drilldown analysis.',
    inputSchema: {
      metric: z.enum(['revenue', 'margin', 'orders']).default('revenue'),
      groupBy: z.enum(['region', 'product', 'month']).default('region'),
      year: z.number().int().default(2026),
    },
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
    _meta: overviewMeta,
  },
  (args) => ({
    content: [{ type: 'text', text: 'Revenue by region for 2026.' }],
    structuredContent: {
      chart: {
        labels: ['West', 'East', 'South', 'North'],
        values: [7600000, 6500000, 5600000, 4800000],
      },
    },
    _meta: overviewMeta,
  }),
);
```

`registerAppTool` normalizes `_meta.ui.resourceUri` and keeps compatibility resource URI metadata. `_meta['openai/outputTemplate']` can be included as a ChatGPT compatibility alias, but Xpert + ChatKit does not implement the ChatGPT-specific `window.openai` API.

App-only tools are callable through the MCP Apps bridge but are filtered out of the LLM tool list.

```ts
registerAppTool(
  server,
  'sales_drilldown',
  {
    title: 'Sales Drilldown',
    description: 'App-only tool used by the dashboard after a chart click.',
    inputSchema: {
      metric: z.enum(['revenue', 'margin', 'orders']).default('revenue'),
      groupBy: z.enum(['region', 'product', 'month']).default('product'),
      year: z.number().int().default(2026),
      filters: z.object({
        region: z.string().optional(),
        product: z.string().optional(),
        month: z.string().optional(),
      }).default({}),
    },
    _meta: {
      ui: {
        visibility: ['app'],
      },
    },
  },
  (args) => ({
    content: [{ type: 'text', text: 'Drilldown data loaded.' }],
    structuredContent: {
      chart: {
        labels: ['Hardware', 'Software', 'Services'],
        values: [4100000, 2600000, 900000],
      },
      filters: args.filters,
    },
  }),
);
```

Xpert enforces both sides of the visibility contract:

- tools without `model` visibility are not exposed to the LLM
- iframe calls are rejected unless the target tool has `app` visibility and is enabled by Toolset policy

## App HTML

The app runs inside a sandboxed iframe and communicates with ChatKit through the MCP Apps JSON-RPC bridge. Keep the plugin documentation focused on authoring and packaging; the full host contract is documented in [ChatKit MCP Apps](../chatkit/chatkit-mcp-apps).

At minimum, the HTML app should:

- initialize with `ui/initialize`
- handle `ui/notifications/tool-input` for the original tool arguments
- handle `ui/notifications/tool-result` for the original tool result
- call app-visible tools with `tools/call`
- notify size changes with `ui/notifications/size-changed`
- avoid direct API calls to the Xpert backend

See [ChatKit MCP Apps](../chatkit/chatkit-mcp-apps) for the bridge message shapes and host behavior. New apps should read the standard `CallToolResult` shape from `ui/notifications/tool-result.params.content` and `params.structuredContent`; temporarily fall back to `params.result` only for older hosts. Keep the app source as normal frontend code when it grows beyond a small demo, and treat the MCP resource as the delivery mechanism for the built artifact.

If the app loads CDN assets, declare the domains in resource `_meta.ui.csp.resourceDomains`. If the app needs network calls through the browser, declare the target domains in resource `_meta.ui.csp.connectDomains`; prefer `resources/read` or `tools/call` for host-mediated access.

## Build and Install

Build the plugin and make sure the generated package contains `dist/mcp-server.js` and `.xpertai-plugin/plugin.json`.

```bash
pnpm nx build @acme/plugin-sales-mcp-app
```

Install or reload the plugin in Xpert, then initialize its resources so Xpert creates the plugin-managed MCP Toolset. Attach that Toolset to an agent and ask ChatKit for the interactive result.

For local development, remember that the installed runtime copy under the Xpert plugin directory may not update when the source package is rebuilt. Reinstall or reload the plugin after changes so the runtime copy receives the latest `dist` files and manifest.

## Test Checklist

Cover these cases before shipping:

- stdio server starts without writing normal logs to stdout
- App build output `dist/app/index.html` is generated and contains the MCP Apps bridge script
- `tools/list` returns the model-visible tool and excludes app-only tools
- model-visible tool result includes `_meta.ui.resourceUri`
- MCP App resource returns `text/html;profile=mcp-app`
- MCP App resource metadata includes the required `_meta.ui.csp`, `_meta.ui.permissions`, and `prefersBorder`
- `structuredContent` has the shape expected by the iframe
- app-only tool has `_meta.ui.visibility = ['app']`
- Toolset policy enables every tool the app needs
- iframe can initialize, receive the original tool input and result, call app-only tools, and resize
- external scripts and connections are covered by resource CSP metadata
- plugin reinstall does not persist stale absolute `@runtime__...` paths

## Troubleshooting

| Symptom | Likely cause | Fix |
| --- | --- | --- |
| `Cannot find module ... @runtime__...` | The persisted MCP schema contains an old installed runtime path | Use `${PLUGIN_ROOT}` in `plugin.json`, rebuild the plugin, and reinstall or reinitialize older plugin resources. |
| MCP server exits immediately | Missing built `dist/mcp-server.js`, bad ESM/CJS config, or an exception during server setup | Run `node dist/mcp-server.js` locally and check stderr. Confirm `type`, `exports`, and `files` in `package.json`. |
| Tool appears in model tools even though it is app-only | Missing `_meta.ui.visibility = ['app']` or host metadata did not preserve `_meta` | Set visibility on the tool and verify the generated Toolset metadata. |
| App can load but `tools/call` fails | Target tool is not app-visible or disabled by Toolset policy | Add `app` visibility and enable the tool in `mcpServers.*.policy.enabledTools`. |
| CDN script is blocked | Resource CSP metadata does not include the CDN domain | Add the domain to resource `_meta.ui.csp.resourceDomains`. |

## See Also

- [ChatKit MCP Apps](../chatkit/chatkit-mcp-apps)
- [MCP Tools](../toolset/mcp-tools/index)
- [Remote Component Plugins](./remote-component)
- [Plugin Development Steps](./develop)
- [Publishing and Usage](./install)
