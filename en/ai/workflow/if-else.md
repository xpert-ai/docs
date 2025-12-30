---
title: Logical Router
sidebar_position: 12
---

The **routing** node in Xpert AI dynamically controls the logic branches through IF-Else condition checks, with the implementation logic as follows:

1. **Condition Check**  
   Based on predefined routing functions (e.g., `if (state.A) → Node X; else → Node Y`), decisions on the next node to execute are made in real-time based on **conversation state variables** (such as user intent, sentiment analysis results).

2. **Branch Execution**  
   - **Single Path Choice**: A typical IF-Else pattern (e.g., if the user query contains sensitive words → route to manual review; otherwise → generate automatic reply).
   - **Multiple Parallel Paths**: Supports `if...else if...else` branches (e.g., triggering both log recording and asynchronous data analysis simultaneously).

![router node](/public/img/ai/workflow/router.png)

The **routing** node is a core component in the workflow platform, responsible for determining the next process step based on a set of predefined conditions. It decides which tasks or operations to execute based on condition checks.

### Core Features:
1. **Condition Check**: The routing function determines the next action based on multiple conditions, typically checking session variables.
   - **IF**: When all specified conditions are met, a specific action or step is triggered.
   - **ELIF**: If the "IF" condition is not met, it checks other conditions. If those conditions are met, a different set of actions is triggered.
   - **ELSE**: If neither the "IF" nor the "ELIF" conditions are met, a fallback set of actions is executed.

2. **Dynamic Decision Flow**: Based on the results of condition checks, the router decides which branch of the process to follow, dynamically choosing different paths based on input data.

### Configuration:
- **Condition Settings**: Users can set conditions based on actual needs, such as checking whether input parameters are empty, fall within a specific numeric range, or satisfy certain relationships.
- **Action Definition**: Each condition branch corresponds to an action or series of operations. For example, if the condition is met, a specific task is executed; if not, a fallback task is performed.

### Use Cases:
1. **Dynamic Process Control**: Suitable for scenarios where process steps are not fixed and need to be adjusted based on real-time data.
2. **Multiple Branch Tasks**: This routing feature is highly effective when different operations need to be performed based on different input conditions.
3. **Complex Decision Trees**: When a workflow needs to decide the direction based on multiple layers of condition checks, the Router helps manage it efficiently.

### Advantages:
- **Flexibility**: Allows dynamic adjustment of the execution path based on different conditions, adapting to changing requirements.
- **Configurability**: Users can easily set and modify conditions, quickly responding to business needs.
- **Automation**: Automatically guides the workflow based on conditions, reducing manual intervention and improving efficiency.

In summary, the routing feature in the Xpert AI platform dynamically controls workflow paths through condition checks and branching logic, enabling complex task automation and flexible process control.