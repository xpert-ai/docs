---
title: Agent Tool (Deprecated)
sidebar_position: 33
sidebar_hidden: true
---

:::warning Deprecated
Agent Tool has been renamed to **Agent Workflow**. Use [Agent Workflow](./agent-workflow) for new workflow nodes.
:::

The legacy `WorkflowNodeTypeEnum.AGENT_TOOL` value, `agent-tool`, is retained so existing workflows and imports continue to work. New workflow DSL and new nodes should use `WorkflowNodeTypeEnum.AGENT_WORKFLOW` with the value `agent-workflow`.

For current configuration, return-content behavior, validation rules, and best practices, see [Agent Workflow](./agent-workflow).
