---
title: 插件、中间件与数字专家
sidebar_position: 13
---

ChatKit 的统一资源选择器允许用户为当前会话添加 Agent Plugins、中间件和已发布数字专家。这些能力增补到会话入口 Agent，不修改 Assistant 的草稿或发布版本。

## 开启统一入口

```ts
import type { ChatKitOptions } from '@xpert-ai/chatkit-types';

const composer: ChatKitOptions['composer'] = {
  projects: { enabled: true },
  resources: { enabled: true },
};
```

将此配置合并到已有的 Xpert 托管 API options。`composer.resources.enabled` 默认关闭；宿主需要启用它，并部署支持资源目录、会话保存及工作空间 Connector 的后端和 SDK。

## 选择器交互

入口位于输入框下方的项目、文件选择器之后，名称为“插件”，显示已选资源的头像与数量。一级菜单列出**当前会话已添加的资源**，不是整个组织的安装清单。再次点击已选项可移除。

| 二级菜单 | 展示内容与操作 |
| --- | --- |
| 连接插件 | 管理员已上架的标准插件，以及可执行的工作空间 Connector 能力。点击添加；需要连接时进入连接流程。支持搜索、分页和“浏览全部插件” |
| 中间件 | 加载全部可用的中间件配置，支持搜索；点击条目直接添加，不显示加号或“浏览全部” |
| 数字专家 | 加载全部可用的已发布专家，支持搜索；点击条目直接添加，不显示加号或“浏览全部” |

“连接插件”不会从第三方市场下载或安装服务器代码。包的导入、配置和上架属于管理员操作。

中间件和数字专家的 info 图标常显，悬停或键盘聚焦可查看信息卡；同一菜单范围只显示一张卡片。中间件卡片还展示绑定的 Views。插件条目不显示 info 图标；需要连接时显示连接状态与操作界面。

数字专家使用实际 avatar，中间件使用其配置的 avatar，缺省时使用类型图标。描述支持字符串和 `I18nObject`，按当前语言显示，例如：

```json
{
  "en_US": "Review BOM changes and their impact.",
  "zh_Hans": "审查 BOM 变更及其影响。"
}
```

菜单复用项目、文件选择器的主题变量与紧凑样式，搜索框透明且无边框。展开面板在窄屏以底部抽屉呈现；参见 [主题和自定义](./chatkit-themes)。

## 三种资源的来源

| 资源 | 标识 `kind` | 提供的能力 |
| --- | --- | --- |
| Agent Plugin | `agent_plugin` | 根目录 `plugin.json` 标识的标准资源包，可提供 Skills、远程 MCP 及 Xpert 扩展引用 |
| 中间件 | `middleware` | 已安装 provider 的可用配置；由现有中间件 registry 创建运行时实例 |
| 数字专家 | `external_xpert` | 获准使用的已发布专家，通过协作者调用链执行 |

标准包与原生 Xpert 代码插件是不同格式。管理员通过 Git 仓库＋ref／子目录或 ZIP 导入标准包，再授权工作空间并上架。`extensions["cn.xpertai"]` 可声明中间件预设、专家逻辑引用和 Connector 依赖；它不动态加载服务器代码。

目录结合已上架绑定和后端自动发现：已安装且默认配置有效、允许用户添加的中间件 provider，以及有权使用的已发布专家。缺少必需配置的 provider、当前 Assistant 本身和已配置在图内的专家不会重复作为可添加项。管理员配置的绑定优先；停用绑定不会通过自动发现重新开放。

标准包支持 Skills 与 Streamable HTTP MCP。stdio、旧 SSE 及无效组件显示诊断并隔离，不影响同包其他有效组件。插件按整体选择；`partial` 表示只有有效组件可用。第三方市场订阅、旧 Codex／Claude 清单兼容、任意远程 Agent URL 和包内 Hooks 不在此接入范围内。

## 工作空间连接与账号授权

Connector 提供外部服务的连接和凭据，插件提供 Agent 使用这些服务的能力。一个插件可以依赖多个连接；仅提供凭据的 Connector 不单独显示为可选能力。

**连接属于工作空间，不属于用户个人。** 用户通过 Assistant 的运行权限使用该 Assistant 所在空间的连接。配置权限与使用权限分开：

- 有连接配置权限时显示“连接账号”，点击直接进入宿主的目标 Connector 配置／OAuth 流程。
- 没有配置权限时提示联系工作空间管理员，不提供个人授权入口。
- 连接成功后 ChatKit 重新检查服务端就绪状态，再继续添加资源。取消或失败保留输入草稿和原有选择。

宿主通过 `composer.resources.onConnect` 接管连接流程：

```ts
import type {
  ChatKitOptions,
  WorkspaceConnectorConnectHandler,
} from '@xpert-ai/chatkit-types';

// 由宿主实现：重新校验 Assistant、工作空间、绑定和配置权限，
// 打开连接界面，等待完成或取消。不能向 ChatKit 返回任何凭据。
declare const openWorkspaceConnector: WorkspaceConnectorConnectHandler;

const composer: ChatKitOptions['composer'] = {
  resources: {
    enabled: true,
    onConnect: openWorkspaceConnector,
  },
};
```

