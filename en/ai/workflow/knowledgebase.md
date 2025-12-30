---
title: Document Knowledge Base
sidebar_position: 45
---

## Node Overview

The Knowledge Base Node is a core processing component in the XpertAI knowledge pipeline. It is responsible for formally incorporating content processed by upstream nodes (such as document sources, document conversion, chunking, image understanding, etc.) into the knowledge base system. Through mechanisms like embedding vectorization, model indexing, and task tracking, it enables the persistence and retrieval of knowledge data.

This node is the "landing stage" of the entire knowledge pipeline, determining whether knowledge content can be efficiently stored, quickly recalled, and support subsequent Q&A, analysis, and agent reasoning.

## Core Features

### 1. Knowledge Ingestion and Vector Indexing

The Knowledge Base Node automatically receives structured documents from upstream nodes (including text, chunking results, image recognition content, etc.) and embeds them into the designated vector database.
During this process, the system invokes the configured **Embedding Model** to convert document content into semantic vectors, enabling semantic similarity search.

This step is key to making the knowledge base intelligent, allowing AI to understand semantic relationships between content, rather than relying solely on keyword matching.

### 2. Model Configuration and Knowledge Base Synchronization

The Knowledge Base Node is tightly bound to the knowledge base entity. The models specified in the node configuration (such as embedding models, rerank models, vision models) are automatically synchronized to the knowledge base settings when the pipeline is published.

* **Embedding Model**: Generates knowledge vectors.
* **Rerank Model**: Improves the ranking accuracy of recall results.
* **Vision Model**: Enhances visual understanding and semantics when the knowledge base contains image content.

This design ensures consistency between pipeline orchestration and knowledge base behavior, automating and unifying model configuration.

### 3. Concurrent Processing and Task Monitoring

During the embedding stage, the Knowledge Base Node processes multiple documents in parallel and monitors the processing status of each document (such as "processing", "completed", "error", "cancelled", etc.).
The system has a built-in task tracking mechanism that records in real time:

* Document processing progress
* Number of embedded vectors and batch progress
* Error information and retry status
* User-initiated task cancellations

With visual statistics and log outputs, users can clearly understand the execution status and resource consumption of knowledge ingestion.

---

### 4. Token and Resource Usage Statistics

Each time a document is embedded, the system automatically estimates token consumption based on content length and synchronizes usage records to the corresponding model provider (Copilot Provider).
This is used not only for billing management but also helps enterprises monitor model resource usage efficiency and provides a basis for future optimization.

---

### 5. Validation and Publishing

When the pipeline is saved, the Knowledge Base Node automatically performs configuration validation:

* Checks whether input nodes are correctly configured and not duplicated;
* Validates that an embedding model and its provider are specified;
* Verifies the completeness of rerank and vision model configurations.

Only nodes that pass validation can be published, ensuring consistency between the knowledge base settings and the pipeline, and preventing missing configurations or unavailable models in production.

## Summary

The Knowledge Base Node is the "intelligent ingestion hub" of the XpertAI knowledge pipeline. It not only completes the key step of knowledge vectorization, but also handles model configuration synchronization, task management, and data consistency.
Through this node, XpertAI achieves the critical leap from "document data" to "intelligent knowledge", providing efficient, controllable, and traceable infrastructure for enterprise knowledge management and multi-agent collaboration.
