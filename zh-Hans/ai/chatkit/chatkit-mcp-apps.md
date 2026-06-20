---
title: MCP Apps
sidebar_position: 11
---

<Info>
在 ChatKit 对话中把 MCP 工具调用结果渲染为可交互的内联应用。
</Info>

MCP Apps 允许 MCP server 在工具结果中返回一个 HTML 应用。在 Xpert + ChatKit 中，只要 MCP 工具通过 `_meta.ui.resourceUri` 声明 UI 资源，ChatKit 就会把该资源渲染为对话中的内联 iframe，并通过标准 MCP Apps JSON-RPC bridge 与 Xpert 后端通信。

适合使用 MCP Apps 的场景包括图表、仪表盘、地图、表单、媒体浏览器、下钻分析等需要交互的工具结果。如果只是静态结构化卡片，优先使用 ChatKit Widgets。如果是工作台页面、集成配置页或长期存在的平台页面，继续使用 Xpert extension view。

## Xpert 支持的能力

Xpert MCP Apps Host 支持：

- 通过 `_meta.ui.resourceUri` 发现工具 UI 元数据
- ChatKit `McpApp` 消息组件
- `ui://` MCP resource，MIME 类型为 `text/html;profile=mcp-app`
- JSON-RPC bridge 方法，包括 `ui/initialize`、`ui/notifications/tool-input`、`ui/notifications/tool-result`、`tools/call`、`resources/read`、`ui/open-link`、`ui/message`、`ui/update-model-context`、`ui/request-display-mode`、`ui/notifications/size-changed`
- 通过 `_meta.ui.visibility = ['app']` 暴露 app-only 工具
- 从 MCP App resource metadata 读取 `_meta.ui.csp`、`_meta.ui.permissions`、`domain`、`prefersBorder`
- 短生命周期 app instance，并支持刷新历史消息后用安全元数据恢复
- 通过 Xpert plugin 安装的 plugin-managed MCP server

ChatKit 实现的是标准 MCP Apps bridge，不实现 ChatGPT 专属的 `window.openai` API。为了保持跨 host 兼容，MCP App 应优先使用标准 bridge。

## 架构

```mermaid
sequenceDiagram
    participant User as 用户
    participant ChatKit
    participant Agent as Xpert Agent
    participant Host as Xpert MCP Apps Host
    participant MCP as MCP Server

    User->>ChatKit: 请求交互式结果
    ChatKit->>Agent: 发送消息
    Agent->>MCP: tools/call 调用模型可见工具
    MCP-->>Agent: 工具结果 + _meta.ui.resourceUri
    Agent-->>ChatKit: McpApp 消息组件
    ChatKit->>Host: GET /mcp-apps/{appInstanceId}/resource
    Host->>MCP: resources/read ui://...
    MCP-->>Host: text/html;profile=mcp-app
    Host-->>ChatKit: HTML、CSP、初始工具结果
    ChatKit->>ChatKit: 渲染 sandbox iframe
    ChatKit-->>MCP: 通过 host RPC 代理 tools/call / resources/read
```

聊天历史只保存安全元数据，例如 `appInstanceId`、`resourceUri`、`toolName`、`toolsetId`、`serverName`。原始 HTML 不写入对话历史。页面刷新后，如果内存中的 app instance 已经过期，后端可以根据这些元数据重新连接 Toolset 并恢复 instance。

## 运行时元数据约定

ChatKit 不直接理解任意 MCP server 的实现细节，而是依赖 Xpert 后端保留从当前 Toolset 中发现的 MCP App 元数据。

运行时，当 Xpert 看到 `_meta.ui.resourceUri`，并且 resource URI 使用 `ui://` scheme 时，该 MCP 工具就具备 App 能力。工具 `_meta.ui` 只应该承载 `resourceUri` 和 `visibility`。CSP、浏览器权限、`domain`、`prefersBorder` 等资源安全与呈现元数据应放在 MCP App resource 的 `_meta.ui` 上；Xpert 会优先读取 `resources/read` content item metadata，并在缺失时使用 `resources/list` metadata 作为 fallback。

`visibility` 控制谁可以调用工具：

| Visibility | 含义 |
| --- | --- |
| `model` | 工具可以暴露给 LLM。 |
| `app` | iframe 可以通过 `tools/call` 调用该工具。 |

常见设计是：一个 model-visible 工具负责打开 MCP App，另有一个或多个 app-only 工具供 iframe 交互使用。

Xpert 会把非 model-visible 的工具从 LLM 工具列表中过滤掉。MCP Apps Host 也会拒绝 iframe 调用不可见于 app 或在 Toolset 中被禁用的工具。

插件侧 metadata 和工具注册示例请参考 [MCP Tools 和 MCP Apps](../plugin/mcp-tools-and-apps)。

## Resource 要求

