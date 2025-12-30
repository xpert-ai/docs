---
title: Subflow
sidebar_position: 14
---

The **Subflow** node is a special node type in the XpertAI workflow orchestration system. It encapsulates a complete segment of process logic into an independent module, which can be reused in the main workflow through a "call" mechanism. This design significantly enhances the **modular management, reusability, and maintainability** of workflows.

## 🛠 Functionality and Use Cases

Subflow nodes are suitable for the following typical scenarios:

- Reusing logic that appears repeatedly across multiple workflows, such as employee onboarding initialization, invoice approval, or troubleshooting.
- Breaking down complex logic into clear, modular components to keep the main workflow concise.
- Independently developing, testing, and maintaining specific workflow logic, reducing risks associated with changes to the main workflow.

## 🧷 Example: Subflow Node in Employee Onboarding Workflow

In a company's "Employee Onboarding Automation Workflow," a subflow node named **[Onboarding Process]** encapsulates the following IT initialization operations:

- Creating an enterprise email for the employee.
- Assigning office equipment.
- Adding the employee to the department email group.
- Sending a welcome email.

👇 **Partial Workflow Diagram:**

![Subflow node](/public/img/ai/workflow/workflow-subflow.png)

---

## 🧬 Node Capabilities

| Capability                | Description                                                                 |
|--------------------------|-----------------------------------------------------------------------------|
| Input Parameter Passing   | The main workflow can pass contextual parameters (e.g., employee name, email) to the subflow. |
| Output Result Return      | The subflow can return processing results to the main workflow after execution. |
| Error Isolation and Fault Tolerance | Subflow failures can be handled independently without affecting the overall main workflow. |
| Multiple Reuses           | Subflows can be called by multiple main workflows, such as "Intern Onboarding" or "Job Transfer Workflow." |
| Nested Support (Optional) | Subflows can reference other subflows (if enabled), enabling complex multi-level logic organization. |

The **Subflow** node supports parameter passing between the main workflow and the subflow, categorized into **Input Variables** and **Output Variables**, as described below:

### 🔸 Input Variables

Used to pass data from the main workflow to the subflow.

As shown, the configuration format is:

```
Main Workflow Variable ➝ Subflow Variable
```

For example:

| Subflow Variable (Recipient) | Main Workflow Variable (Source) |
|-----------------------------|---------------------------------|
| `employee_name`             | `employee_info`                 |

This indicates that the `employee_info` variable from the main workflow is passed to the subflow and assigned to the `employee_name` variable.

### 🔸 Output Variables

Used to return processing results from the subflow to the main workflow.

The configuration format is:

```
Subflow Variable ➝ Main Workflow Variable
```

For example:

| Main Workflow Variable (Recipient) | Subflow Variable (Source) |
|-----------------------------------|--------------------------|
| `email`                           | `sys.user_email`         |

This indicates that the `sys.user_email` variable from the subflow is output to the `email` variable in the main workflow, available for subsequent nodes, such as `subflow_jzsikojwdp_channel.email` corresponding to the `email` output variable of the "Subflow" node.

### ✅ Operation Tips:

- Multiple mapping entries can be added by clicking the `➕` button.
- Subflow variable sources are typically system variables or intermediate computation results within the subflow.

Through this mechanism, the **Subflow** node achieves data decoupling and reuse between workflow modules, serving as a key capability for building large-scale workflow automation systems.

## ⚙ Usage Guidelines

### How to Create a Subflow Node?

1. Add a new subflow node and name it (e.g., "Onboarding Process Subflow").
2. Add an agent node as the entry point to the subflow.
3. Add more nodes to the workflow associated with the agent node.
4. Configure input and output parameter mappings.

---

## 🚀 Application Value

- ✅ Increases workflow reuse, avoiding redundant development.
- ✅ Reduces main workflow complexity, improving readability.
- ✅ Supports division of workflow responsibilities, facilitating multi-team collaboration.
- ✅ Enhances workflow maintainability and scalability.

---

## 📘 Example Digital Expert: Smart HR Assistant

In the employee onboarding automation scenario, a subflow node is used to build a clear, automated onboarding workflow. Refer to the template [Smart HR Assistant](https://app.mtda.cloud/explore?search=Smart%20HR%20Assistant).