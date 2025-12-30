---
title: Error Handling
sidebar_position: 4
---

## Background
In complex AI workflows, digital expert agents typically consist of multiple nodes, each potentially involving API calls, data processing, or large language model (LLM) inference tasks. However, an exception at a single node—such as an API request failure or LLM output error—can cause the entire process to fail, leading to high debugging and maintenance costs for developers. In intricate workflows, single-point failures can severely impact business continuity.

To address this issue, the Xpert AI no-code platform provides a diverse set of exception handling mechanisms, allowing workflows to continue functioning even when local failures occur, thus improving fault tolerance and flexibility.

## Exception Handling Strategies

![Error handling](/public/img/ai/workflow/error-handling.png)

Xpert AI’s exception handling mechanism includes the following strategies:

### 1. Failure Retry
For nodes that may experience transient failures, such as API request failures or LLM timeout errors, Xpert AI allows users to set a maximum retry limit. Under this mechanism, the system will attempt to re-execute the failed node after a set interval until the maximum retry limit is reached. If the failure persists, an exception is raised, or alternative actions are taken.

**Applicable Scenarios**
- API calls fail due to network fluctuations
- LLM generation times out or returns incomplete responses
- Database queries occasionally time out

### 2. Backup Model Switching
When the primary model encounters an error (e.g., OpenAI API is unresponsive or a specific model is unavailable), Xpert AI supports automatic switching to a backup model to continue the task. This strategy ensures high availability of intelligent agents, preventing task failures due to a single model issue.

**Applicable Scenarios**
- The primary AI model experiences network failures or becomes unavailable
- A backup AI model can provide similar-quality results
- The task has low tolerance for delays and requires a quick response

### 3. Default Response and Exception Branching
If retrying or switching to a backup model does not resolve the issue, Xpert AI supports defining default output message or redirecting to an alternative path. The agent can set predefined responses, such as providing a general answer, prompting users to retry later, or escalating the task to human intervention.

![Fail branch](/public/img/ai/workflow/fail-branch.png)

**Applicable Scenarios**
- Business processes allow for degraded performance, such as providing a default recommendation
- Users need to be informed of service unavailability and offered an alternative solution
- Critical task failures require human review or customer support intervention
