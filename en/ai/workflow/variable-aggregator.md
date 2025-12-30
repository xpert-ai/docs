---
title: Variable Aggregator
sidebar_position: 18
---

The **Variable Aggregator Node** is a key logic node in XpertAI workflows, used to **consolidate multiple input variables** and generate a unified output. It acts as a "variable collector" in the workflow, gathering, deduplicating, filtering, and reorganizing data from different nodes and contexts, so that downstream agent or algorithm nodes can efficiently utilize the results.

This node is typically used in complex workflows involving multi-branch merging, data summarization, or state aggregation, providing greater flexibility and scalability.

## ⚙️ Features

### 1. Unified Aggregation of Multiple Input Variables

The variable aggregator node can receive outputs from multiple nodes (such as calculation results, API responses, document extraction, etc.) and **automatically combine them into a unified variable set**. This allows the workflow to quickly restore context after branch execution, without relying on external logic for complex variable synchronization.

### 2. Automatic Filtering of Invalid Data

During aggregation, the system **automatically filters out empty values (null, undefined) or invalid variables**, ensuring the final output structure is clear and accurate, and preventing meaningless data from polluting downstream nodes.

### 3. Flexible Output Data Structures

The aggregated result can be configured to output as:

* Array (for batch data scenarios)
* String (such as concatenated text)
* Object (such as merged fields)

This meets the input requirements of different node types (AI models, computation nodes, conditional nodes, etc.).

## 📊 Output

By default, the aggregator node provides two output channels:

| Output Variable | Type        | Description                                      |
| --------------- | ----------- | ------------------------------------------------ |
| **result**      | Dynamic     | The final aggregated result (array or object)    |
| **error**       | String      | Error message during aggregation (e.g., invalid variable path) |

These outputs can be directly used as inputs for subsequent nodes, enabling automatic data flow and context management.

## 🚀 Value Summary

| Value                  | Description                                 |
| ---------------------- | ------------------------------------------- |
| **Simplifies Branch Logic**      | Automatically aggregates multi-path outputs, reducing manual variable management |
| **Improves Data Consistency**    | Automatically filters empty values and unifies output structure |
| **Enhances Scalability**         | Supports plugin strategies to extend aggregation logic |
| **Enables Agent Context Sharing**| Facilitates smooth data transfer across nodes and tasks |

---

**In summary**,  
the "Variable Aggregator Node" is a crucial hub for connecting branches and merges in XpertAI workflows.  
It makes data flow smarter and workflow orchestration simpler,  
serving as an essential building block for multi-agent collaboration and complex task automation.
