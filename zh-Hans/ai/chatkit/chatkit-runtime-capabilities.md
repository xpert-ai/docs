---
title: 技能与图内能力
sidebar_position: 9
---

<Info>
控制 Assistant 已配置的技能、中间件节点和子智能体。
</Info>

ChatKit 可以把 Xpert 的可选运行时能力展示在 composer 中，让用户决定什么时候加载某个技能、插件中间件或子智能体，而不是每一次请求都默认启用全部能力。

这样可以减少默认上下文、表达更明确的用户意图，也能更好地控制成本较高或影响较大的能力。

<Note>
本页描述 `runtimeCapabilities`：选择 Assistant 图内已有的能力。新增的 Agent Plugins、图外中间件和已发布专家使用独立的 `runtimeResources`，入口位于输入框下方。请参见 [插件、中间件与数字专家](./chatkit-agent-plugins)。两种机制不能混用绑定 ID 和节点 key。
</Note>

## 核心概念

### 技能

技能是通过 Xpert Skills Middleware 暴露出来的可复用能力包。一个技能可以提供领域指令、prompt workflow、工具或任务专用行为。

技能可以分为：

- 默认技能：assistant 加载后默认勾选
- 可选技能：用户选择后才会加载

当 ChatKit 发送明确的运行时 allow-list 时，本次请求会以用户选中的 skill IDs 为准，而不是继续使用 middleware 的默认技能集合。

### 图内中间件

`runtimeCapabilities.plugins` 是保留的协议字段，表示可选的工作流 middleware 节点，不是标准 Agent Plugin 包。ChatKit 使用 `nodeKeys` 标识这些节点，因此即使多个节点来自同一个 provider，也可以分别控制。`subAgents.nodeKeys` 同样指向图内已配置的专家连接。

必须执行的能力应该配置为 required 或 system middleware，并对终端用户隐藏。它会始终跟随后端工作流执行，不出现在 ChatKit 选择器中。

## Composer 体验

当 Assistant 暴露运行时能力后，ChatKit 在 composer 的能力菜单和 slash palette 中提供相应的技能、中间件节点及图内专家。实际可见项取决于 Assistant 配置；它们与输入框下方统一资源入口的目录不同。

用户可以在这些面板中启用或关闭能力。当前会话的选择会在用户回到 thread 时恢复。

用户也可以输入 `/` 打开 slash palette 并直接搜索能力。选择技能、插件或子智能体后，composer 中会插入一个不可拆分的 token。这个 token 只影响下一次发送，请求发出后会自动清除。

## 请求行为

ChatKit 会把用户选择的能力作为运行时 allow-list 发送：

```ts
await chatkit.sendUserMessage({
  text: '审查 build pipeline，并检查部署风险。',
  runtimeCapabilities: {
    mode: 'allowlist',
    skills: {
      workspaceId: 'workspace_123',
      ids: ['skill_code_review'],
    },
    plugins: {
      nodeKeys: ['Middleware_sandbox'],
    },
  },
});
```

这个 allow-list 会同时写入提交的 input 和 `state.human`，后端工作流可以从任意位置读取同一份选择。

空 allow-list 也是有意义的：它表示本次请求不加载任何用户可选技能和插件，但仍然保留 required/system middleware。

## 产品建议

当某项能力需要用户有意识地选择时，适合把它暴露为运行时能力。常见例子包括：

- 代码审查或仓库分析技能
- 文档搜索和检索插件
- 浏览器、沙箱或文件系统 middleware
- 工单、CRM 或工作流集成
- 用于 review、research、planning 或 QA 的专用子智能体

建议使用简短名称、清晰描述，并尽量提供图标。始终必须执行的能力应放入 system middleware，而不是让用户手动选择。

如果运行时能力接口不可用，ChatKit 会隐藏选择器，并继续使用兼容的 assistant 默认行为。
