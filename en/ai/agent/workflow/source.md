---
title: Document Source
sidebar_position: 41
---

In the **XpertAI Knowledge Pipeline**, the **Document Source Node** is the starting point of the knowledge acquisition phase. It is responsible for **automatically loading document content** from various data sources and injecting this content into the knowledge processing workflow, serving as the first step for knowledge to enter the system.

---

## 1. Core Features

### 1. Multi-Source Integration

The Document Source Node supports integration with multiple external data sources through a **Plugin Strategy**. Each data source type exists as an independent plugin, which can be developed by XpertAI or third-party developers. Common data sources include:

* **File Upload**: Local files such as PDF, Word, TXT, Markdown, etc.
* **Cloud Storage**: Services like Google Drive, OneDrive, Alibaba Cloud Drive, etc.
* **Online Documents**: Platforms like Notion, Feishu Docs, Confluence.
* **Web Scraping**: Tools like Firecrawl, Jina Reader.
* **API Data Sources**: Fetching structured or semi-structured content via external system APIs.

Each plugin can define its own authorization method (API Key, system integration) to securely access the data source.

---

### 2. Intelligent Document Loading & Task Management

When the pipeline reaches the Document Source Node, the system will, according to the node configuration:

* Automatically invoke the corresponding plugin to load documents;
* Generate a unique knowledge document object for each document;
* Attach it to the current Knowledge Task for unified management.

Loaded documents can be in **Preview Mode** (testing phase) or **Production Mode** (after publishing). In preview mode, the system only extracts a small amount of content for display, allowing users to verify the document source and content parsing.

---

### 3. Seamless Integration with Knowledge Base

The output of the Document Source Node is directly passed to subsequent nodes in the knowledge pipeline (such as document conversion, content extraction, index building, etc.). Between nodes, document information is transmitted in a standardized data structure (including `metadata`, `pageContent`, `mimeType`, etc.), ensuring compatibility and extensibility across nodes.

---

### 4. Plugin-Based Strategy Extension

Each document source type corresponds to an independent **Document Source Strategy**, dynamically loaded by the plugin system. Plugins can define:

* Configuration parameters for the source (such as API endpoint, authentication method, file path, etc.);
* Document extraction logic (including pagination, content segmentation, metadata parsing);
* Authorization rules and integration permissions.

With this strategy mechanism, developers can quickly extend new data source types without modifying the core framework.

---

### 5. Error Handling & Workflow Control

The Document Source Node features comprehensive exception handling and status update mechanisms during document loading:

* If data source connection fails or document parsing errors occur, errors are automatically logged and the task is marked as "failed";
* The pipeline can automatically switch to a fallback path (such as a Fail branch) based on error status;
* Supports error retries and manual intervention to ensure stable task execution.

---

## 2. Typical Use Cases

1. **Enterprise Knowledge Aggregation Center**

   * Regularly fetch documents from various business systems (OA, CRM, ERP);
   * Automatically import into the knowledge base to build a unified internal knowledge source.

2. **AI Document Q&A System**

   * Periodically sync with external knowledge bases like Confluence, Notion;
   * Automatically extract content for ChatBI or Copilot to perform knowledge Q&A.

3. **Compliance & Archive Auditing**

   * Automatically obtain PDF contracts and approval documents from cloud drives or contract systems;
   * Convert them into standardized document formats for auditing and AI-assisted analysis.

4. **Website Content Aggregation & Summary Generation**

   * Regularly crawl news, announcements, or blog content via web scraping plugins;
   * Generate summaries, tags, or classification indexes with downstream nodes.

---

## 3. Advantages & Value

| Feature         | Description                                      |
| --------------- | ----------------------------------------------- |
| **Scalability** | Quickly integrate any new data source via plugins|
| **Security**    | Supports both environment variable and system integration authorization |
| **Automation**  | Periodically sync documents without manual intervention |
| **Standardization** | Unified document structure for easy conversion and indexing |
| **Flexibility** | Combine with other nodes to build complex knowledge pipelines |

## 4. Summary

The **Document Source Node** is the entry point of the XpertAI Knowledge Pipeline, enabling organizations to flexibly and securely integrate various documents and data into their knowledge system. Through a plugin-based strategy, it not only supports standard file types but also seamlessly integrates cloud, API, or web data sources, laying a solid foundation for subsequent knowledge processing, indexing, and retrieval.

This empowers XpertAI to truly become a **cross-system, cross-format, cross-ecosystem knowledge automation hub**.
