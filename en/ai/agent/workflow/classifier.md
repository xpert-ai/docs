---
title: Question Classifier
sidebar_position: 24
---

The **Question Classifier** is an intelligent node in the XpertAI workflow that automatically categorizes user-input text into predefined question categories. By defining clear classification labels and descriptions, this node accurately determines the semantic intent of the input, providing a basis for subsequent process branching.

## Typical Use Cases

The Question Classifier is widely used in the following scenarios:

* **Intent recognition in customer service scenarios** (e.g., orders, after-sales, product usage)  
* **Automatic sorting of user comments or feedback**  
* **Internal enterprise ticket classification or initial email screening**

For example, in a customer service chatbot workflow, the Question Classifier can serve as the first step to determine the type of user question and guide it to the appropriate response path or system interface.

**Example Classifications:**

| Classification ID | Category | Description |
| --- | --- | --- |
| 1 | After-sales Service | Issues related to warranty, returns, exchanges, or customer support |
| 2 | Product Usage | Questions about how to use the product or configure its features |
| 3 | Other Issues | Questions that cannot be classified into other categories |

**Example Inputs and Classification Results:**

* “How do I set up facial recognition on my phone?” → Result: `2 (Product Usage)`  
* “How long is your warranty period?” → Result: `1 (After-sales Service)`  
* “Do you like to eat apples?” → Result: `3 (Other Issues)`

## Configuration Method

After adding the “Question Classifier” node to the agent workflow, follow these steps to configure it:

### Step 1: Select Input Variable

Choose the source variable for the user’s input text, typically `human.input` from the system or dialogue context, or a custom variable.

### Step 2: Define Classification Options

In the node configuration, add multiple classification labels, each including:

* **Classification Description** (content guiding the model’s judgment, e.g., “Issues related to repairs, returns, or customer support”)

There is no limit to the number of classifications, but it’s recommended to ensure clear semantic distinctions between labels.

### Step 3: Model Inference

The classifier invokes the platform’s integrated natural language model to infer the input text and return the most matching classification ID. No manual model selection is required; the system automatically selects an appropriate model for inference.

### Step 4: Configure Subsequent Process Branching

Each classification result returns a corresponding numeric ID (e.g., 1, 2, 3), stored in the variable `<node>.category`.

You can control branching at the current node or use this variable in subsequent nodes to direct the workflow, for example:

```yaml
If <node>.category == 1, jump to the “After-sales Processing” node
If <node>.category == 2, jump to the “Feature Explanation” node
If <node>.category == 3, jump to the “Fallback Response” node
```

## Output Description

### Output Variable: `<node>.category`

* **Type**: Number  
* **Meaning**: Represents the matched classification ID (starting from 1)  
* **Usage**: Can be used in subsequent logic, such as decision nodes, API request nodes, or knowledge base nodes, to determine the processing direction.

---

## Example Configuration (Simplified)

```yaml
Classification Labels:
- Label: After-sales Service
  Description: Issues related to returns, repairs, or customer support
- Label: Product Usage
  Description: Questions about how to use the product or configure its features
- Label: Other Issues
  Description: Questions unrelated to the product or not fitting into the above categories
```

User Input: “What should I do if my earphones aren’t receiving a Bluetooth signal?”  
System determines the classification as “Product Usage” and returns `<node>.category = 2`

---

## Configuration Tips

* **Be Specific in Descriptions**: The more detailed the classification descriptions, the better the model’s classification performance.  
* **Avoid Overlapping Semantics**: Ensure clear semantic boundaries between labels.  
* **Control the Number of Classifications**: It’s recommended to limit a single node to 3–10 categories to avoid semantic ambiguity.

---

## Common Questions

### Q: Is the result a text label or a number?

A: The classification result is a numeric ID, starting from 1, stored in the variable `<node>.category`. You can use this value to determine which classification label was matched.

### Q: Does it support multiple classification results?

A: Currently, each inference returns only the most likely classification. If multi-label classification is needed, please contact platform support or combine multiple classifier nodes for judgment.
