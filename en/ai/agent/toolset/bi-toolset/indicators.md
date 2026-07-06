---
title: Indicator Management
sidebar_position: 3
---

<Tip>
**PRO** This feature is available in the **Professional Edition**.
</Tip>

## 1. Overview

**XpertAI Indicator Management Toolkit** is a set of agent tools designed for large language models, aiming to achieve **semantic-driven indicator management automation**. By integrating this toolkit, agents can understand users' natural language instructions and perform operations such as creating, editing, and retrieving indicators in data analytics platforms.

### 🌐 Background

In traditional BI or data platforms, indicator management is cumbersome, requiring manual configuration and cross-team communication. With this toolkit, agents can automatically execute indicator operations supported by semantic models, significantly lowering the operational threshold and improving efficiency.

### 💡 Core Capabilities

* **Project Switching**: Automatically switch workspaces or business domains
* **Indicator Discovery**: List relevant indicators through semantic understanding
* **Indicator Creation**: Generate basic or derived indicators based on descriptions
* **Indicator Maintenance**: Support editing and deleting indicators
* **Context Awareness**: Link data cubes and dimension information to assist indicator construction

This toolkit can be seamlessly integrated into existing data systems, empowering agents with data governance capabilities and enabling intelligent, standardized, and low-threshold indicator operations.

---

## 2. Quick Start

### ✅ Prerequisite: Select a BI Project

Before using the indicator management toolkit, you need to configure a [**BI project**](/docs/stories/project/) for the agent, which is used for unified indicator naming, dimension structure, and business context language understanding. The BI project should meet the following criteria:

* A project registered on the platform (e.g., a data project for a specific business domain).
* Associated with semantic model information such as data cubes containing measures and dimensions.
* Parsable by the large model and usable as inference context.

The tool used by the large model for this feature is:
- **`SWITCH_PROJECT`**: Switch the current workspace or project

---

## 3. Indicator Management Functions

> Each tool is described separately, including purpose, parameters, return structure, and usage examples.

* `LIST_INDICATORS`: List all indicators under the project
* `CREATE_DERIVE_INDICATOR`: Create a derived indicator
* `CREATE_BASIC_INDICATOR`: Create a basic indicator
* `EDIT_INDICATOR`: Edit an existing indicator
* `DELETE_INDICATOR`: Delete a specified indicator

Below are the core operation tools in the indicator management toolkit. Each tool can be invoked by the agent to perform the corresponding indicator operation:

### 🔍 `LIST_INDICATORS` — List All Indicators

Used to obtain a list of all indicators in the current project, with optional filtering (e.g., by type, namespace, tag, etc.).
**Typical Use Cases:**

* Browse existing indicators
* Help users select target indicators
* Provide candidates for subsequent agent operations

> 🧠 Example Task:
> "What indicators do we currently have related to user behavior?"

### ➕ `CREATE_BASIC_INDICATOR` — Create Basic Indicator

Used to create **basic indicators** directly from raw data, such as field aggregations (sum, count, max, etc.) and basic measures under certain conditions.

**Typical Use Cases:**

* Define atomic business indicators, such as "order count" or "page views"
* Establish a unified indicator specification entry

> 🧠 Example Task:
> "Create a basic indicator to count order volume"
> "Create a basic indicator to count order volume for product XX"

### ➕ `CREATE_DERIVE_INDICATOR` — Create Derived Indicator

Used to build **derived indicators** based on existing indicators, supporting custom calculation logic, conditions, numerator/denominator expressions, etc.

**Typical Use Cases:**

* Build composite indicators, such as conversion rate or year-over-year growth rate
* Support higher-level indicator expressions in semantic modeling

> 🧠 Example Task:
> "Create an indicator to calculate the proportion of active users this month"

### ✏️ `EDIT_INDICATOR` — Edit Existing Indicator

Used to modify properties of an existing indicator (by code), such as name, expression, business domain, or business definition.

**Typical Use Cases:**

* Update indicator definitions
* Fix errors or adjust business meaning

> 🧠 Example Task:
> "Change the definition of user retention rate to be based on registration date"

### ❌ `DELETE_INDICATOR` — Delete Specified Indicator

Used to delete a specified indicator from the current project, supporting location by code.

**Typical Use Cases:**

* Clean up unused or incorrectly defined indicators
* Keep the indicator system tidy

> 🧠 Example Task:
> "Delete the indicator with code 'temporary_indicator_1'"

---

## 4. Using Indicator Functions

* `INDICATOR_RETRIEVER`: Retrieve indicator details by name/ID
* `SHOW_INDICATORS`: Structurally display certain types of indicators
* `GET_CUBE_CONTEXT`: Get data cube context related to indicators
* `DIMENSION_MEMBER_RETRIEVER`: Get dimension member information (e.g., values of enumerated dimensions)

### 📄 `INDICATOR_RETRIEVER` — Retrieve Indicator Details

Used to get the complete definition of an indicator by name or ID, including indicator expression, dependent fields, associated cube, creator, and other metadata.
**Typical Use Cases:**

* Query detailed information of a single indicator
* Enable agents to generate explanations or validate indicator definitions
* Support further editing or derivation

> 🧠 Example Task:
> "Tell me the definition of 'active user ratio'"

### 🧾 `SHOW_INDICATORS` — Structured Display of Indicators

Used to display indicator lists in a structured way, supporting grouping by category, tag, model, usage, etc.
**Typical Use Cases:**

* Browse the indicator system with high readability
* Present panel-style indicator information to users
* Enable agents to generate visual structures or summary descriptions

> 🧠 Example Task:
> "Show me all indicators related to user growth"

### 🧠 `GET_CUBE_CONTEXT` — Get Indicator Data Cube Context

Used to get the data cube and its structure information associated with an indicator, such as available dimensions, measures, granularity, etc.
**Typical Use Cases:**

* Provide context information for indicator creation
* Determine whether an indicator can be analyzed by a certain dimension
* Generate semantic support information for indicator expressions

> 🧠 Example Task:
> "Can this indicator be analyzed by region and time dimensions?"

### 🧩 `DIMENSION_MEMBER_RETRIEVER` — Get Dimension Member Information

Used to get all members (values) under a dimension, often for enumerated dimensions such as region, channel, user type, etc.
**Typical Use Cases:**

* Support creating conditional indicator expressions
* Help agents generate selection options for users
* Enable semantically enhanced filtering and classification

> 🧠 Example Task:
> "List all user types for me"

---

## 5. Agent Usage Guide

* [How to register tools in the agent](/docs/ai/xpert/#如何使用工具)
* How to trigger tools via Prompt or Action
* Use LLM to generate structured calls

## 7. Error Handling & Debugging

* Common error codes and their meanings
* Suggested handling strategies for failed calls
* Log tracing and troubleshooting advice

## 8. FAQ

## 9. Changelog

- v3.4 Initial version.
