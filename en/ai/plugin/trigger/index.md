---
title: Trigger Plugins
sidebar_position: 20
---

This section introduces **Workflow Trigger** extensions in the Xpert plugin system, especially how external messaging platforms route messages into Digital Experts.

If you want a Digital Expert to be triggered not only from the in-platform chat interface, but also from external messaging systems or scheduled tasks, you can extend it through Trigger plugins.

## Integration vs Trigger

External IM access is usually split into two objects:

- **Integration**: stores platform credentials, callback URLs, long-connection settings, and runtime status. It connects Xpert AI to the external platform.
- **Trigger**: lives in a Digital Expert workflow. It binds one integration to the current Digital Expert and controls session timeout, message aggregation, and routing.

Creating a Lark, WeCom, or DingTalk bot is therefore not finished after saving the integration. You must also add the corresponding trigger to the target Digital Expert workflow and publish the workflow. For tenant-level installation requirements and recommended connection modes, see [Integration Overview](../integration/).

## Scope of this section

- [Schedule Trigger plugin implementation](./schedule-trigger/)
- [Lark Trigger](./lark-trigger/)
- [WeCom Trigger](./wecom-trigger/)
- [DingTalk Trigger](./dingtalk-trigger/)

## Design highlights

Trigger plugins typically implement the following capabilities:

1. **Trigger metadata (`meta`)**: Used to display trigger name, icon, and config form in the frontend.
2. **Configuration validation (`validate`)**: Checks required fields and binding conflicts before publishing.
3. **Publish and stop (`publish / stop`)**: Registers and releases trigger runtime resources.
4. **Bootstrap recovery strategy (`bootstrap`)**: Controls whether triggers recover automatically after system restart.

## Related features

- Workflow trigger concepts and node description: [Trigger](../../workflow/trigger/)
- Multi-entry access for Digital Expert: [Digital Expert](../../agent/agent/)
- Plugin system overview: [Plugin Overview](../overview/)
