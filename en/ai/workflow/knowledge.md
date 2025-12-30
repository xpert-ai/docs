---
title: Knowledge Retrieval
sidebar_position: 21
---

The **Knowledge Retrieval** node is a core capability in the XpertAI agent workflow, providing highly relevant information support for user queries. It automatically retrieves content snippets semantically related to the query from a pre-built knowledge base, serving as contextual input for downstream agents to understand, analyze, and generate responses.

## Main Capabilities

| Function        | Description                                |
| --------------- | ------------------------------------------ |
| 🔍 Semantic Matching | Automatically identifies the core intent of user input and retrieves the most semantically relevant knowledge snippets |
| 📂 Content Support   | Supports retrieval of structured and unstructured document content, such as policy documents, FAQs, product manuals, etc. |
| 🎯 Precise Recall    | Supports recall of multiple relevant content items, enabling comprehensive judgment by downstream nodes |
| 🔄 Composability     | Can be flexibly combined with any language model node (e.g., reasoning models) to form complex task flows |
| 🔗 Multi-Knowledge Source Support | Configurable to access multiple knowledge bases for cross-business or multi-domain information retrieval |

## Usage

### 1. Input Parameters

The Knowledge Retrieval node accepts input from upstream nodes, typically a user's natural language question or a standardized query processed by an agent.

```json
{
  "question": "What are the company's rules for compensatory leave?"
}
```

### 2. Output Structure

The Knowledge Retrieval node returns a list of documents in the format of Langchain's `Document` object. Each document contains two parts:

* `page_content`: The actual retrieved text content
* `metadata`: Metadata related to the content (e.g., source, document name, segment index, etc.)

** 📄 Output Example **:

```json
[
  {
    "pageContent": "According to company policy, employees may apply for compensatory leave within 5 working days after overtime.",
    "id": "123",
    "metadata": {
      "source": "HR_Employee_Policy_v3.pdf",
      "section": "Compensatory Leave Policy",
      "page": 12
    }
  },
  {
    "pageContent": "Compensatory leave applications require approval from the direct supervisor and must not exceed the actual overtime hours.",
    "id": "456",
    "metadata": {
      "source": "HR_Employee_Policy_v3.pdf",
      "section": "Compensatory Leave Policy",
      "page": 12
    }
  }
]
```

This structure facilitates downstream language model nodes (e.g., Deepseek R1) to use the raw content and contextual information for high-quality question answering, summarization, or logical reasoning.

## Typical Use Cases

* **Enterprise Internal Q&A Assistant**: For policies, IT support, expense reimbursement processes, etc.
* **Customer Service Intelligent Assistant**: Product feature explanations, troubleshooting guides
* **Project Knowledge Support**: Helps team members quickly understand background information or past experiences
* **Legal/Compliance Consulting Bot**: Extracts explanatory content from regulatory documents

## Recommended Companion Nodes

The Knowledge Retrieval node is typically used with the following nodes to form a complete agent task chain:

| Companion Node                   | Role                        |
| -------------------------------- | --------------------------- |
| 🎯 Reasoning Model Node (e.g., Deepseek R1) | Performs deep understanding and logical judgment on retrieved content to generate professional responses |
| 🧠 Prompt Generation Node         | Rewrites user input to improve retrieval accuracy |
| 📝 Formatting Node                | Enhances output readability and clarity |
| 🚀 Output Node                   | Sends results to user interfaces, such as Feishu or web chat windows |

## Notes

* Ensure the relevant knowledge base is populated and available
* For multilingual content, pre-configure support for the corresponding language in the knowledge base
* The amount of retrieved content can be customized in node settings (e.g., return top 3 or top 5 results)

---

## Conclusion

:::tip
The **Knowledge Retrieval** node serves as a bridge between "user questions" and "intelligent answers."
:::

It not only provides factual evidence but also offers reliable semantic support for the agent's understanding and expression. In the XpertAI workflow, Knowledge Retrieval enhances your agent's contextual awareness and business expertise.

For more details on building and maintaining a knowledge base, refer to [Knowledge Base Management](/docs/ai/knowledge/).