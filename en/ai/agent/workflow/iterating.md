---
title: Iterating
sidebar_position: 16
---

**Iterating** node is a core component designed for loop processing scenarios, capable of automating the handling of structured data (**arrays/objects**). By flexibly configuring sub-agents or workflows, combined with parallel processing and intelligent error-handling mechanisms, it significantly enhances the execution efficiency of complex tasks.

![Iterating node](/public/img/ai/workflow/iterating-node.png)

## Core Functionality Breakdown

### 1. Data Structure Support
| Data Type   | Processing Method                      | Output Format                  |
|-------------|----------------------------------------|-------------------------------|
| **Array**   | Iterates through each element (in index order or random order) | New array (collection of processed elements) |
| **Object**  | Iterates through each key-value pair (property-level processing) | New object (restructured key-value pairs) |

### 2. Processing Modes
| Mode            | Execution Method                      | Applicable Scenarios                  |
|-----------------|---------------------------------------|---------------------------------------|
| **Sequential**  | Executes in sequence                  | Tasks with strong data dependencies or resource-sensitive tasks |
| **Parallel**    | Multi-threaded concurrency (configurable concurrency level) | I/O-intensive tasks or independent element processing tasks |

### 3. Error Handling Strategies
| Strategy              | Behavior Description                  | Data Integrity Assurance            |
|-----------------------|---------------------------------------|-------------------------------------|
| **Abort on Error**    | Stops the process immediately and throws an exception | High requirement for full data consistency |
| **Ignore Errors**     | Skips errored items, retains original data | Allows partial failure, logs errors |
| **Remove Failed Results** | Automatically filters out failed items, outputs valid result set | Prioritizes result usability |

## Best Practice Guide

### Mode Selection Recommendations
- Prioritize **Parallel Processing** when:  
  - Element processing logic has no state dependencies  
  - External APIs/services have high availability  
  - There are explicit concurrency limits (e.g., database connection pools)  

- Use **Sequential Processing** when:  
  - Processing order must be maintained (e.g., time-series data)  
  - Involves transactional operations (e.g., database writes)  
  - The process consumes significant computational resources  

### Error Strategy Decision Tree
```plaintext
                   Start
                     │
         ┌───────────┴───────────┐
         ▼                       ▼
  Allow partial failure?       Must be 100% successful
         │                       │
   ┌─────┴─────┐             ┌────┴───┐
   ▼           ▼             ▼        ▼
Retain original data  Only need valid results  Select "Abort on Error"
   │           │
Select "Ignore Errors"  Select "Remove Failed Results"
```

By leveraging the iterative node effectively, users can build integrated solutions ranging from simple data cleaning to complex business process automation.
