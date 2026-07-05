---
title: WeCom Trigger
sidebar_position: 23
---

`WeCom Trigger` routes WeCom messages into a Digital Expert workflow, enabling users to send messages in WeCom and have Xpert AI dispatch them to the selected Digital Expert.

The WeCom integration connects Xpert AI to WeCom. The WeCom trigger decides which Digital Expert receives messages from that integration. It supports both short-connection callback mode and long-connection WebSocket mode.

## Applicable scenarios

- Ask a Digital Expert questions in WeCom direct chats or group chats.
- Use a WeCom bot as an internal knowledge assistant, data-analysis assistant, or workflow assistant.
- Bind different Digital Experts to different WeCom bots or callback configurations.
- Aggregate several short messages before sending them to the Digital Expert.
- Keep WeCom conversation context and allow users to start a new session manually.

## Connection modes

WeCom Trigger can bind either type of WeCom integration:

| Integration type | Scenario | Key config | Message entry |
| --- | --- | --- | --- |
| WeCom short connection | Xpert AI API is reachable from the public internet | `Token`, `EncodingAESKey` | WeCom callback `POST /api/wecom/webhook/<integrationId>` |
| WeCom long connection | No public callback URL is available, but the server can access WeCom WebSocket | `Bot ID`, `Secret` | `wss://openws.work.weixin.qq.com` |

Short-connection mode requires configuring the Callback URL in WeCom and completing URL verification. Long-connection mode is initiated by Xpert AI to WeCom WebSocket. It stays running only when the integration is enabled and bound to a published WeCom Trigger.

## Key configuration

Core WeCom Trigger configuration:

- `enabled`: whether the trigger is enabled
- `integrationId`: WeCom integration instance ID, either short connection or long connection
- `sessionTimeoutSeconds`: session timeout, default `3600` seconds
- `summaryWindowSeconds`: message aggregation window, default `0` seconds

Validation before publish checks:

1. Whether a valid WeCom integration is selected.
2. Whether the current integration is already bound to another Digital Expert.
3. When the trigger is enabled, one WeCom integration can only be bound to one Digital Expert at a time.

This binding prevents one WeCom bot from triggering multiple Digital Experts at the same time.

## Setup flow

### 1. Create a WeCom integration

For short-connection mode:

1. Enable message receiving or API callback in the WeCom admin console.
2. Obtain `Token` and `EncodingAESKey`.
3. Create a **WeCom short-connection** integration in Xpert AI.
4. After saving, copy the generated Callback URL:

```text
https://<your-api-domain>/api/wecom/webhook/<integrationId>
```

5. Fill the Callback URL, `Token`, and `EncodingAESKey` back into WeCom and complete URL verification.

For long-connection mode:

1. Create a WeCom smart bot and select API mode with long connection.
2. Obtain `Bot ID` and `Secret`.
3. Create a **WeCom long-connection** integration in Xpert AI.
4. Confirm the server can access `wss://openws.work.weixin.qq.com`.
5. After saving, check connection status and recent errors on the integration detail page.

### 2. Add WeCom Trigger

1. Open the Digital Expert workflow that should receive WeCom messages.
2. Add **WeCom Trigger**.
3. Select the WeCom integration you created.
4. Configure session timeout and message aggregation if needed.
5. Connect the trigger to downstream Agent, tool, or knowledge-base nodes.
6. Publish the Digital Expert workflow.

After publishing, Xpert AI persists the `integrationId -> xpertId` binding. New WeCom messages are routed by this binding.

## Runtime mechanism

1. **Publish phase**
   - Validate that the selected WeCom integration exists.
   - Check whether the same integration is occupied by another Digital Expert.
   - Write or update the WeCom trigger binding.
   - If the integration is long connection, synchronize the long-connection runtime state.
2. **Message arrival phase**
   - Short-connection mode receives and verifies/decrypts WeCom callbacks.
   - Long-connection mode receives WeCom bot events through WebSocket.
   - The plugin parses conversation, sender, message content, and reply context.
3. **Routing phase**
   - Find the published WeCom Trigger binding by `integrationId`.
   - If no binding exists, WeCom receives a message such as “this integration is not bound to a trigger”.
   - If a binding exists, the message is converted into Digital Expert workflow input.
4. **Execution phase**
   - If the runtime callback is available, advance the current workflow directly.
   - If the callback is unavailable, such as after restart, enter the persistent dispatch queue.
   - After execution, reply to the user through the WeCom context.

## Session management

WeCom Trigger builds a conversation key from the WeCom integration, conversation, and sender to continue Digital Expert context.

`sessionTimeoutSeconds` controls how long the session remains active. After the user is idle longer than this value, the next message starts a new session.

Users can also send:

```text
/new
```

This clears the current WeCom-to-Digital-Expert session binding. Users can also include a new question in the same message:

```text
/new analyze this month sales trend
```

In that case, Xpert resets the session first and uses the text after `/new` as the first input of the new session.

## Message aggregation

`summaryWindowSeconds` handles users sending several short messages in a row:

- `0`: each message triggers the Digital Expert immediately.
- Greater than `0`: messages in the same conversation are buffered and merged into one input.

If another message arrives during the aggregation window, the aggregation version is refreshed and only the newest version is dispatched.

## Reply capabilities

WeCom Trigger passes reply context into the Digital Expert execution chain so downstream nodes can reply through WeCom.

Short-connection mode mainly relies on `response_url` from WeCom callbacks. Long-connection mode mainly relies on `req_id` and WebSocket commands and supports richer bot experiences:

- Send a “thinking” message after receiving a user message.
- Prefer long-connection streaming replies for long answers.
- Update template cards.
- Send reset-session cards when a conversation fails or needs reset.
- Convert Markdown into a format better suited for WeCom.

## Startup recovery strategy

WeCom Trigger uses `bootstrap.mode = skip`:

- It does not replay `publish` at startup.
- It relies on database trigger bindings to recover routing.
- When external WeCom messages arrive again, they continue to be dispatched by persistent bindings.
- Long-connection integrations synchronize connection state by binding status and do not keep running when unbound.

## FAQ

### No response after sending a message

Check:

- The Digital Expert workflow has added and published WeCom Trigger.
- WeCom Trigger is enabled and selects the correct WeCom integration.
- No other Digital Expert occupies the same WeCom integration.
- For short connection, the Callback URL is public and URL verification has succeeded.
- For long connection, the integration is connected and `Bot ID`/`Secret` are correct.

### WeCom says the integration is not bound to a trigger

The WeCom message has reached Xpert AI, but no available `integrationId -> xpertId` binding was found.

Confirm that the trigger has been published, is enabled, and selects the integration actually used by the current WeCom bot.

### Session context is unexpected

Ask users to send `/new` to start a new session. Administrators can also reset a session from the integration detail page.

If users often send multiple short messages that are processed separately, increase `summaryWindowSeconds`. If every message should respond immediately, keep the default `0`.

## Related features

- Trigger node overview: [Workflow Trigger](../../workflow/trigger/)
- Multi-channel access for Digital Expert: [Digital Expert](../../agent/agent/)
- WeCom integration configuration: [WeCom Integration](../integration/wecom-integration/)
- Trigger plugin overview: [Trigger Plugins](./)
- Source code: [xpert-plugins / wecom integration](https://github.com/xpert-ai/xpert-plugins/tree/main/xpertai/integrations/wecom)
