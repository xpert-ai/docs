---
title: Semantic Modeling
sidebar_position: 2
---

<Tip>
**PRO** This feature is available in the **Professional Edition**.
</Tip>

## Background

In traditional data analytics platforms, data modeling has always been a high-barrier task that heavily relies on manual expertise. Data engineers often need to manually design models, configure dimensions, define measures, and more—making the process inefficient and error-prone.  
To improve modeling efficiency and lower the entry barrier, we have built a set of **Semantic Model Tools** on the **XpertAI Agent Platform**, aiming to assist users in constructing and maintaining multidimensional data models with the help of intelligent agents.

This toolset is seamlessly integrated with the **XpertAI Data Analytics Platform** and can be used in conjunction with modules such as ChatBI, intelligent Q&A, and indicator management, providing an end-to-end experience from model building, debugging, and previewing to intelligent analysis.

#### 🌟 Value Proposition

* ✅ **AI-assisted Modeling**: Leveraging LLM capabilities, users only need to describe their business scenario, and the agent will recommend and generate the initial modeling structure (such as dimensions, indicators, hierarchies, etc.)
* ✅ **Self-service Modeling Portal**: Build Cubes via visual or semantic operations—no deep SQL skills required to define analytical models
* ✅ **Modeling-Analysis Linkage**: Instantly preview model results to quickly validate modeling configurations
* ✅ **Cost Reduction & Efficiency**: Reduce over 70% of repetitive modeling workload, enabling more analysts to perform "light modeling"
* ✅ **Unified Modeling Interface**: Modular and service-oriented tool functions, connectable to external systems or workflow orchestration

#### 📌 Use Cases

* In intelligent Q&A systems, automatically build or adjust data models based on questions (e.g., add missing dimensions, create calculated indicators)
* When launching new business indicators, automatically create multidimensional analysis models via ChatBI
* Analysts describe business logic in natural language, and the agent generates and deploys the model
* In data governance scenarios, assist in maintaining model consistency and traceability

## Tool Overview

### 1. Switch Workspace `switch_model_workspace`

This tool is used to **switch to a specified semantic model workspace** or **create a new workspace and initialize its state** during the intelligent modeling process. This is the first step in modeling, ensuring that subsequent operations (tables, Cubes, dimensions, etc.) are performed in the correct model context.

It calls backend services to initialize or load the model workspace and synchronizes the current model state to the context for subsequent operations.

Typical use cases:

* Start a new modeling task by creating a brand-new model workspace
* Switch to an existing model for adjustment or extension
* Prompt the user via the agent to specify or create a model

### 2. List Physical Tables `list_tables`

This tool **lists all physical tables in the data source associated with the current semantic model**. It is useful at the start of modeling to help users understand the available table structures, serving as the basis for subsequent modeling (such as selecting tables to build Cubes, defining dimensions, etc.).

The tool queries the underlying data source (e.g., database, data lake) based on the model's `modelId` and `catalog/schema` information and returns a list of tables.

### 3. List Table Schema `list_table_schema`

This tool **views the field (column) structure of a specified table**, including field names, data types, etc., helping users understand the table structure for modeling (such as building dimensions or measures).

#### 🧾 Input Parameters

| Name         | Type     | Description           |
| ------------ | -------- | --------------------- |
| `tableName`  | `string` | Name of the table     |

#### 📤 Output

Returns the field structure information (name, type, comment, etc.) of the selected table, including:

* Readable JSON format (for agent presentation)
* Raw structure data (for UI use)

### 4. List Cubes `list_cubes`

This tool **lists all defined Cubes in the semantic model workspace**, helping the LLM understand the core analytical units in the current modeling context for subsequent modeling-related tool calls (such as reading Cubes, editing dimensions, measures, etc.).

The tool extracts all defined Cubes from the model draft (`draft.schema.cubes`) and returns their `name`, `caption`, and `description`.

#### 🧾 Input Parameters

