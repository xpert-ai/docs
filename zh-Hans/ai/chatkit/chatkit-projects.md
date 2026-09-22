---
title: 项目与项目类型选择
sidebar_position: 12
---

项目选择器让用户在发送消息前确定业务上下文。项目类型则用来区分普通对话项目和由应用管理的业务项目，例如 BOM Case。同一个 Assistant 可以参与多个项目；选择项目不会修改 Assistant 的配置。

## 启用项目选择器

在使用 Xpert 托管 API 的 ChatKit 配置中开启 `composer.projects`：

```ts
import type { ChatKitOptions } from '@xpert-ai/chatkit-types';

const composer: ChatKitOptions['composer'] = {
  projects: {
    enabled: true,
    createEnabled: true,
  },
};
```

将 `composer` 合并到已有 ChatKit options 中。项目选择默认关闭，Custom API 模式不使用此功能。`createEnabled` 在启用选择器后默认开启；仅支持选择已有项目的宿主应设置为 `false`。

入口位于输入框下方，与文件、插件选择入口并列。面板支持：

- 按名称搜索当前 Assistant 可访问的活动项目，分页加载结果。
- 在“按类型分组”和“最近更新”之间切换。
- 按应用和项目类型筛选；点击分组上的筛选按钮可聚焦该类型。
- 显示历史项目的“未分类”分组；清除类型筛选不会清空搜索文字或当前项目。
- 选择项目后显示项目名称与勾选状态；长名称截断，悬停可查看完整名称。

项目可见性由后端校验，前端开启入口不授予项目访问权限。加载失败会提供重试，不能把失败当作“没有项目”。

## 项目类型从哪里来

类型目录由 Xpert 返回，ChatKit 不需要硬编码应用列表。类型使用两个稳定字段共同标识：

```ts
const projectType = {
  applicationKey: '@example/bom-plugin:bom-lifecycle',
  projectTypeKey: 'case',
};
```

这是示例逻辑标识，实际值应取自 SDK 返回的类型目录。应用类型的 `applicationKey` 由规范化插件名和应用名组合为 `<pluginName>:<appName>`；不要自行拼接安装 ID。

| 字段 | 含义 |
| --- | --- |
| `applicationKey` / `projectTypeKey` | 应用和项目类型的稳定标识，不能用显示名称代替 |
| `applicationTitle` / `title` | 应用和类型的显示名称，支持多语言文本 |
| `binding.kind` | `project` 表示平台管理的对话项目；`entity` 表示应用管理的业务实体 |
| `binding.providerKey` | `entity` 类型的业务提供者 |
| `available` | 当前类型是否可用于创建 |
| `defaultProjectType` | 目录返回的 Assistant 默认项目类型，用于初始筛选和创建上下文 |

应用通过插件的 `projectTypes` 声明类型。Assistant 的 `options.workspaceScope.projectType` 可指定默认类型。列表优先采用当前目录中的名称，也能使用项目保存的 `projectTypeSnapshot` 显示历史类型信息。普通通用项目使用 `platform / general`。

## 创建项目与宿主事件

ChatKit 负责选择和发出创建意图，宿主负责创建项目或打开业务创建界面。Web Component 通过以下事件通知宿主，React 绑定对应 `onProjectChange` 和 `onEffect`：

| 事件 | 数据 | 宿主处理 |
| --- | --- | --- |
| `chatkit.project.change` | `{ projectId: string \| null }` | 同步项目上下文或路由；`null` 表示离开项目范围 |
| `chatkit.effect`，`name: 'project.create'` | `{ name, projectType?: { applicationKey, projectTypeKey } }` | 创建平台项目，成功后将新项目设为当前范围 |
| `chatkit.effect`，`name: 'project.create-entry'` | `{ applicationKey, projectTypeKey }` | 解析应用的业务创建入口并导航，不直接创建通用项目 |

对于 `entity` 类型，宿主应通过 `client.projects.typeEntry(projectType, { xpertId })` 解析入口，使用返回的 Assistant 和 View 打开业务创建流程。业务应用再协调业务实体与对话项目；不要用通用项目表单代替应用的必填字段与创建规则。

创建完成后更新宿主配置中的 `api.projectId`，并同步新会话或业务路由。没有实现这些事件的宿主应关闭创建入口。

## 固定项目的 Workbench

项目专属页面可以通过 `api.projectId` 固定当前项目，并使用下面的 composer 配置：

```ts
const composer: ChatKitOptions['composer'] = {
  projects: {
    enabled: true,
    locked: true,
    label: '汽车零部件 BOM Case',
    createEnabled: false,
  },
};
```

设置 `locked: true` 且存在 `api.projectId` 时，ChatKit 展示带锁定图标的项目名称，不打开选择菜单。`label` 只负责展示，不用于授权或解析项目。

## 切换项目与会话

选择另一个项目会进入该项目下的新会话上下文，不会把旧会话移动到另一个项目。输入框保留普通文本草稿，同时清理附件、文件引用和一次性能力 token，避免把旧项目内容带入新项目。

[会话资源选择](./chatkit-agent-plugins)按新的项目范围重新加载、校验。原生 Connector 选择会清空；新会话草稿中的版本化资源选择需要通过新范围校验才能继续使用。切换 Assistant 或已存在的会话时，恢复对应会话的资源，不沿用其他会话的选择。

## SDK 与主题

ChatKit 内部通过 `@xpert-ai/xpert-sdk` 访问 Xpert。宿主需要解析入口时，也应使用同一 SDK：

| SDK 方法 | 用途 |
| --- | --- |
| `client.projects.types({ xpertId })` | 获取类型目录及默认类型 |
| `client.projects.list({ xpertId, applicationKey, projectTypeKey, search, skip, take })` | 搜索、筛选和分页；可使用 `unclassified: true` 查询未分类项目 |
| `client.projects.get(projectId)` | 读取当前项目及其显示名称 |
| `client.projects.typeEntry(projectType, { xpertId, projectId })` | 解析创建或已有项目的业务入口 |

项目、文件和资源选择器共用主题样式：紧凑菜单字号、无边框透明搜索框、主题控制的背景、悬停颜色和圆角。请使用 [主题和自定义](./chatkit-themes) 中的 ChatKit 主题配置，不需要为项目面板单独写一套颜色。

## 验证接入

1. 开启选择器，检查项目搜索、类型分组、最近更新和分页。
2. 选择普通项目，确认宿主收到 `project.change`，发送消息归属正确项目。
3. 分别测试普通项目创建和业务类型创建，确认后者进入应用的业务表单。
4. 在固定项目 Workbench 中检查项目标签与不可切换行为。
5. 切换项目，确认文件引用已清理、插件资源重新校验，旧会话仍可独立恢复。
