---
title: Conversation Variables
sidebar_position: 3  
---

**Conversation Variables** are a core feature of the XpertAI Agent Platform, designed to provide dynamic and scalable context management capabilities for agent-based dialogue systems.

## Functionality Overview  
**Conversation Variables** are the core data structure used in the XpertAI Agent Platform to store and manage dialogue context. They allow developers to:
- **Persist key information**: Such as user intent, historical dialogue records, intermediate reasoning results, etc.
- **Support dynamic updates**: By collaborating through nodes and edges, enabling real-time evolution of the dialogue state.
- **Control isolation and sharing**: Flexibly manage public variables (e.g., user input) and private variables (e.g., internal intermediate states).

## Technical Implementation

### System Variables  
System variables are predefined variables provided by the platform, such as user language, timezone, email, etc. These can be modified in the user settings.

System Variables:

| System Variable Name | Description                |
|----------------------|----------------------------|
| `sys.language`         | The language used by the system |
| `sys.user_email`       | The user's email address   |
| `sys.timezone`        | The user's timezone        |

### Conversation Variables  
**Conversation Variables** are shared state variables among all agents within a digital expert, enabling the transfer and evolution of information between agents. Users can find the "Variables" button in the Digital Expert Studio's menu to open the session variable panel and add variables.

![Conversation variables](/public/img/ai/variables/conversation-variables.png)

To insert Conversation Variables in prompts, use `{{` to insert the variable name:

![Insert Conversation Variables into prompt](/public/img/ai/variables/prompt-use-variables.png)

### Agent Variables  
Agent variables are internal state variables used to store the agent's status in a conversation. Each agent can define private Conversation Variables (in development) to maintain data isolation.

## Writing to Variables  

In the output of nodes (**Agent** nodes and **Tool** nodes), the **write to memory** field list can be used to write the output results to Conversation Variables. When writing to Conversation Variables, the variable name and value source must be specified.

![Tool writing to variables](/public/img/ai/variables/tool-write-variables.png)

When the agent writes to Conversation Variables, text results can be written to variables, or the structure of the LLM output can be defined first, and then the attributes within the structure can be written to Conversation Variables.

![Agent writing to variables](/public/img/ai/variables/agent-write-variables.png)

Agents define **structured outputs**: This is only available when the node does not use tools, knowledge bases, or sub-agents, and the LLM itself must support structured output capability.

### Technical Details

- **Multi-channel design**: Each variable or agent corresponds to an independent State Channel.
- **Type safety**: The data type of variables (e.g., string, array, custom object) is defined through the Annotation object.
- **Update strategy**: Each channel can be configured with different Reducer functions (e.g., `append` to add historical messages, `replace` to overwrite temporary results).

Example code structure:
```typescript
const state = {
  messages: {
    value: (prev: Message[], curr: Message[]) => [...prev, ...curr], // Append mode
    default: () => [],
  },
  context: {
    value: (prev: Context, curr: Context) => ({ ...prev, ...curr }), // Merge mode
    default: () => ({ topic: "", entities: [] }),
  },
};
```

## Core Advantages

#### **a. Dynamic Context Management**
- **Multi-turn dialogue support**: The `messages` channel automatically maintains the conversation history, supporting context-based reasoning.
- **Conditional branching control**: Use variable values to drive logic transitions (e.g., switch processing nodes based on `user_intent`).

#### **b. Efficient Collaboration** (In Development)
- **Parallel processing**: Multiple nodes can asynchronously update different variables within the same Super-Step (e.g., simultaneously handling semantic parsing and sentiment analysis).
- **Incremental updates**: Avoid full state replication through Reducer functions to improve performance.

#### **c. Observability and Debugging** (In Development)
- **State snapshots**: A complete snapshot of Conversation Variables is generated after each Super-Step, supporting playback and diagnostics.
- **Variable-level monitoring**: Track key variables (e.g., the evolution path of `context.topic`) individually.
