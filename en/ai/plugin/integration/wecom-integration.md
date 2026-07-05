---
title: WeCom Integration
sidebar_position: 24
tags:
  - Plugin
  - Trigger
  - WeCom
---

WeCom Integration connects a WeCom bot to Xpert AI. It stores callback or long-connection credentials and provides runtime status and session management. To route messages into a Digital Expert, you must also add and publish [WeCom Trigger](../trigger/wecom-trigger/) in the Digital Expert workflow.

Current `@xpert-ai/plugin-wecom` provides two integration types:

<Tip>
WeCom is a communication plugin and must be installed at the **tenant level**. Tenant-level installation registers the WeCom system integration provider, callback/long-connection entries, and WeCom Trigger. If it is installed only at organization, project, or personal scope, creating integrations and triggers may not find the corresponding capabilities.
</Tip>

| Provider | Display name | Scenario | Key config |
| --- | --- | --- | --- |
| `wecom` | WeCom short connection | Xpert AI API is reachable from WeCom public network | `Token`, `EncodingAESKey` |
| `wecom_long` | WeCom long connection | Recommended mode, no public callback URL required if the server can access WeCom WebSocket | `Bot ID`, `Secret` |

Default recommendation: use **WeCom long connection** (`wecom_long`). Use **WeCom short connection** (`wecom`) only when you already have a stable public callback URL or need to stay compatible with a short-connection deployment. A WeCom bot usually selects only one receiving mode in the WeCom console.

## 1. Short-connection setup

Short connection receives messages through WeCom callbacks. WeCom sends URL verification and message push requests to Xpert AI Callback URL.

### Prepare WeCom configuration

1. Log in to [WeCom Admin Console](https://work.weixin.qq.com/).
2. Open the target app or API-mode bot configuration page.
3. Enable message receiving or API callback.
4. Record or generate:
   - **Token**
   - **EncodingAESKey**
5. Confirm Xpert AI API has a public HTTPS address reachable from WeCom.

### Create short-connection integration in Xpert AI

Go to **Settings -> System Integrations** and create a **WeCom short connection** integration.

| Field | Description |
| --- | --- |
| `Callback Token` | Token configured in WeCom API mode. |
| `EncodingAESKey` | 43-character EncodingAESKey configured in WeCom API mode. |
| `Preferred Language` | Optional, affects error and system prompts. |
| `Request Timeout (ms)` | Optional timeout for outgoing webhook or reply requests. |

After saving or testing, Xpert AI returns a callback URL:

```text
https://<your-api-domain>/api/wecom/webhook/<integrationId>
```

Fill this URL into WeCom and complete URL verification. Short-connection URL verification uses `msg_signature`, `timestamp`, `nonce`, and `echostr` with the integration Token and EncodingAESKey.

### Short-connection route check

To only confirm route reachability, visit:

```text
GET /api/wecom/webhook/<integrationId>
```

Without WeCom verification parameters, this endpoint returns `success`, meaning the Xpert API route and integration ID can be read. Official URL verification still depends on WeCom signature parameters.

## 2. Long-connection setup

Long connection uses WeCom smart bot API mode. Xpert AI connects outbound to WeCom WebSocket, so no public Callback URL is required.

WeCom long-connection endpoint:

```text
wss://openws.work.weixin.qq.com
```

### Prepare a WeCom bot

1. Log in to the WeCom admin console.
2. Go to **Security and Management -> Management Tools -> Smart Bot**.
3. Create a bot in **API mode** and select **Long Connection**.
4. Record:
   - **Bot ID**
   - **Secret**
5. Confirm the Xpert AI server can access `wss://openws.work.weixin.qq.com`.

### Create long-connection integration in Xpert AI

Go to **Settings -> System Integrations** and create a **WeCom long connection** integration.

| Field | Description |
| --- | --- |
| `Bot ID` | Bot ID of the WeCom smart bot API long-connection mode. |
| `Secret` | Long-connection Secret used for `aibot_subscribe`. |
| `WebSocket Origin` | Optional Origin header for the WebSocket handshake, used for network-policy compatibility. |
| `Preferred Language` | Optional, affects error and system prompts. |
| `Request Timeout (ms)` | Optional timeout for waiting for WebSocket command ack. |

After saving a long-connection integration, the plugin tries to synchronize connection state. The long connection keeps running only when the integration is enabled, config is valid, and it is bound to a published WeCom Trigger. When unbound, the system stops the connection and marks it as `xpert_unbound`.

## 3. Bind a Digital Expert

Saving an integration does not make the bot usable by itself. You also need to:

1. Open the target Digital Expert workflow.
2. Add [WeCom Trigger](../trigger/wecom-trigger/).
3. Select the WeCom integration you created.
4. Configure session timeout and message aggregation.
5. Publish the Digital Expert workflow.

One WeCom integration can be bound to only one Digital Expert at a time. If multiple Digital Experts bind the same integration, publish validation reports a conflict.

## 4. Status and session management

The WeCom integration detail page provides extension tabs:

- **Status**: shown for long-connection integrations, including connection mode, status, Bot ID, owner instance, recent connected/disconnected/callback/heartbeat times, recent error, reconnect count, and stop reason.
- **Sessions**: shown for both modes, including conversation type, conversation ID, sender ID, Digital Expert ID, conversation ID, and update time.

The long-connection status page supports refresh, reconnect, and disconnect. The session page supports resetting a session, equivalent to the user sending `/new`.

## 5. Message and reply capabilities

Short-connection mode mainly relies on `response_url` from WeCom callbacks. Long-connection mode mainly relies on `req_id` and WebSocket command replies.

Long-connection mode supports a richer bot experience:

- Send a “thinking” message after receiving a user message.
- Prefer long-connection streaming replies for long answers.
- Update template cards.
- Send welcome cards when users enter direct chat.
- Send reset-session cards when a conversation fails or needs reset.
- Download image callback resources and pass them to the Digital Expert as visible file inputs.

Short connection can still receive and reply to messages, but it does not provide the full streaming experience of long connection.

## FAQ

### WeCom says the integration is not bound to a trigger

The WeCom message has reached Xpert AI, but no `integrationId -> xpertId` binding was found. Confirm:

- The target Digital Expert has added WeCom Trigger.
- The trigger is enabled.
- The selected integration is the one actually used by the current bot.
- The Digital Expert workflow has been published.

### Short-connection URL verification failed

Check:

- `API_BASE_URL` is a public HTTPS address reachable from WeCom.
- The reverse proxy forwards `/api/wecom/webhook/<integrationId>`.
- The WeCom console Token matches the integration `Callback Token`.
- EncodingAESKey is exactly 43 characters and matches.

### Long connection cannot be established

Check:

- WeCom console selects API-mode long connection.
- You did not use short-connection Token/EncodingAESKey by mistake.
- Bot ID and Secret come from the same bot.
- The server can access `wss://openws.work.weixin.qq.com`.
- The integration is bound to a published WeCom Trigger.

### Session context is unexpected

Ask users to send `/new` to start a new session, or reset a session from the integration detail page. If users often send several short messages in a row, increase `summaryWindowSeconds` in WeCom Trigger.
