---
title: Settings
sidebar_position: 2
tags:
  - AI
  - Copilot
---

Here is the basic configuration for the AI assistant in the Xpert AI system:

| Configuration Item      | Description                                      |
|-------------------------|--------------------------------------------------|
| **AI Model Provider**   | Supported AI providers, such as OpenAI, Azure OpenAI, etc. |
| **Default Model**       | The default AI model selected for handling general tasks. |
| **Token Limit/User**    | The initial token usage limit per account, controlling API usage. |

This table provides a concise overview of the AI assistant's basic settings, enabling users to quickly understand and configure them.


## AI Providers

The Xpert platform supports mainstream AI model providers.

![AI Providers](/public/img/copilot/copilot-ai-providers.png)

### Supported Model Providers

Xpert AI supports a wide range of AI providers to enhance flexibility and task-handling capabilities:

| AI Provider           | Official Website                  |
|-----------------------|------------------------------------|
| OpenAI                | [https://openai.com](https://openai.com)          |
| Azure OpenAI          | [https://azure.microsoft.com](https://azure.microsoft.com) |
| Ollama                | [https://ollama.com](https://ollama.com)           |
| DeepSeek              | [https://deepseek.com](https://deepseek.com)        |
| Anthropic             | [https://anthropic.com](https://anthropic.com)       |
| Alibaba Tongyi        | [https://bailian.console.aliyun.com/](https://bailian.console.aliyun.com/)  |
| Zhipu AI              | [https://zhipu.ai](https://zhipu.ai)            |
| Together AI           | [https://together.ai](https://together.ai)         |
| Moonshot AI           | [https://moonshot.ai](https://moonshot.ai)         |
| Groq AI               | [https://groq.com](https://groq.com)            |
| Mistral AI            | [https://mistral.ai](https://mistral.ai)          |
| Cohere AI             | [https://cohere.ai](https://cohere.ai)           |

:::info No specific order
[Add more providers](https://github.com/xpert-ai/xpert/tree/main/packages/server-ai/src/ai-model/model_providers)
:::

The multi-provider support in Xpert AI allows it to adapt to various business scenarios and dynamically select the best model to handle specific tasks.

## AI Copilot Roles

The AI Copilot in the Xpert AI system is divided into three roles, each responsible for different tasks. More roles may be added in the future for other purposes.

1. **Primary**: The main inference copilot, responsible for core task reasoning and generating solutions. It is primarily used for solving complex user problems and engaging in deep conversations.
2. **Secondary**: Acts as a support role in user interactions, providing background information, quick answers, or suggestions to enhance the efficiency of conversations.
3. **Embedding**: Focused on vectorizing files and text for semantic search and deep information retrieval, especially useful for large-scale document processing and analysis.
