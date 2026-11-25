---
title: List Operator
sidebar_position: 17
---

**List Operator Node** is a logic node in XpertAI Digital Expert Workflow used for batch data processing. It allows filtering, sorting, extraction, and other operations on list (array) type data within workflows, providing more precise data input for subsequent nodes.

---

## 1. Node Overview

In digital expert execution chains, data often appears as arrays or collections, such as:

* Multiple documents returned from knowledge retrieval;
* Lists of records from API responses;
* Batch computation results from upstream nodes.

The list operator node enables structured processing of input lists by configuring flexible conditions and rules, allowing the workflow to automatically perform data filtering, extraction, sorting, and more—enabling “data-driven intelligent branching decisions.”

---

## 2. Core Capabilities

### 1. Conditional Filtering (Filter By)

Supports filtering list elements with multiple conditions.
Users can configure several filter criteria and select the logical relationship:

* **AND**: Only elements meeting all conditions are retained;
* **OR**: Elements meeting any condition are retained.

This allows the node to dynamically filter list content at runtime based on variable or property values, automating the data filtering process.

**Typical use cases:**

* Filter products with prices below a specified threshold;
* Retain only tasks with status “pending”;
* Select high-confidence items from multiple retrieval results.

---

### 2. Element Extraction (Extract By)

Provides the ability to extract elements at specified positions by index.
Supports:

* Forward indexing (starting from the first element);
* Reverse indexing (e.g., `-1` for the last element).

**Example use cases:**

* Get the latest data entry in a list;
* Extract the first N or specific records for further processing.

---

### 3. Sorting (Sort By)

Supports ascending or descending sorting of lists based on specified variables.
When datasets include fields like time, value, or priority, sorting helps workflows automatically determine execution order.

**Example use cases:**

* Sort tasks from newest to oldest by time;
* Select the best result by descending weight;
* Sort API results before extracting the first item.

---

### 4. Top N

Allows retaining only the top N results.
Can be combined with sorting to select the “top N optimal items.”

**Example use cases:**

* Select the top 5 answers with the highest confidence;
* Get the latest 3 records;
* Retain key samples from analysis results.

---

## 3. Output Results

After execution, the node automatically generates multiple output variables for downstream nodes to reference:

| Output Variable   | Type    | Description                                 |
| ----------------- | ------- | ------------------------------------------- |
| `result`          | Array   | The complete result set after filtering, sorting, and truncation |
| `first_record`    | Single  | The first record in the result              |
| `last_record`     | Single  | The last record in the result               |
| `error`           | String  | Error message if execution fails            |

---

## 4. Typical Application Scenarios

### 🔹 Scenario 1: Retrieval Result Filtering

In knowledge Q&A or document recall flows, use the list operator node to filter out low-confidence answers and retain only high-quality candidates.

### 🔹 Scenario 2: Intelligent Sorting and Extraction

In recommendation systems, task scheduling, or financial analysis, sort results by weight, time, amount, etc., and extract the most relevant items.

### 🔹 Scenario 3: Preprocessing for Multi-Branch Decisions

Pre-filter data with the list operator to ensure that subsequent condition, loop, or aggregation nodes only process the target subset, improving execution efficiency.

---

## 5. Value in Workflows

The list operator node is the **“data processor” of digital expert workflows**, providing basic data logic capabilities.
With it, users can:

* Complete complex data filtering and sorting in a no-code interface;
* Reduce the need for custom logic scripts;
* Improve workflow adaptability in diverse data scenarios;
* Build more intelligent and decision-capable automated processes.

---

**Summary**:
The list operator node modularly integrates common data processing logic such as filtering, extraction, and sorting, making it a core component for building highly controllable and automated digital expert workflows. In combination with condition, loop, trigger, and other nodes, it enables XpertAI agents to autonomously complete the entire process from information filtering to decision execution in a data-driven manner.

