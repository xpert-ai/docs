---
title: Lark Trigger
sidebar_position: 21
---

`Lark Trigger` binds a Lark integration to a Digital Expert workflow, enabling the flow of “send a message in Lark, route it to the selected Digital Expert in Xpert AI”.

The Lark integration stores App ID, App Secret, Webhook, or long-connection settings. The Lark trigger decides which Digital Expert should process incoming messages.

## Applicable scenarios

- Trigger a Digital Expert from Lark direct chats or group chats.
- Use enterprise IM as a unified Digital Expert entry point.
- Restrict which users or groups can trigger the Digital Expert.
- Aggregate several short messages before sending them to the Digital Expert.
- Read Lark message context or image resources during a conversation.

## Key configuration

Core Lark Trigger configuration:

- `enabled`: whether the trigger is enabled
- `integrationId`: Lark integration instance ID (required)
- `sessionTimeoutSeconds`: session timeout, default `3600` seconds
- `summaryWindowSeconds`: message aggregation window, default `0` seconds
- `singleChatScope`: direct-chat scope, `all_users` or `selected_users`
- `singleChatUserOpenIds`: allowed user Open IDs when direct-chat scope is selected users
- `allowedGroupScope`: group-chat scope, `all_chats` or `selected_chats`
- `allowedGroupChatIds`: allowed group chat IDs when group scope is selected chats
- `groupReplyStrategy`: group reply strategy, `mention_only` or `all_messages`

Validation before publish checks:

1. Whether a valid Lark integration is selected.
2. Whether the current integration is already bound to another Digital Expert (to avoid conflicts).
3. When the trigger is enabled, one Lark integration can only be bound to one Digital Expert at a time.

## Setup flow

1. Create and test a [Lark integration](../integration/lark-integration/).
2. Open the target Digital Expert workflow.
3. Add **Lark Trigger**.
4. Select the Lark integration you created.
5. Configure direct-chat scope, group-chat scope, group reply strategy, session timeout, and message aggregation window.
6. Connect the trigger to downstream Agent, toolset, or knowledge-base nodes.
7. Publish the Digital Expert workflow.

After publishing, Xpert AI persists the `integrationId -> xpertId` binding. When a Lark message arrives, the platform first finds the target Digital Expert by this binding, then enters workflow execution.

## Runtime mechanism

1. **Publish phase**
   - Validate that the selected Lark integration exists.
   - Check whether the same integration is already occupied by another Digital Expert.
   - Write or update the Lark trigger binding.
   - Register the current runtime callback.
2. **Message arrival phase**
   - Webhook mode receives Lark events from `POST /api/lark/webhook/<integrationId>`.
   - Long-connection mode receives `im.message.receive_v1` and `card.action.trigger` events from the Lark long-connection service.
   - The plugin parses chat ID, sender Open ID, message content, and image/file resources.
3. **Routing phase**
   - Find the trigger binding by `integrationId`.
   - Apply direct-chat scope, group-chat scope, and group reply strategy.
   - If the message is not allowed, it will not enter the Digital Expert.
4. **Execution phase**
   - If the runtime callback is available, advance the current workflow directly.
   - If the callback is unavailable, such as after restart, enter the persistent handoff queue.
   - After the Digital Expert finishes, reply through the Lark context.

## Session and message aggregation

`sessionTimeoutSeconds` controls how long the Lark conversation continues the same Digital Expert session. If the user is idle longer than this value, the next message starts a new Digital Expert session.

`summaryWindowSeconds` merges several short messages:

- `0`: every message triggers the Digital Expert immediately.
- Greater than `0`: messages in the same conversation are buffered during this window and merged into one input.

If another message arrives during the aggregation window, the aggregation version is refreshed and only the newest version is dispatched, avoiding duplicate processing from old windows.

## Group chat trigger strategy

Lark groups default to `mention_only`, meaning only messages that mention the bot trigger processing. `all_messages` sends all group messages through trigger filtering and is only suitable for dedicated bot groups.

If only some groups should trigger the Digital Expert, set `allowedGroupScope` to `selected_chats` and choose the allowed groups in `allowedGroupChatIds`.

## FAQ

### The bot does not reply after saving the Lark integration

Check:

- The target Digital Expert has added and published Lark Trigger.
- The trigger is enabled and selects the Lark integration used by the current bot.
- In group chats, the message mentions the bot, or `groupReplyStrategy` is set to `all_messages`.
- The Lark app subscribes to `im.message.receive_v1`.
- In Webhook mode, the callback URL is publicly reachable.
- In long-connection mode, the status page shows connected.

### User or group selectors are empty

Selectors depend on the Lark integration to read contacts and group chats. Check whether the Lark app has contact/group read permissions and whether the app version has been published again.

### Image messages do not reach the model

Lark images are read through message resources and converted into files visible to the Digital Expert. Make sure the app has message-resource read permission and the target model supports vision input.

## Startup recovery strategy

Lark Trigger uses `bootstrap.mode = skip`:

- It does not replay `publish` at startup.
- It relies on persistent bindings and external message events to resume processing.

This approach is suitable for triggers continuously driven by external events and avoids duplicate registration.

## Related features

- Trigger node overview: [Workflow Trigger](../../workflow/trigger/)
- Multi-channel access for Digital Expert: [Digital Expert](../../agent/agent/)
- Lark integration configuration: [Lark Integration](../integration/lark-integration/)
- Source code: [xpert-plugins / lark integration](https://github.com/xpert-ai/xpert-plugins/tree/main/xpertai/integrations/lark)
