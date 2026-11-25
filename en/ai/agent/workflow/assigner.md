---
title: Variable Assigner
sidebar_position: 14
---

In the XpertAI workflow system, the **Variable Assigner Node** assigns values to writable variables, enabling information recording, state updates, and context maintenance. It’s a core component for user preference memory, session state management, and process data transfer. This node writes existing variable values to persistent variables.

## Configuration Process

Below is a typical "memory write" scenario for variable assigner configuration:

### 1. Define Session Variable Structure

Define a session variable named `memories`:

- Type: `array[object]`
- Purpose: Record facts, preferences, and historical data from user input.

### 2. Check for New Information

After user input, use a **Conditional Node** with LLM reasoning:

- If new information is detected, take the upper branch.
- If no new information, take the lower branch and generate a response using existing memories.

### 3. Extract New Information

In the upper branch, add an **LLM Node** to extract user input into structured facts, e.g.:

```json
{
  "fact": "User likes black coffee",
  "time": "2025-06-29"
}
```

### 4. Variable Assigner/Memory Write

Use the **Variable Assigner Node** to append LLM output to the `memories` array:

- Operation: Select variable type as `array`, operation as `append`.
- Content: Extract object from LLM output using variable reference (e.g., `{llm.result}`).
- If LLM output is a string, convert to standard object structure before writing.

### 5. Read Memory in Subsequent Nodes

In subsequent **LLM Nodes**, concatenate `memories` content into a string for context input, e.g.:

```text
Historical Information:
1. User likes black coffee.
2. User often checks order status in the morning.
```

Insert into the system prompt for personalized response capability.

## Summary

The Variable Assigner Node enables flexible data writing, forming the foundation for stateful, personalized, multi-turn dialogue experiences. Combined with conditional nodes, LLM nodes, and memory mechanisms, it builds smarter business processes and user interactions.