MCP App resource 必须返回带 MCP App profile 的 HTML，MIME 类型为 `text/html;profile=mcp-app`。注册 resource 是 MCP server 的职责；校验和 sandbox 则由 host 负责。

安全默认值是严格的：

- 初始 App HTML 只接受 `ui://` resource
- 原始 HTML 在渲染时读取，不写入聊天历史
- CSP 默认 deny-by-default，只允许 resource `_meta.ui.csp` 中声明的域名
- camera、microphone、geolocation、clipboard-write 默认拒绝，只有 resource `_meta.ui.permissions` 显式请求时才会通过 iframe `allow` 放行
- iframe 内通过 `resources/read` 读取的资源限定在同一个 MCP server 内，拒绝 `http://`、`https://`、`javascript://`、`data://`、`blob://` 等浏览器或脚本 scheme
- resource `domain` 当前不会创建 dedicated origin；v1 中视为 host 暂不支持的 metadata
- iframe 的所有工具调用都经过 Xpert 后端，并执行租户、组织、工作区、Toolset、工具启用状态等校验

## Bridge 方法

iframe 内部通过 `postMessage` 发送 JSON-RPC 消息。App 应先初始化并读取 host 能力。初始化请求需要包含 App 信息、能力和协议版本：

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

ChatKit 会返回标准 `McpUiInitializeResult`：

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

初始化后，ChatKit 先发送原始工具输入，再发送标准 MCP `CallToolResult` 形状的工具结果：

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
    // legacy compatibility only; new apps should read params.content and params.structuredContent.
    result: {},
  }
}
```

App 可以继续调用 app-visible 工具：

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

App 可以请求 host 安全打开外链：

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

App 也可以把后续用户消息或模型上下文交回 host：

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

如果内容高度变化，渲染后通知 ChatKit：

```js
window.parent.postMessage({
  jsonrpc: '2.0',
  method: 'ui/notifications/size-changed',
  params: { height: document.body.scrollHeight },
}, '*');
```

## 编写和打包

在 Xpert 中推荐用 plugin-managed MCP server 交付 MCP App。插件负责 MCP server 入口、工具元数据、`ui://` resource、app-only 工具和安装策略；ChatKit 只负责托管工具调用产生的 app instance。

插件侧实现流程、manifest schema、包结构和本地测试清单请参考 [MCP Tools 和 MCP Apps](../plugin/mcp-tools-and-apps)。

## 与其他 Xpert UI 能力的关系

MCP Apps 是 Xpert 的 UI 扩展点之一：

| 能力 | 适合场景 | 运行模型 |
| --- | --- | --- |
| ChatKit Widgets | 声明式卡片和结构化 UI 数据 | ChatKit 数据驱动 renderer |
| MCP Apps | 工具调用结果中的交互式 HTML 应用 | 会话内 iframe + MCP bridge |
| Extension Views | 工作台页面、集成详情页、长期平台页面 | Xpert plugin manifest + view host |
| Middleware | 注册工具、拦截工作流、注入运行时行为 | Agent runtime behavior |

不要把任意 HTML 塞进 widget renderer，也不要让 middleware 承担 resource host 的职责。MCP Apps 应走 MCP resource 和 bridge 流程；extension view 仍然走 Xpert view manifest 以及平台 data/action provider。

## 启用和运维

生产环境需要显式启用：

```bash
XPERT_MCP_APPS_ENABLED=true
```

本地非生产环境默认启用 MCP Apps。插件构建、安装和运行副本检查请参考 [MCP Tools 和 MCP Apps](../plugin/mcp-tools-and-apps)。

## 故障排查

| 现象 | 可能原因 | 处理方式 |
| --- | --- | --- |
| 刷新后 resource 返回 404 | 前端旧 bundle 没有发送恢复元数据，或 Toolset 已删除 | 重新构建/加载 ChatKit 前端，并确认消息中包含 `toolsetId` 和 `resourceUri`。 |
| App 能渲染但工具调用失败 | 目标工具不是 app-visible，或在 Toolset 中被禁用 | 设置 `_meta.ui.visibility = ['app']`，并在 Toolset policy 中启用该工具。 |
| Resource MIME 错误 | resource 没有返回 `text/html;profile=mcp-app` | 修正 MCP resource 的 MIME 类型。 |
| 外部脚本被 CSP 阻止 | resource metadata 的 CSP 未声明对应域名 | 把域名加入 resource `_meta.ui.csp.resourceDomains`，不要放在 tool `_meta.ui.csp`。 |

## 相关文档

- [MCP 工具](../toolset/mcp-tools/mcp-tools)
- [ChatKit Widgets](./chatkit-widgets)
- [客户端工具](./chatkit-tool)
- [技能和插件](./chatkit-runtime-capabilities)
- [插件开发](../plugin/development-steps)
- [MCP Tools 和 MCP Apps](../plugin/mcp-tools-and-apps)