| Name       | Type     | Description                                                                 |
| ---------- | -------- | --------------------------------------------------------------------------- |
| `modelId`  | `string` | Optional. Specifies the semantic model workspace ID. If omitted, uses context. |

#### 📤 Output

Returns two parts (for LLM use):

* `content`: Formatted JSON string with basic info of all Cubes
* `artifact`: Structured data array for downstream toolchains

Example:

```json
[
  {
    "name": "Sales",
    "caption": "Sales Cube",
    "description": "Cube for sales analysis"
  },
  {
    "name": "Inventory",
    "caption": "Inventory Cube",
    "description": "Cube for stock tracking"
  }
]
```

### 5. Read Cube `read_cube`

This tool **reads the definition of a specified Cube**, including its dimensions, measures, hierarchies, etc., helping the LLM understand a specific analytical subject in the current semantic model.

The tool looks up the target Cube in the model draft of the current workspace, returns the complete structure, and triggers a Cube message event for dashboard display.

#### 🧾 Input Parameters

| Name         | Type     | Description           |
| ------------ | -------- | --------------------- |
| `cube_name`  | `string` | Name of the Cube      |

#### 📤 Output

Returns the complete definition of the target Cube (JSON string + raw object) for further reasoning or editing recommendations.

### 6. Edit Shared Dimension `edit_dimension`

This tool **creates or updates a shared dimension in the semantic model**. If the dimension name matches, it updates; otherwise, it creates a new one.

It allows the LLM to define dimension properties (name, type, description, hierarchies, etc.) via structured parameters, automatically validating completeness and correctness to ensure safe inclusion in the model draft.

After completion, it updates the model draft and generates a link for UI navigation to the dimension management page.

#### ✅ Features

* Automatic validation of dimension structure (missing attributes, conflicting hierarchies, etc.)
* Update existing dimensions (by name match)
* Visual link for navigation to dimension management

### 7. Edit Hierarchy `edit_hierarchy`

Used to **create or update a hierarchy under a specified shared dimension**. Determines add or update by name. The tool automatically validates the hierarchy definition to ensure semantic model consistency.

After completion, updates the model state and generates a link and message for navigation to the hierarchy details.

#### Input Parameters

* `dimension_name`: Name of the parent dimension
* `hierarchy`: Hierarchy object definition

### 8. Edit Cube `edit_cube`

Used to create or update a Cube in the semantic model. Determines add or update by name. The tool validates the Cube for structural correctness.

After completion, resets the Cube's vector embedding, triggers an update event, refreshes the model state, and returns a success message.

#### Input Parameters

* Complete Cube definition (conforming to `CubeSchema`)

### 9. Edit Measure `edit_measure`

The `EDIT_MEASURE` tool is used to create or update a measure in a specified Cube.

It loads the current semantic model draft, inserts or updates the measure definition, and validates the configuration.

After completion, triggers a notification event and returns the updated model state and a success message.

**Input Parameters**:

* `cube_name`: Target Cube name
* `measure`: Measure details

**Function**: Manage measure definitions within a Cube for flexible maintenance.

### 10. Edit Calculated Member `edit_calculated_member`

The `EDIT_CALCULATED_MEMBER` tool is used to batch create or update calculated members in a specified Cube—i.e., dynamic measures defined by formulas and queries.

Main steps:

* Process each calculated member, fix and validate formulas
* Execute test queries to confirm correctness
* Write calculated members to the model draft and validate
* Update model state and send a success notification

**Input Parameters**:

* `cube_name`: Target Cube name
* `calculated_members`: Array of calculated members, each with name, formula, validation query, etc.

**Function**: Easily define and maintain formula-based calculation measures, enhancing model expressiveness and analytical depth.

### 11. Edit Calculation Measure `edit_calculation`

The `EDIT_CALCULATION` tool is used to create or edit calculation properties (calculation measures) in a specified Cube.

Core functions:

* Add or update calculation definitions in the semantic model
* Validate calculation properties for compliance and correctness
* Update model state and send a success notification

