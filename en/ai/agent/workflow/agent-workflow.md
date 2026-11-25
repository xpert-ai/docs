---
title: Agent Workflow
sidebar_position: 32
---

The **Agent Workflow** node exposes a downstream workflow as a callable tool for an upstream Agent. When the Agent decides to call it, the node runs its connected workflow nodes and sends a `ToolMessage` result back to the calling Agent.

Use Agent Workflow when a tool result needs multi-step orchestration, such as retrieving data, running logic branches, iterating over records, calling other tools, and formatting a final result.

:::note
Agent Workflow replaces the legacy **Agent Tool** workflow node. Existing `agent-tool` nodes continue to run for compatibility, but new workflows should use `agent-workflow`.
:::

## How It Works

1. **Tool registration**
   - The node is registered as a tool that an upstream Agent can call.
   - `Tool Name`, `Tool Description`, and `Tool Parameters` become the tool name, description, and schema seen by the Agent model.

2. **Argument passing**
   - When the Agent calls the tool, the call arguments are stored in the Agent Workflow node state.
   - Each configured input parameter is exposed to downstream workflow nodes as `args.<parameterName>`.

3. **Sub-workflow execution**
   - Connected workflow nodes run as the implementation of the tool.
   - The sub-workflow can include branches, iteration, tool invocation, HTTP requests, code, templates, knowledge retrieval, and Agent nodes.

4. **Return to the caller Agent**
   - After the sub-workflow completes, Agent Workflow creates a `ToolMessage` and writes it back to the calling Agent.
   - The caller Agent then continues reasoning with that tool result.

## Configuration

| Configuration | Description |
| --- | --- |
| **Node Name** | Display name in the workflow canvas. |
| **Tool Name** | Tool identifier exposed to the Agent model. If empty, the node key is used and validation returns a warning. |
| **Tool Description** | Description used by the Agent model to decide when to call the tool. |
| **Tool Parameters** | Input schema for the tool call. Parameters are available downstream as `args.<name>`. |
| **Return Content** | Selects the value returned to the caller Agent. |
| **End** | Marks this node as an Agent endpoint when used in Agent handoff flows. |
| **Downstream Workflow** | Nodes connected after Agent Workflow implement the tool logic. |

## Return Content

Agent Workflow supports three return modes:

| Mode | Behavior | Recommended Use |
| --- | --- | --- |
| **Last message** | Returns the latest message in workflow state. This preserves legacy Agent Tool behavior. | Simple flows that end with an Answer or Agent node. |
| **Variable** | Returns a selected downstream variable, such as an iterator `output_str` value or a template result. | Flows that need deterministic return data. |
| **Template** | Renders a Mustache template with workflow variables and returns the rendered text. | Flows that need a structured or narrated result assembled from several variables. |

When the downstream path ends with an **Iteration** node, do not rely on **Last message**. Select the iteration output variable, usually `output_str`, or add an **Answer** node after the iteration and return that result. Validation reports an error when an Agent Workflow ends on an iterator path while still using the legacy last-message return mode.

## Compatibility

- New nodes use `WorkflowNodeTypeEnum.AGENT_WORKFLOW` with the value `agent-workflow`.
- Legacy nodes with `WorkflowNodeTypeEnum.AGENT_TOOL` and the value `agent-tool` are still loaded and executed for existing workflows.
- The old Agent Tool documentation page is kept only as a deprecated compatibility entry.

## Best Practices

1. Give the tool a clear name and description so the Agent model can choose it reliably.
2. Define explicit input parameters instead of expecting the downstream workflow to infer context.
3. Prefer **Variable** or **Template** return content for production workflows.
4. Use **Last message** only for simple legacy-style flows that end with an Answer or Agent response.
5. For branches, make sure the selected return variable is produced on every possible path, or use a template or Answer node on each branch.
