---
title: Tool Invocation
sidebar_position: 31
---

In the XpertAI workflow system, the **Tool Node** invokes external capabilities and services, supporting data processing, system integration, and MCP tool invocation. It seamlessly integrates complex logic and third-party system capabilities into automated workflows.

## Tool Types Overview

Tool nodes support three access methods:

- **Built-in Tools**: Provided by XpertAI, ready to use, some require authorization before first use.
- **Custom Tools**: Users can import via standard interfaces (e.g., OpenAPI/Swagger/OData) or manually configure for enterprise systems or proprietary services.
- **MCP Tools**: Highly customizable for complex business logic or asynchronous tasks, using existing modules or custom development.

> ✅ All tools can be created and managed in the “XpertAI → Workspace → Tools” menu.

## Tool Node Parameter Configuration

Configure tool selection and parameters in the **Properties Panel**:

1. **Add Tool Node**  
   Insert a “Tool” node in the workflow canvas.

2. **Select Tool Set and Tool**  
   In the properties panel, choose:  
   - **Tool Set** (created tool set)  
   - **Tool** (specific tool within the set)

3. **Configure Input Parameter Variables**  
   Tools require input parameters (e.g., user ID, keywords, time range). Use workflow state variables, such as:  

   ```text
   User input → ${human.input}
   Current time → ${sys.datetime}
   Previous node output → ${<node_name>.result}
   ```

   - Check parameter format via “Copy Parameter Example.”  
   - Use `{{variable}}` syntax for references.

4. **Output Handling (Optional)**  
   Tool results are available as variables for downstream nodes (e.g., `${<tool_name>.text}`). Map specific fields as needed.

## Advanced Feature: Error Handling

To ensure workflow stability, tool nodes support **error handling configuration**:

- Enable the “Error Handling” toggle to create an exception branch (Catch).  
- Add fallback nodes in the exception branch, such as:  
  - Send error alerts  
  - Return default data  
  - Log and terminate the workflow  

This prevents workflow interruptions due to third-party service failures.

## Application Examples

- Use custom tools to fetch order info from ERP systems.  
- Use MCP tools to sync data to a data platform.

## Tips

- Ensure tools are created and tested before use.  
- Use workflow variables for input parameters to enhance generality and reusability.  
- Enable error handling for critical calls to ensure workflow robustness.