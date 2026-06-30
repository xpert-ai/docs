---
title: Lark Integration
sidebar_position: 22
---

Lark Integration stores credentials, event receiving mode, and runtime status for a Lark or Feishu internal app. It only connects Lark to Xpert AI. To route messages into a Digital Expert, you must also add and publish [Lark Trigger](../trigger/lark-trigger/) in the target Digital Expert workflow.

Current `@xpert-ai/plugin-lark` uses one integration provider, `lark`, and distinguishes Webhook and long connection through the **Connection Mode** field.

<Tip>
Lark is a communication plugin and must be installed at the **tenant level**. Tenant-level installation registers the Lark system integration provider, Webhook/long-connection entries, and Lark Trigger. If it is installed only at organization, project, or personal scope, creating integrations and triggers may not find the corresponding capabilities.
</Tip>

## Connection modes

| Mode | Scenario | Public callback required | Key config |
| --- | --- | --- | --- |
| Webhook | You already have a stable public API address and want to receive Lark event callbacks | Yes | `App ID`, `App Secret`, `Verification Token`, `Encrypt Key` |
| Long connection | Recommended mode, suitable for local debugging or environments without a public callback URL | No | `App ID`, `App Secret`, `connectionMode=long_connection` |

Default recommendation: use **long connection** (`connectionMode=long_connection`). Use Webhook only when you already have a stable public HTTPS callback URL or need to stay compatible with a Webhook deployment.

Webhook mode generates this callback URL after saving:

```text
https://<your-api-domain>/api/lark/webhook/<integrationId>
```

Long-connection mode does not use this callback URL. Instead, the Xpert AI server connects outbound to the Lark Open Platform event channel.

## Prepare the Lark app

1. Log in to the [Lark Developer Console](https://open.feishu.cn/app).
2. Create an internal enterprise app and enable the **Bot** capability.
3. Copy credentials:
   - **App ID**
   - **App Secret**
4. Choose event receiving mode:
   - Webhook mode: configure request URL and event subscriptions.
   - Long-connection mode: choose long connection for receiving events.
5. Subscribe to bot message events:
   - `im.message.receive_v1`
   - `card.action.trigger` if you need card-button callbacks.
6. Grant permissions for sending messages, reading groups, reading contacts, and reading message resources. Otherwise the bot may receive messages but fail to reply, list users/groups, or read images.
7. Publish the app version and set app availability for the required users or departments.

## Create the integration in Xpert AI

Go to **Settings -> System Integrations** and create a **Lark** integration.

### Required fields

| Field | Description |
| --- | --- |
| `App ID` | App ID of the Lark or Feishu internal app. |
| `App Secret` | App Secret of the Lark or Feishu internal app. Integration testing uses it to obtain `tenant_access_token` and read bot info. |

### Webhook fields

| Field | Description |
| --- | --- |
| `Verification Token` | Token configured in Lark event subscriptions. The Webhook verifies it during `url_verification`. |
| `Encrypt Key` | Encryption key from Lark event subscriptions. Required when encrypted events are enabled. |
| `Connection Mode` | Select `Webhook`. If the page defaults to Webhook but you plan to use the recommended long connection, switch to long connection manually. |

After saving or testing the integration, copy the Webhook URL from the test result and paste it into the Lark event subscription request URL. Webhook mode rejects callback requests for long-connection integrations, so update the Lark console when switching connection mode.

### Long-connection fields

| Field | Description |
| --- | --- |
| `Connection Mode` | Select `Long connection`. |
| `International` | Enable this for international Lark; keep it disabled for China Feishu Open Platform. |
| `Preferred Language` | Optional, affects error and system prompts. |
| `Auto-provision Users` | Optional, allows Lark users to be mapped or created as platform users automatically. |

The long-connection test validates app credentials and bot info, then probes the Lark long-connection endpoint. If a newly saved long-connection integration does not connect immediately, wait for the plugin runtime to refresh or restart the plugin service.

## Test result

After a successful test:

- Webhook mode returns `webhookUrl`, which should be filled into the Lark console.
- Long-connection mode returns probe fields such as `probe.connected`, `probe.state`, and `probe.lastError`.

If the test fails, check App ID, App Secret, whether the app version is published, whether bot capability is enabled, and whether the app is available to the current test user.

## Status and session tabs

The Lark integration detail page provides extension tabs:

- **Status**: connection mode, status, bot user, owner instance, last connected time, and recent errors.
- **Users**: Lark users recorded or read by the plugin, used by trigger user selectors.
- **Sessions**: Lark conversation bindings under this integration, including chat type, chat ID, sender Open ID, Digital Expert ID, conversation ID, and update time.

Long-connection mode supports refresh, reconnect, and disconnect on the status page. Webhook mode mainly depends on callback reachability and event subscription configuration.

## Pair with Lark Trigger

After creating the integration:

1. Open the target Digital Expert workflow.
2. Add [Lark Trigger](../trigger/lark-trigger/).
3. Select this Lark integration.
4. Configure direct-chat scope, group-chat scope, group reply strategy, session timeout, and message aggregation window.
5. Publish the Digital Expert.

If the trigger is not published, Lark events may reach Xpert AI but will not route to the target Digital Expert.

## FAQ

### Webhook URL verification failed

Check:

- `API_BASE_URL` is a public HTTPS address.
- The reverse proxy forwards `/api/lark/webhook/<integrationId>` to the Xpert API service.
- The Lark console Verification Token matches the integration `Verification Token`.
- `Encrypt Key` matches when encrypted events are enabled.

### Long connection is not connected

Check:

- The Lark console uses long connection for event receiving.
- The server can access the Lark Open Platform long-connection endpoint.
- App ID and App Secret belong to the same app.
- The app version has been published and bot capability is enabled.

### Selectors cannot list groups or users

Group selectors call the Lark group list API, and user selectors call the department user list API. Grant the required app permissions and publish the app again.
