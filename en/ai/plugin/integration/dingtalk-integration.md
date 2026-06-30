---
title: DingTalk Integration
sidebar_position: 26
---

DingTalk Integration stores DingTalk internal-app credentials, bot configuration, HTTP callback settings, or Stream long-connection status. It only connects DingTalk to Xpert AI. To route messages into a Digital Expert, you must also add and publish [DingTalk Trigger](../trigger/dingtalk-trigger/) in the target Digital Expert workflow.

Current `@xpert-ai/plugin-dingtalk` provides two integration types:

<Tip>
DingTalk is a communication plugin and must be installed at the **tenant level**. Tenant-level installation registers the DingTalk system integration provider, HTTP/Stream message entries, and DingTalk Trigger. If it is installed only at organization, project, or personal scope, creating integrations and triggers may not find the corresponding capabilities.
</Tip>

| Provider | Display name | Scenario | Key config |
| --- | --- | --- | --- |
| `dingtalk_long` | DingTalk Stream mode | Recommended mode, no public HTTP callback URL required | `Client ID (AppKey)`, `Client Secret`, `Robot Code` |
| `dingtalk` | DingTalk HTTP mode | Use only when Stream mode cannot be used | `Client ID (AppKey)`, `Client Secret`, `Callback Token`, `Callback AES Key` |

Default recommendation: use **DingTalk Stream mode** (`dingtalk_long`). It connects outbound from Xpert AI to DingTalk Stream service and does not require external networks to access Xpert AI directly. Use **DingTalk HTTP mode** (`dingtalk`) only when Stream mode cannot be used. HTTP mode requires a public callback URL and matching callback Token/AES Key in DingTalk console.

## Prepare the DingTalk app

1. Log in to [DingTalk Open Platform](https://open.dingtalk.com/).
2. Create an internal enterprise app.
3. Enable bot capability.
4. Copy app credentials:
   - **AppKey**, filled as `Client ID (AppKey)` in Xpert AI.
   - **AppSecret**, filled as `Client Secret` in Xpert AI.
5. Copy **Robot Code** from app bot settings.
6. If you need user selectors or the `dingtalk_list_users` tool, grant department member read permission.

<Tip>
`Client ID` and DingTalk console `AppKey` are the same value.
</Tip>

## 1. Stream mode setup

Stream mode uses a DingTalk long connection to receive bot messages and card callbacks. It does not require a public HTTP callback URL.

### Create Stream integration in Xpert AI

Go to **Settings -> System Integrations** and create a **DingTalk Stream mode** integration.

| Field | Description |
| --- | --- |
| `Client ID (AppKey)` | DingTalk app AppKey. |
| `Client Secret` | DingTalk app secret. |
| `Robot Code` | Bot unique identifier, used for proactive group/direct messages. |
| `Preferred Language` | Optional, affects error and system prompts. |

Integration testing probes the DingTalk Stream connection and returns:

- `mode=long_connection`
- subscribed topic `/v1.0/im/bot/messages/get`
- subscribed topic `/v1.0/card/instances/callback`
- `probe.connected`
- `probe.lastError`

### Status page

The DingTalk integration detail page provides a **Status** tab with:

- connection mode
- status
- bot / integration name
- Stream subscriptions
- last connected time
- last disconnected time
- last callback time
- recent error
- reconnect count

Stream mode supports refresh, reconnect, and disconnect. HTTP mode only shows callback configuration and reachability status and does not support Stream reconnect/disconnect.

## 2. HTTP mode setup

HTTP mode receives bot messages and card callbacks through DingTalk callback URL. It is suitable only when Stream mode cannot be enabled but you already have a public API address.

### Create HTTP integration in Xpert AI

Go to **Settings -> System Integrations** and create a **DingTalk HTTP mode** integration.

| Field | Description |
| --- | --- |
| `Client ID (AppKey)` | DingTalk app AppKey. |
| `Client Secret` | DingTalk app secret. |
| `Robot Code` | Optional but recommended, used for proactive group/direct messages. Do not fill the callback value `robotCode=normal`. |
| `Callback Token` | Token for DingTalk HTTP callback signature verification. |
| `Callback AES Key` | AES Key for decrypting DingTalk HTTP callback payload. |
| `Preferred Language` | Optional, affects error and system prompts. |

After a successful test, Xpert AI returns the callback URL:

```text
https://<your-api-domain>/api/dingtalk/webhook/<integrationId>
```

You can also inspect callback config:

```text
GET /api/dingtalk/callback-config?integration=<integrationId>
```

The response includes callback URL, signature algorithm, whether Callback Token/AES Key are configured, and recommended events.

### Configure DingTalk console

1. In DingTalk Open Platform, open app event/callback or bot message push settings.
2. Select HTTP push as the receiving mode.
3. Fill in the callback URL returned by Xpert AI.
4. Keep DingTalk Token/AES Key consistent with Xpert AI integration config.
5. Subscribe to bot message events and card callback events.

HTTP mode supports `GET /api/dingtalk/webhook/<integrationId>` reachability checks. If the integration exists and HTTP callback is enabled, it returns plain text `success`.

## 3. Bind a Digital Expert

After creating the integration:

1. Open the target Digital Expert workflow.
2. Add [DingTalk Trigger](../trigger/dingtalk-trigger/).
3. Select the DingTalk integration you created.
4. Configure session timeout and message aggregation.
5. Publish the Digital Expert.

If the trigger is not published, DingTalk events may reach Xpert AI but will not route to the target Digital Expert.

## 4. Message and reply capabilities

DingTalk integration and trigger support:

- receiving direct chat and group messages
- processing group messages that mention the bot
- sending text, Markdown, and card replies through DingTalk context
- handling card callbacks, such as ending a session
- proactive notification tools such as `dingtalk_send_text_notification`, `dingtalk_send_rich_notification`, `dingtalk_update_message`, and `dingtalk_recall_message`
- `dingtalk_list_users` when the app has department member read permission

## FAQ

### Stream mode cannot connect

Check:

- Client ID/AppKey and Client Secret are correct.
- Robot Code comes from the same app.
- The server can access DingTalk Stream service.
- The app has bot capability enabled and has been published if required.
- The integration is bound to a published DingTalk Trigger.

### HTTP callback verification failed

Check:

- `API_BASE_URL` is a public HTTPS address reachable from DingTalk.
- The reverse proxy forwards `/api/dingtalk/webhook/<integrationId>`.
- DingTalk console Token/AES Key match integration `Callback Token` and `Callback AES Key`.
- The integration is DingTalk HTTP mode, not Stream mode.

### User selector is empty or `dingtalk_list_users` fails

Confirm the DingTalk app has department member read permission and the current integration AppKey/AppSecret can call contact APIs.
