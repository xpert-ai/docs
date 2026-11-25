---
title: Schedule Trigger
sidebar_position: 22
---

`Schedule Trigger` automatically triggers the Digital Expert workflow based on a time schedule, which is suitable for unattended periodic tasks.

## Applicable scenarios

- Generating daily reports, weekly reports, or inspection reports on schedule
- Syncing external data on schedule and triggering downstream analysis
- Running batch processing during off-peak hours

## Key configuration

Core configuration of Schedule Trigger includes:

- `enabled`: whether enabled
- `cron`: Cron expression (required)
- `task`: default task text injected into the workflow (required)

Before publish, the workflow validates that `cron` is provided; if missing, validation fails.

## Runtime mechanism

1. **Publish phase**:
   - Delete the old task with the same name first (to prevent duplicate registration).
   - Create and start a new task based on `cron`.
2. **Trigger execution phase**:
   - When the scheduled task fires, inject `task` text into the workflow.
   - Let downstream Agent/tool/knowledge nodes continue processing.
3. **Stop phase**:
   - Stop and remove the corresponding Cron task to release scheduler resources.

## Startup recovery strategy

Schedule Trigger uses `bootstrap.mode = replay_publish`:

- After a system restart, it replays publish logic to restore scheduled tasks automatically.
- This fits trigger scenarios that need to continue running after restart.

## Related features

- Trigger node overview: [Workflow Trigger](../../agent/workflow/trigger/)
- Multi-channel access for Digital Expert: [Digital Expert](../../agent/agent/)
- Trigger plugin overview: [Trigger Plugin](./)
