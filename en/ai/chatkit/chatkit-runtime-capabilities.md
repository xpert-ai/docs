---
title: Skills and Graph Capabilities
sidebar_position: 9
---

<Info>
Control skills, middleware nodes and sub-agents already configured on the Assistant.
</Info>

ChatKit can expose optional Xpert runtime capabilities in the composer. This lets users decide when an assistant should load a specialized skill, plugin middleware, or sub-agent instead of enabling every capability on every request.

The result is a smaller default context, clearer user intent, and better control over expensive or high-impact capabilities.

<Note>
This page covers `runtimeCapabilities`, which selects existing Assistant graph capabilities. Agent Plugins, additional middleware and published experts use a separate `runtimeResources` selection below the composer. See [Plugins, Middleware and Experts](./chatkit-agent-plugins). Resource binding IDs and graph node keys are not interchangeable.
</Note>

## Concepts

### Skills

Skills are reusable capability packages exposed by Xpert through Skills Middleware. A skill can provide domain instructions, prompt workflows, tools, or task-specific behavior.

Skills can be configured as:

- default skills, checked automatically when ChatKit loads the assistant
- optional skills, available to the user but not loaded unless selected

When ChatKit sends an explicit runtime allow-list, the selected skill IDs replace the middleware defaults for that run.

### Graph middleware

`runtimeCapabilities.plugins` is a retained protocol field for optional workflow middleware nodes, not standard Agent Plugin packages. ChatKit identifies nodes by `nodeKeys`, so multiple nodes using the same provider can be selected independently. Likewise, `subAgents.nodeKeys` identifies expert connections already configured in the graph.

Required or system middleware should stay hidden from end users. It always runs as part of the backend workflow and is not shown in the ChatKit selector.

## Composer Experience

When the Assistant exposes runtime capabilities, ChatKit offers configured skills, middleware nodes and graph experts in its capability menus and slash palette. Available entries depend on the Assistant configuration and are distinct from the unified resource catalog below the composer.

Users can enable or disable capabilities from these panels. The current conversation selection is restored when the user returns to the thread.

Users can also type `/` to open the slash palette and search capabilities directly. Selecting a skill, plugin, or sub-agent inserts an atomic token into the composer. That token affects only the next submitted message and is cleared after the request is sent.

## Request Behavior

ChatKit sends selected capabilities as a runtime allow-list:

```ts
await chatkit.sendUserMessage({
  text: 'Review the build pipeline and check for deployment risks.',
  runtimeCapabilities: {
    mode: 'allowlist',
    skills: {
      workspaceId: 'workspace_123',
      ids: ['skill_code_review'],
    },
    plugins: {
      nodeKeys: ['Middleware_sandbox'],
    },
  },
});
```

The allow-list is written to the submitted input and to `state.human`, so the backend workflow can read the same selection from either place.

An empty allow-list is meaningful: it disables user-selectable skills and plugins for that run while keeping required system middleware active.

## Product Guidance

Expose a runtime capability when users should make an intentional choice. Common examples include:

- code review or repository analysis skills
- document search and retrieval plugins
- browser, sandbox, or file-system middlewares
- external ticketing, CRM, or workflow integrations
- specialized sub-agents for review, research, planning, or QA

Keep labels short, add clear descriptions, and include icons when possible. Put always-required behavior into system middleware instead of asking users to select it.

If the runtime capability endpoint is unavailable, ChatKit hides the selector and continues with the legacy assistant behavior.
