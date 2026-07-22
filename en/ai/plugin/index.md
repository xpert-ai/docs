---
sidebar_position: 12
title: 🧩 Plugin Development
---

### [1. Overview](./overview)

* Goals and design philosophy of the plugin system
* Why plugin architecture: flexible extension, modular decoupling, ecosystem building
* Applicable scenarios for plugin development

### [2. Core Concepts of the Plugin System](./concepts)

* **XpertPlugin**: Entry definition of a plugin
* **Enhancement Points**: Mounting points for plugins to extend system functionality
* **Plugin Lifecycle**: `register`, `onStart`, `onStop`, `onPluginBootstrap`, `onPluginDestroy`
* **Configuration Schema**: Plugin configuration definition based on `zod`
* **Strategy Pattern**:

  * Integration Strategy (system integration strategy)
  * Document Source Strategy (document data source strategy)

### 3. Plugin Directory Structure

* Explanation of plugin package.json
* Typical directory structure (`plugin.ts`, `*.strategy.ts`, `*.controller.ts`, `*.service.ts`)
* Dependency relationship between plugin and host system

### [4. Plugin Development Steps](./develop)

1. **Initialize the plugin**: Define plugin metadata (`meta`) and configuration (`config`)
2. **Register plugin modules**: Use the `@XpertServerPlugin` decorator
3. **Implement Integration Strategy**: Define external service integration
4. **Implement Document Source Strategy**: Define data source integration
5. **Provide services and controllers**: Expose REST API / service methods
6. **Write test cases**

### [5. MCP Tools and MCP Apps](./mcp-tools-and-apps)

* Ship plugin-managed MCP servers through `.xpertai-plugin/plugin.json`
* Expose model-visible MCP tools and app-only tools
* Return `ui://` MCP App resources for ChatKit inline rendering

### Platform Runtime Capabilities

* Use [Managed Queues](./managed-queues) for platform-owned background scheduling and retries
* Use [Sandbox Jobs](./sandbox-jobs) for registered heavyweight actions that require an isolated Runner, such as Chromium export
* Combine both with portable Workspace Files references instead of queueing raw buffers

### [6. Plugin Example: Feishu Docs Integration](./feishu-document-example/index)

* Introduction to the Feishu Docs plugin
* Configuration example
* Code breakdown (meta, IntegrationStrategy, DocumentSourceStrategy, Controller)
* Complete workflow for loading document data

### 7. Plugin Lifecycle and Events

* Plugin registration → startup → destruction
* Logging and debugging methods
* How to manage plugin state

### 8. Best Practices for Development

* Plugin decoupling and reuse
* Plugin configuration and security (key, API Key management)
* Error handling and exception isolation
* Logging and observability

### [9. Publishing and Usage](./install)

* Plugin packaging and version management
* Plugin installation and activation
* Plugin update and uninstallation

### 10. Frequently Asked Questions (FAQ)

* How to manage dependencies between plugins and host services?
* How to register database entities in plugins?
* How to call external APIs in plugins?
* Can plugins be loaded and unloaded dynamically?
