---
title: Projects and Project Types
sidebar_position: 12
---

The project selector sets the business context before a message is sent. Project types distinguish ordinary conversation projects from application-owned business projects, such as a BOM Case. An Assistant can participate in multiple projects; selecting one does not change the Assistant configuration.

## Enable project selection

Enable `composer.projects` when using the Xpert hosted API:

```ts
import type { ChatKitOptions } from '@xpert-ai/chatkit-types';

const composer: ChatKitOptions['composer'] = {
  projects: {
    enabled: true,
    createEnabled: true,
  },
};
```

Merge `composer` into your existing ChatKit options. Project selection is off by default and is not used by Custom API mode. Creation is enabled by default when the selector is enabled; set `createEnabled: false` if your host only supports existing projects.

The entry appears below the composer alongside files and plugins. The panel supports:

- Searching accessible, active projects for the current Assistant, with pagination.
- Switching between grouped and recently updated views.
- Filtering by application and project type, including a shortcut on each group heading.
- An unclassified group for historical projects. Clearing the type filter preserves the search text and selected project.
- A checkmark for the selected project and truncated names with the full name available on hover.

The backend enforces project access. Enabling the UI does not grant permissions, and a failed request is shown as a retryable error rather than an empty catalog.

## Project type catalog

Xpert supplies the catalog; ChatKit does not hard-code applications. Each type has a stable pair of identifiers:

```ts
const projectType = {
  applicationKey: '@example/bom-plugin:bom-lifecycle',
  projectTypeKey: 'case',
};
```

These are example logical identifiers. Use actual values from the SDK catalog. An application type uses `<pluginName>:<appName>` as its `applicationKey`, with the normalized plugin name; do not construct it from installation IDs.

| Field | Meaning |
| --- | --- |
| `applicationKey` / `projectTypeKey` | Stable application and type identity; do not substitute display names |
| `applicationTitle` / `title` | Localizable application and type names |
| `binding.kind` | `project` for platform-managed conversation projects; `entity` for application-owned business entities |
| `binding.providerKey` | Business provider for an `entity` type |
| `available` | Whether the type is available for creation |
| `defaultProjectType` | The Assistant default returned with the catalog, used for initial filtering and creation |

Applications declare types through plugin `projectTypes`. An Assistant can set its default using `options.workspaceScope.projectType`. Group labels prefer the current catalog and can fall back to the saved `projectTypeSnapshot`. General projects use `platform / general`.

## Creation and host events

ChatKit emits creation intent; the host creates the project or opens its business form. The Web Component emits these events, mapped to `onProjectChange` and `onEffect` in React:

| Event | Data | Host responsibility |
| --- | --- | --- |
| `chatkit.project.change` | `{ projectId: string \| null }` | Synchronize scope or routing; `null` leaves the project scope |
| `chatkit.effect`, `name: 'project.create'` | `{ name, projectType?: { applicationKey, projectTypeKey } }` | Create a platform project and select it after success |
| `chatkit.effect`, `name: 'project.create-entry'` | `{ applicationKey, projectTypeKey }` | Resolve and open the application's business creation entry |

For `entity` types, call `client.projects.typeEntry(projectType, { xpertId })` and use the returned Assistant and View to open the business workflow. The application coordinates its entity and conversation project. A generic project form must not replace the business application's required fields or creation rules.

After creation, update `api.projectId` in the host configuration and synchronize the new conversation or business route. Disable creation if your host does not implement these events.

## Lock a Workbench to one project

Set `api.projectId` to the project's ID and use:

```ts
const composer: ChatKitOptions['composer'] = {
  projects: {
    enabled: true,
    locked: true,
    label: 'Automotive BOM Case',
    createEnabled: false,
  },
};
```

With both `locked: true` and `api.projectId`, ChatKit shows a fixed project label with a lock icon instead of a menu. The label is presentation-only, not an authorization or lookup key.

## Project and conversation transitions

Selecting another project starts a new conversation context for that project; it does not move the previous conversation. Plain-text draft content is retained, while attachments, file references and one-message capability tokens are cleared to avoid carrying content across projects.

[Conversation resources](./chatkit-agent-plugins) are loaded and validated in the new scope. Native Connector selections are cleared; versioned resource selections in a new-conversation draft must pass validation in the new project. Changing Assistants or existing conversations restores that conversation's resources instead of reusing another conversation's selection.

## SDK and themes

ChatKit uses `@xpert-ai/xpert-sdk` for Xpert requests. Hosts resolving project entries should use the same SDK:

| SDK method | Purpose |
| --- | --- |
| `client.projects.types({ xpertId })` | Type catalog and default type |
| `client.projects.list({ xpertId, applicationKey, projectTypeKey, search, skip, take })` | Search, filter and paginate; `unclassified: true` selects unclassified projects |
| `client.projects.get(projectId)` | Current project and display name |
| `client.projects.typeEntry(projectType, { xpertId, projectId })` | Resolve a creation or existing-project business entry |

Project, file and resource menus share compact typography, transparent borderless search inputs, and theme-controlled backgrounds, hover colors and rounding. Configure them through [Themes and Customization](./chatkit-themes).

## Verify the integration

1. Check search, grouping, recent projects and pagination.
2. Select an existing project, verify `project.change`, and send a message in the correct scope.
3. Test both ordinary creation and business-type creation; the latter should open the application's form.
4. Confirm a locked Workbench shows the correct fixed project label.
5. Switch projects and verify cleared file references, resource revalidation and independent restoration of the previous conversation.
