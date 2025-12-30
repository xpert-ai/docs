---
title: Task Handover
sidebar_position: 33
---

**Task Handover** is a node type in the XpertAI platform's Workflow, designed to enable efficient task transfer and collaboration between Agents. It can be assigned as an **Agent Tool**, allowing a higher-level Agent to dynamically delegate tasks to one or more available Sub-Agents, which then process the tasks until completion and return results to the higher-level Agent.

This node is particularly suitable for:

* Multi-Agent collaboration scenarios
* Cross-domain task processing
* Complex task decomposition and parallel execution
* Dynamic task assignment and role division

---

## **How It Works**

1. **Connecting Multiple Sub-Agents**

   * The `Task Handover` node can connect to multiple Sub-Agent nodes simultaneously.
   * Sub-Agents can be specialized Agents in different domains (e.g., data analysis, copywriting, R&D support, etc.).

2. **Task Allocation Logic**

   * The higher-level Agent can invoke the `Task Handover` tool during its process.
   * The node assigns tasks to eligible Sub-Agents based on configuration.

3. **Task Context Passing**

   * When a task is handed over to a Sub-Agent, it automatically includes:

     * Task content (`description`)
   * This ensures Sub-Agents can seamlessly continue task processing.

4. **Result Return**

   * After processing, the Sub-Agent can return results to the higher-level Agent.

---

## **Configuration Details**

After adding a **Task Handover** node in the Workflow editor, the following configurations are available:

| Configuration Item | Description |
|--------------------|-------------|
| **Node Name**      | Custom display name for the node in the workflow |
| **Sub-Agent List** | Select connectable Sub-Agent nodes |

---

## **Use Case Examples**

### **1. Customer Service Workflow**

* The main Customer Service Agent receives user requests.
* For technical issues, the Task Handover node assigns the task to the “Technical Support Sub-Agent.”
* For billing issues, it assigns the task to the “Finance Sub-Agent.”

### **2. Content Production Pipeline**

* The main Agent receives a creative theme.
* The Task Handover node delegates the theme to the “Copywriting Sub-Agent.”
* After copywriting is complete, it hands over to the “Proofreading Sub-Agent.”

### **3. Data Analysis Task**

* The main Agent parses task requirements.
* The Task Handover node assigns data processing to the “Data Cleaning Sub-Agent.”
* Cleaned data is then handed over to the “Visualization Sub-Agent.”

---

## **Advantages**

* **Flexibility**: Can connect to any number and type of Sub-Agents.
* **Scalability**: Adapts to various task allocation scenarios.
* **Efficient Collaboration**: Supports parallel processing and rapid handovers.

---

## **Best Practices**

1. In multi-Agent collaboration scenarios, clearly define Sub-Agent responsibilities to minimize handover costs.
2. For critical tasks, enable a failure retry mechanism and configure backup Sub-Agents.