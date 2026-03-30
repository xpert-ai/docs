---
title: Configure Xpert AI Assistant
sidebar_position: 5
tags:
  - AI
  - Copilot
  - Xpert
---

In Xpert, configuring an AI assistant essentially means binding a **prepared digital expert** to a specific assistant entry.

After the configuration is saved, when users open the assistant from that entry, they are actually using the digital expert you selected.

If that digital expert was created or imported from a YAML DSL, then the assistant's capabilities also come from that DSL definition.

## Prerequisites

Before you start, make sure the following items are ready:

- You have completed AI model provider setup in [Settings](./settings/);
- You have created a digital expert that can be used as an assistant;
- That digital expert has already been **published**;
- If you want the assistant to help create or edit digital experts, it is recommended to prepare a dedicated "authoring assistant" digital expert;
- Tenant-level default assistant configuration requires tenant admin permissions;
- Organization-level assistant configuration requires switching to the target organization and having the corresponding admin permissions.

> On the **Settings / Assistants** page, only **published** digital experts in the current scope are usually available for selection.

## How To Configure Xpert AI Assistant

Open **Settings / Assistants**, then follow the steps below.

### 1. Select the assistant entry

Common entries include:

- **Workspace Assistant**: used by the shared assistant in the workspace and Studio;
- **ChatBI Assistant**: used by the assistant on the ChatBI page.

### 2. Enable the assistant

Turn on the **Enabled** switch for the target entry.

### 3. Select the digital expert

In the digital expert selector, choose the digital expert you want to bind.

Recommended choices:

- For creating or editing digital experts in the workspace, choose an "authoring assistant" digital expert;
- For ChatBI, choose a digital expert focused on data analysis or business Q&A.

### 4. Fill in the assistant page URL

Enter the access URL of the assistant chat page.

For example:

```text
https://app.xpertai.cn/chatkit
```

### 5. Save the configuration

After you click **Save**, that entry will start using the digital expert you selected.

## How To Choose The Right Assistant Entry

### Workspace Assistant

Best suited for:

- Creating new digital experts through chat in the workspace;
- Continuing to edit the current digital expert draft in Studio;
- Helping you add knowledge bases, toolsets, prompts, or workflow structures.

If your goal is to configure an AI assistant that helps you orchestrate digital experts, this entry should usually be bound to a dedicated "authoring assistant" digital expert.

### ChatBI Assistant

Best suited for:

- Answering analytics questions on the ChatBI page;
- Conversational analysis around metrics, models, and data interpretation;
- Providing a fixed assistant entry for data analysis.

## How To Prepare An "Authoring Assistant" Digital Expert

If you want the Workspace Assistant to help create or edit digital experts, it is recommended to prepare a dedicated "authoring assistant" digital expert instead of reusing a business expert.

Common approaches include:

- Create a new digital expert based on the platform's authoring assistant template;
- Directly refer to the example file in the same folder: `./xpert-authoring-assistant.yaml`;
- Or create a dedicated digital expert for digital-expert authoring based on a similar YAML DSL template;
- Publish it first, then bind it to the Workspace Assistant in **Settings / Assistants**.

## Tenant Default And Organization Override

Assistant configuration supports two levels:

### Tenant Default

Suitable for a shared default assistant across the whole tenant.

For example:

- The entire company uses the same Workspace Assistant by default;
- All organizations use the same ChatBI Assistant by default.

### Organization Override

Suitable when a specific organization needs a different assistant, for example when different organizations use different Workspace Assistants or ChatBI Assistants.

When an organization-level configuration exists, it takes priority. If no organization-level configuration is set, the system falls back to the tenant default.

## What You Can Do After Configuration

### Create digital experts in the workspace

If the Workspace Assistant is bound to an "authoring assistant" digital expert, users can directly describe their needs in chat, for example:

- `Help me create an after-sales support expert`
- `Help me create a contract review expert`

The assistant will create a new digital expert draft based on the request and guide you to continue editing it in Studio.

### Edit the current digital expert in Studio

If you already opened a digital expert in Studio, the assistant can continue helping you edit the current draft, for example:

- Add a knowledge base;
- Adjust prompts;
- Add toolsets;
- Modify workflow structures.

These changes usually apply to the **current draft**, not directly to the published version, so you should still review and publish the result afterward.

## Notes

- If the current digital expert is still only a draft and has not been published, it usually cannot be selected on the assistant settings page.
- If there are unsaved changes in Studio, the assistant may not overwrite the current draft directly.
- If you want the assistant to focus on creating and editing digital experts, it is better to prepare a dedicated authoring assistant instead of reusing a business expert.
- If the entry still shows as not configured, check whether it has been enabled, whether a digital expert has been selected, and whether the current organization is using the expected configuration layer.

## FAQ

### Why does my digital expert not appear in the selectable assistant list?

Common reasons include:

- It has not been published yet;
- You are not in the correct tenant or organization scope;
- The current entry does not have access to that digital expert.

### Why can't I use the assistant in the workspace after binding it?

Check the following items:

- Whether the assistant has been enabled;
- Whether the correct digital expert is bound;
- Whether the assistant page URL is correct;
- Whether the current organization is being overridden by another organization-level configuration.

### Why didn't the assistant changes take effect immediately?

Because most of these changes are first applied to the **draft**. To make the updated version available to end users, you still need to review and publish it manually.

## Related Docs

- [🤖 AI Copilot](./index/)
- [Settings](./settings/)
- [Digital Expert](../digital-expert/digital-expert/)
- [Expert Configuration](../digital-expert/expert-configuration/)
