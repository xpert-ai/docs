---
title: Integration Overview
sidebar_position: 20
---

Integrations store external-system credentials, connection modes, callback URLs, long-connection status, and runtime extension tabs. An integration only connects Xpert AI to the external platform; to route external messages into a Digital Expert, you must also add the corresponding trigger to the target Digital Expert workflow and publish it.

## Integration vs Trigger

External IM access is usually split into two objects:

- **Integration**: stores platform credentials, callback URLs, long-connection settings, and runtime status. It connects Xpert AI to the external platform.
- **Trigger**: lives in a Digital Expert workflow. It binds one integration to the current Digital Expert and controls session timeout, message aggregation, and routing.

Creating a Lark, WeCom, or DingTalk bot is therefore not finished after saving the integration. You must also add the corresponding trigger to the target Digital Expert workflow and publish it.

## Tenant-level installation requirement

<Tip>
Communication plugins such as Lark, WeCom, and DingTalk must be installed at the **tenant level**. These plugins register system integration providers, Webhook or long-connection entries, trigger strategies, and message-dispatch capabilities. If they are installed only at the organization, project, or personal scope, the system integration and trigger selectors may not find the provider, and external messages may not route reliably to Digital Experts.
</Tip>

## Recommended connection modes

| Platform | Plugin | Recommended mode | Fallback mode |
| --- | --- | --- | --- |
| Lark | `@xpert-ai/plugin-lark` | **Lark long connection** (`connectionMode=long_connection`) | Webhook, only when a stable public HTTPS callback URL is available |
| WeCom | `@xpert-ai/plugin-wecom` | **WeCom long connection** (`wecom_long`) | WeCom short connection (`wecom`), only when a stable public callback URL is available |
| DingTalk | `@xpert-ai/plugin-dingtalk` | **DingTalk Stream mode** (`dingtalk_long`) | DingTalk HTTP mode (`dingtalk`), only when Stream mode cannot be used |

## General setup flow

1. Install the communication plugin at the tenant level.
2. Create an enterprise app or bot in the external platform and grant required capabilities such as bot, message receiving, contact read, group read, or message-resource read permissions.
3. In Xpert AI, switch to the target organization first, then go to **Settings -> System Integrations** and create the corresponding integration. System integrations are created at organization scope, and triggers can only select integrations that exist in the current organization.
4. Prefer long connection or Stream mode. If you use Webhook, HTTP, or short-connection mode, make sure `API_BASE_URL` is a public HTTPS address reachable from the external platform.
5. Save and test the integration. Confirm credentials, connection status, and callback URLs.
6. Open the target Digital Expert workflow, add the corresponding trigger, and select the integration you created.
7. Publish the Digital Expert workflow so external messages can enter the current Digital Expert.

## Integration docs

- [Lark Integration](./lark-integration/)
- [WeCom Integration](./wecom-integration/)
- [DingTalk Integration](./dingtalk-integration/)

## Related triggers

- [Lark Trigger](../trigger/lark-trigger/)
- [WeCom Trigger](../trigger/wecom-trigger/)
- [DingTalk Trigger](../trigger/dingtalk-trigger/)