回调接收 `{ assistantId, bindingId }`，返回 `Promise<{ status: 'connected' | 'cancelled' }>`。`bindingId` 是待配置的 Connector 绑定，由授权响应解析；不要把它当成标准插件包 ID。iframe 场景由 Web Component 的 `onConnectWorkspaceConnector` 命令桥接到宿主，须使用匹配的 UI 与 Web Component 版本。

已有个人 OAuth 凭据不会复制为共享凭据。旧连接需要管理员重新配置为空间连接，必要时重新上架插件版本。

<Note>
`composer.connectors` 已标记 deprecated，但尚未删除。标准插件通过 `composer.resources` 选择，其 Connector 依赖通过 `onConnect` 连接。当前版本若还要在统一菜单展示原生 Connector 能力，仍需保留 `composer.connectors: { enabled: true }`；Xpert Cloud 宿主已同时开启这两个选项。启用统一资源入口后，旧的“＋ → 连接器”入口隐藏。底层 Connector 的工作空间配置、OAuth 和调用能力继续使用。
</Note>

## 持久化、缓存与执行边界

- 新会话先校验草稿选择，首条消息携带完整资源集合。发送完成后不会清空选择。
- 已存在的会话通过资源专用接口保存完整集合；刷新或切换回来时恢复。
- 三种菜单按客户端、Assistant 和项目范围缓存目录，切换菜单不会重复刷新。手动刷新、窗口重新获得焦点或范围变化时重新读取；中间件和专家自动取完分页后在本地搜索。
- 切换项目重新验证资源；切换会话恢复该会话的集合。目录缓存不是授权依据，每次执行仍由后端校验。
- 资源带配置版本，更新插件不会静默替换已有会话引用；失效项保留提示，用户可移除或重新选择。
- 使用 `revision` 防止并发覆盖，冲突返回 `409`。应重新读取服务端选择，再决定修改，不能盲目覆盖。
- 修改从下一次执行生效，进行中的执行和中断恢复使用原快照；权限撤销仍阻止后续调用。
- 动态资源只装配到入口 Agent，子专家使用自身配置。必需中间件不能关闭，重复资源去重，不能合并的配置冲突由后端拒绝。

| 服务端状态 | 用户含义 |
| --- | --- |
| `ready` | 可用 |
| `requires_auth` | 工作空间连接尚未就绪，需要配置或连接 |
| `configuration_required` | 缺少配置，需管理员处理 |
| `partial` | 部分组件可用 |
| `unavailable` | 已失效或不可访问，不能继续添加 |

客户端校验中或校验失败也会显示相应状态；不能因为目录暂未返回某项就把历史选择清空。

## SDK 与旧能力选择的区别

ChatKit 的 Xpert 请求统一通过 `@xpert-ai/xpert-sdk`。标准插件、中间件和专家使用独立的 `runtimeResources`：

```json
{
  "revision": 0,
  "resources": [
    { "bindingId": "<目录返回的绑定 ID>", "version": "<目录返回的配置版本>" }
  ]
}
```

不要自行构造绑定 ID 或版本；使用目录结果。已有会话的读写使用 conversation ID，不是 thread ID。

| SDK 方法 | 用途 |
| --- | --- |
| `assistants.getResources(assistantId, options)` | 按项目、类型和搜索条件查询目录，支持 `offset` / `limit` |
| `assistants.validateResources(assistantId, selection, projectId)` | 校验未保存的完整选择 |
| `assistants.authorizeResource(assistantId, input)` | 解析指定插件 MCP 组件的工作空间连接与配置权限 |
| `conversations.getRuntimeResources(conversationId)` | 读取会话选择 |
| `conversations.updateRuntimeResources(conversationId, selection)` | 带 revision 保存完整选择 |
| `connectors.runtimeOptions(assistantId, options)` / `connectors.runtimeStatus(assistantId, bindingId)` | 原生 Connector 的目录和就绪状态 |

统一 UI 中的原生 Connector 仍沿用 `connectorBindingIds`，并非所有条目都转换成 `runtimeResources`。旧 `runtimeCapabilities.plugins.nodeKeys` 则只表示 **Assistant 图内的中间件节点**，`subAgents.nodeKeys` 表示图内专家选择；详见 [技能与图内能力](./chatkit-runtime-capabilities)。一次性 `/` 能力 token 与持续生效的会话资源是两个机制。

## 验证接入

1. 添加一个无需连接的插件，发送消息、刷新、切换会话后确认选择恢复。
2. 添加中间件和数字专家，确认实际调用生效且 Assistant 发布图未改变。
3. 快速切换三个菜单并检查缓存；悬停不同 info 图标，确认只显示当前卡片及中间件 Views。
4. 分别以有／无配置权限的身份检查连接提示；取消连接不丢失草稿，完成连接后可继续添加。
5. 移除、并发更新、切换项目或停用绑定后，确认会话选择和不可用提示符合预期。
