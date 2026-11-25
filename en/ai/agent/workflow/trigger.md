---
title: Trigger
sidebar_position: 11
---

Trigger nodes are special nodes responsible for executing workflows in response to specific conditions.

**Trigger nodes** are activated when the current workflow is updated or activated, or when a digital expert instance is started or restarted. You can use trigger nodes to notify when these events occur.

## The role of triggers in workflows

Triggers determine "who" sends input into the Digital Expert workflow and "when" it happens. A single Digital Expert can bind different types of triggers to cover different business entry points.

Typical entry points include:

- **Chat Trigger**: User input from the in-platform chat interface.
- **[Lark Trigger](../../plugin/trigger/lark-trigger/)**: Input from Lark message events.
- **[Schedule Trigger](../../plugin/trigger/schedule-trigger/)**: System input from Cron-based scheduled tasks.

After receiving input, triggers inject data into workflow state, and then downstream nodes (Agent, tool invocation, knowledge retrieval, etc.) continue processing.

## Trigger lifecycle

Triggers typically include three phases:

1. **validate**: Check whether trigger configuration is complete and valid.
2. **publish**: Register trigger capabilities when publishing or activating a workflow (such as registering callbacks or creating scheduled jobs).
3. **stop**: Release resources when disabling a workflow (such as deleting scheduled jobs or unbinding external integrations).

Recovery strategy after system restart may vary by trigger type:

- **replay_publish**: Replay publish logic to restore trigger capability automatically.
- **skip**: Skip auto-recovery and continue through runtime events or external systems.

## Chat Trigger Node

When building AI workflows for chatbots and other chat interfaces, use the chat trigger node.

### Node Parameters

A list of parameters for defining a pre-input form for the digital expert conversation interface, allowing users to enter necessary information before starting the conversation.

## Related docs

- How a Digital Expert connects to different conversation channels via triggers: [Chat Channels](../chat-channels/)
- Trigger plugin implementation details (including Lark and Schedule): [Plugin Trigger](../../plugin/trigger/)
