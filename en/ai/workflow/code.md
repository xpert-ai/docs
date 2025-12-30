---
title: Code Execution
sidebar_position: 23
---

The **Code Node** in XpertAI workflows supports running Python (in development) or Node.js code, enabling developers to efficiently perform data transformations. This node is suitable for various scenarios such as arithmetic calculations, JSON processing, and text transformations, making your workflows more flexible.  

With the **Code Node**, developers can embed custom Python (in development) or JavaScript scripts to manipulate variables beyond the capabilities of preset nodes. You can freely configure input and output variables and write the corresponding execution logic.  

![Code Node](/public/img/ai/workflow/workflow-code.png)  

## Configuration Guide  

If the **Code Node** needs to use variables from other nodes, you must define variable names in the **input variables** section and reference them in your code. For detailed variable management, refer to [Session Variables](/docs/ai/workflow/variables/).  

## Advanced Features  

### 1. Error Retry Mechanism  

In certain exceptional cases, re-executing the **Code Node** may resolve the issue. By enabling the **error retry** feature, the system will automatically retry execution based on predefined strategies to enhance workflow stability.  

- **Maximum retry attempts**: 10  
- **Maximum retry interval**: 5s  

You can adjust these parameters according to business needs to optimize the retry strategy.  

### 2. Exception Handling  

Errors may occur during code execution. To prevent a single node failure from disrupting the entire workflow, you can enable **exception handling** in the **Code Node** and configure appropriate response strategies.  

#### Configuration Steps:  

1. Enable the **"Exception Handling"** option in the **Code Node**.  
2. Select an appropriate exception handling strategy and configure it accordingly.  

For more exception handling strategies, refer to [Exception Handling](/docs/ai/workflow/error-handling/).