---
title: DingTalk Trigger
sidebar_position: 25
---

`DingTalk Trigger` routes DingTalk messages into a Digital Expert workflow, enabling users to send messages in DingTalk direct chats or groups and have Xpert AI dispatch them to the selected Digital Expert.

The DingTalk integration stores AppKey, AppSecret, HTTP callback settings, or Stream mode settings. The DingTalk trigger binds one DingTalk integration to the current Digital Expert.

## Applicable scenarios

- Ask a Digital Expert questions in DingTalk direct chats.
- Trigger a Digital Expert by mentioning the bot in DingTalk groups.
- Use a DingTalk bot as an internal Q&A, approval assistant, data-analysis assistant, or operations assistant.
- Aggregate several short messages before sending them to the Digital Expert.
- Use DingTalk card actions to continue a conversation, such as confirm, reject, or end session.

## Key configuration

Current DingTalk Trigger configuration:

- `enabled`: whether the trigger is enabled
- `integrationId`: DingTalk integration instance ID, either HTTP mode or Stream mode
- `sessionTimeoutSeconds`: session timeout, default `3600` seconds
- `summaryWindowSeconds`: message aggregation window, default `0` seconds

Validation before publish checks:

1. Whether a valid DingTalk integration is selected.
2. Whether the current integration is already bound to another Digital Expert.
3. When the trigger is enabled, one DingTalk integration can only be bound to one Digital Expert at a time.

## Setup flow

1. Create and test a [DingTalk integration](../integration/dingtalk-integration/).
2. Open the target Digital Expert workflow.
3. Add **DingTalk Trigger**.
4. Select the DingTalk integration you created.
5. Configure session timeout and message aggregation if needed.
6. Connect the trigger to downstream Agent, toolset, or knowledge-base nodes.
7. Publish the Digital Expert workflow.

After publishing, Xpert AI writes the `integrationId -> xpertId` binding. Future DingTalk messages received by this integration route to the current Digital Expert.

## Runtime mechanism

1. **Publish phase**
   - Validate that the selected DingTalk integration exists.
   - Check whether the same integration is occupied by another Digital Expert.
   - Write or update the DingTalk trigger binding.
   - Register the current runtime callback.
2. **Message arrival phase**
   - HTTP mode receives encrypted callbacks from `POST /api/dingtalk/webhook/<integrationId>`.
   - Stream mode receives bot messages and card callbacks from the DingTalk Stream long connection.
   - The plugin parses conversation ID, sender ID, message content, card action, and `sessionWebhook`.
3. **Routing phase**
   - Find the trigger binding by `integrationId`.
   - In group chats, only messages that mention the bot enter processing.
   - If a binding is found, convert the message into Digital Expert input.
4. **Execution phase**
   - If the runtime callback exists, advance the current workflow directly.
   - If the callback is missing, enter the persistent handoff queue.
   - After execution, reply through the DingTalk context.

## Session management

The DingTalk plugin builds a session key from the integration, DingTalk conversation, and sender to continue Digital Expert context.

Routing priority:

1. Existing conversation binding.
2. DingTalk trigger binding.

If neither exists, the message cannot find a processing target.

`sessionTimeoutSeconds` controls how long the session remains active. After the user is idle longer than this value, the next message starts a new session.

DingTalk cards can also expose an end-session action to clear current conversation state. The platform provides action endpoints such as `GET /api/dingtalk/action?action=dingtalk:end` for card-button callbacks.

## Message aggregation

`summaryWindowSeconds` handles users sending several short messages in a row:

- `0`: each message triggers the Digital Expert immediately.
- Greater than `0`: messages in the same conversation are buffered and merged into one input.

If another message arrives during the aggregation window, the aggregation version is refreshed and only the newest version is dispatched.

## FAQ

### Trigger configured but not effective

Check:

- The Digital Expert has been published again.
- The trigger is enabled.
- The selected integration is the one actually used by the DingTalk bot.
- No other Digital Expert occupies the same integration.
- In HTTP mode, the callback URL has passed verification.
- In Stream mode, the status page shows connected.

### Direct chat works but group chat does not

DingTalk group chats only process messages that mention the bot. Confirm the bot is in the group and the message really mentions it.

### Existing conversation did not switch to a new expert

Existing conversation binding has higher priority than trigger binding. End the current session before testing new routing.

### Short messages are processed too early

Increase `summaryWindowSeconds`. If every message should respond immediately, keep the default `0`.

## Startup recovery strategy

DingTalk Trigger uses `bootstrap.mode = skip`:

- It does not replay `publish` at startup.
- It relies on database trigger bindings to recover routing.
- When external DingTalk messages arrive again, they continue to be dispatched by persistent bindings.

## Related features

- DingTalk integration configuration: [DingTalk Integration](../integration/dingtalk-integration/)
- Trigger node overview: [Workflow Trigger](../../workflow/trigger/)
- Trigger plugin overview: [Trigger Plugins](./)
- Source code: [xpert-plugins / dingtalk integration](https://github.com/xpert-ai/xpert-plugins/tree/main/xpertai/integrations/dingtalk)