Input parameters include:

* `cube_name`: Target Cube name
* `calculation`: Object with calculation property details

This tool helps manage calculation logic in Cubes, supporting flexible definition of complex business calculations and enhancing analytical capabilities.

### 12. Edit Parameter `edit_parameter`

The `EDIT_PARAMETER` tool is used to create or edit parameters in a specified Cube.

* Supports batch add or update of multiple parameters in a Cube
* Strictly validates each parameter for compliance and effectiveness
* Updates parameter definitions in the model draft and synchronizes the latest model state
* Sends a success notification for frontend display and tracking

#### Input Parameters:

* `cube_name`: Target Cube name
* `parameters`: Array of parameters, each conforming to `BaseParameterSchema` (name, type, default value, description, etc.)

Suitable for dynamically adjusting or extending Cube parameter configurations in the semantic model to meet flexible calculation and filtering needs.

This tool provides a convenient parameter management interface for data modeling, enhancing model flexibility and maintainability.

### 13. Edit Virtual Cube `edit_virtual_cube`

The `EDIT_VIRTUAL_CUBE` tool is used to create or edit a virtual Cube, enabling flexible expansion and management of multidimensional data models by adding, deleting, or modifying virtual Cube definitions.

* **Create or update virtual Cubes**: Add new or edit existing virtual Cubes by name
* **Automatic validation**: Use `VirtualCubeValidator` to check completeness and compliance, ensuring data quality
* **Synchronize model state**: Automatically update the latest semantic model state and broadcast operation messages
* **Reset virtual Cube embedding cache**: Ensure data consistency and new definitions take effect
* **Wait for data source confirmation**: Ensure query validity and stability

#### Input Parameters:

* `VirtualCube` object with name, dimensions, measures, sources, etc., conforming to `VirtualCubeSchema`

Ideal for scenarios requiring new analytical views based on existing physical Cubes, such as data marts, custom reports, multi-source fusion analysis, etc., enhancing model reuse and extensibility.

### 14. Dimension Member Retriever `model_dimension_member_retriever`

The `DIMENSION_MEMBER_RETRIEVER` tool is used to query key information of dimension members in a specified multidimensional data model, supporting precise retrieval via dimension, hierarchy, and level filters for data filtering and analysis.

#### Main Functions:

* **Retrieve dimension member info** in a specified model and Cube, query by member name or wildcard `*`
* Support filtering by **dimension**, **hierarchy**, and **level**, automatically validating attribute existence for legal queries
* **Dynamically trigger dimension member embedding** if not cached or forced, ensuring accurate and complete retrieval
* Call backend `DimensionMemberService` to fetch data and format results as strings for display and further use

#### Input Parameters:

* `modelId`: Data model ID
* `cube`: Cube name
* `member`: Member name to retrieve, supports exact or wildcard `*`
* `dimension` (optional): Dimension name, e.g., `[dimensionName]`
* `hierarchy` (optional): Hierarchy name, e.g., `[hierarchyName]`
* `level` (optional): Level name, e.g., `[hierarchyName].[levelName]`
* `topK` (optional): Max number of results
* `re_embedding` (optional, default false): Force re-embedding for updated vector representations

#### Use Cases:

* Data filtering and conditional selection in reports and analysis based on dimension members
* Interactive drill-down and data exploration in multidimensional models
* Ensure dimension member info is consistent with the model, auto-maintain embedding for accuracy

### 15. Get Cube Runtime Context `get_cube_runtime_context`

The `GET_CUBE_RUNTIME_CONTEXT` tool retrieves the runtime context of a specified Cube, mainly including its dimensions, measures, hierarchies, and other structured data.

### 16. Preview Cube `preview_cube`

The `PREVIEW_CUBE` tool previews the data content of a specified Cube, helping users quickly verify whether the Cube's structure and data meet expectations.

## Version Control & Changelog

- v3.4 Initial version.
