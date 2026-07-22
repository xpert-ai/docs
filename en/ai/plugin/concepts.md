---
sidebar_position: 2
title: Core Concepts of the Plugin System
---

In the Xpert AI plugin system, all plugins follow a unified interface specification and lifecycle management. Through a set of core concepts, developers can easily extend the host system's capabilities without modifying the core code.

---

### 2.1 XpertPlugin

`XpertPlugin` is the main entry interface for plugins, defining plugin metadata (`meta`), configuration (`config`), lifecycle methods, and module registration logic.

```ts
export interface XpertPlugin<TConfig extends object = any> 
  extends PluginLifecycle, PluginHealth {
  meta: PluginMeta;                       // Plugin metadata
  config?: PluginConfigSpec<TConfig>;     // Plugin configuration
  register(ctx: PluginContext<TConfig>): DynamicModule; // Register plugin module
}
```

* **meta**: Basic plugin metadata, including `name`, `version`, `category`, `icon`, `description`, etc.
* **config**: Defines the plugin's configuration schema (based on `zod`), supporting default values and UI form rendering.
* **register**: Returns a `DynamicModule` to mount the plugin to the main application (optionally as global).

---

### 2.2 Plugin Lifecycle

The plugin system provides a complete set of lifecycle hooks for each plugin, allowing developers to execute initialization or cleanup logic at different stages.

```ts
export interface PluginLifecycle {
  onInit?(ctx: PluginContext): Promise<void> | void;   // Called after module registration
  onStart?(ctx: PluginContext): Promise<void> | void;  // Called after app startup (services available)
  onStop?(ctx: PluginContext): Promise<void> | void;   // Called during graceful shutdown
}
```

* **onInit**: Suitable for resource initialization (e.g., loading configs, registering resource pools).
* **onStart**: Suitable for starting background tasks or service listeners.
* **onStop**: Suitable for cleaning up resources, closing connections, releasing caches.

---

### 2.3 Plugin Health Check

Plugins can implement the `checkHealth` method to report their running status, enabling unified health monitoring by the host system.

```ts
export interface PluginHealth {
  checkHealth?(ctx: PluginContext): Promise<{ status: 'up' | 'down'; details?: any }> 
}
```

* **status**: Running status (`up` or `down`)
* **details**: Optional dependency check details, such as API connectivity or database status

---

### 2.4 Plugin Context

`PluginContext` provides plugins with runtime access to the host system, including application context, logging service, and configuration.

```ts
export interface PluginContext<TConfig extends object = any> {
  app: INestApplicationContext;   // Nest runtime context
  logger: PluginLogger;           // SDK-provided logging wrapper
  config: TConfig;                // Final validated and merged config
  resolve<TInput, TResult>(token: any): TResult; // Dependency injection resolver
}
```

* **app**: NestJS's `INestApplicationContext`, allowing access to the DI container.
* **logger**: Unified logging interface, supporting `debug`, `log`, `warn`, `error`.
* **config**: Final config object after zod validation and merging defaults.
* **resolve**: Retrieve other providers from the NestJS container.

---

### 2.5 Plugin Configuration Specification

Each plugin can define a configuration specification to constrain and validate config parameters, usually implemented via a `zod` schema:

```ts
export interface PluginConfigSpec<T extends object = any> {
  schema?: ZodSchema<T>;       // Config validation schema
  defaults?: Partial<T>;       // Default config
}
```

* Supports **type safety** (zod type inference)
* Supports **default values** and **secure input** (e.g., API key secrets)
* The host system automatically renders the config UI based on the schema

---

### 2.6 XpertServerPlugin Decorator

`@XpertServerPlugin` is an enhanced [Nestjs Module](https://docs.nestjs.com/modules) class decorator, used to register plugins as NestJS modules and attach plugin metadata.

```ts
@XpertServerPlugin({
  imports: [ /* submodules */ ],
  providers: [ /* services, strategies */ ],
  controllers: [ /* controllers */ ],
  entities: [ /* database entities */ ],
})
export class FirecrawlPlugin { ... }
```

* Essentially extends NestJS's `@Module` decorator
* Supports registering submodules, services, controllers, entities, etc.
* The plugin thus becomes a complete NestJS dynamic module

---

### 2.7 Enhancement Points

Enhancement points are the key mechanism for plugins to extend the host system. The host system defines a series of strategy interfaces, and plugins can implement these interfaces and use decorators to be automatically discovered and registered.

#### IntegrationStrategy

Used to connect external systems or API services, such as Firecrawl, OpenAI, etc.

```ts
export interface IntegrationStrategy<T = unknown> {
  meta: TIntegrationProvider;  
  execute(integration: IIntegration<T>, payload: TIntegrationStrategyParams): Promise<any>;
}
```

* **meta**: Metadata for the integration provider (name, description, icon, etc.)
* **execute**: Executes the integration logic (e.g., calling external APIs)

Decorator:

```ts
@IntegrationStrategyKey('Firecrawl')
@Injectable()
export class FirecrawlIntegrationStrategy implements IntegrationStrategy<FirecrawlOptions> { ... }
```

#### DocumentSourceStrategy

Used to connect new data sources, such as web crawlers, file parsers, databases. Plugins only need to implement the corresponding interface to make the data source available to agents/BI.

---

### 2.8 Strategy Registry

All strategy classes (Integration, DocumentSource, etc.) are registered to the **strategy registry** via **decorators + NestJS dependency injection**.

For example, IntegrationStrategy:

```ts
@Injectable()
export class IntegrationStrategyRegistry 
  extends BaseStrategyRegistry<IntegrationStrategy> {
  constructor(discoveryService: DiscoveryService, reflector: Reflector) {
    super(INTEGRATION_STRATEGY, discoveryService, reflector);
  }
}
```

* `IntegrationStrategyRegistry` automatically discovers classes decorated with `@IntegrationStrategyKey`
* Plugins do not need to manually register strategies; implementing the interface and using the decorator is enough for system recognition

---

### 2.9 Plugin Resources and Initialization Targets

Besides code extension points, a plugin can also declare resources that the host can initialize after the plugin bundle is loaded. The host reads the current bundle definitions live and exposes a plugin-side initialization entry.

Resources are split by target:

* **Workspace**: initialize into a workspace for `Skills`, `MCP`, and `Apps`
* **Xpert**: initialize into an existing Xpert for `Hooks`

During initialization, the host maps resource definitions to real runtime objects and tracks installation state, runtime identifiers, definition versions, and whether an update is available. This means:

* Already initialized resources are recognized as installed and do not reappear in the selectable list
* When the plugin bundle changes, the host can surface stale definitions as updateable resources
* Resource state refreshes with the host instead of relying on a stale static cache

`assets/` are presentation metadata only. They are not installable resources.

---

### 2.10 Plugin Scope and Level

Plugin scope determines where a plugin instance is installed and who can see or manage it. Plugin level describes the type of platform capability the plugin provides. They are related, but they are not the same thing.

Common scopes:

| Scope | Scope key | Who can see it | Typical use |
| --- | --- | --- | --- |
| Organization | `<organizationId>` | One organization | Normal business plugins, organization-specific integrations, custom workflows |
| Tenant global | `global` or `tenant:<tenantId>:global` | All organizations inside one tenant | Tenant-wide defaults; may host organization-level or tenant-level plugins |
| System global | `system:global` | All tenants | Platform singleton plugins that provide system-wide modules, entities, or default capabilities |
| Built-in global | `builtin:global` | All tenants | Host-code fallback providers; not an installed plugin |

Runtime capability lookup follows this order:

```text
organization -> tenant-global -> system-global -> builtin-global
```

This means an organization plugin can override a tenant-global plugin, a tenant-global plugin can override a system plugin, and a system plugin can override only built-in host providers.

Xpert supports three plugin levels:

| Level | Capability and visibility | Administration | Runtime behavior |
| --- | --- | --- | --- |
| `system` | Platform singleton shared by all tenants | Super Admin in the Default tenant only | Install, update, and uninstall take effect after an API restart |
| `tenant` | May register process-level modules, controllers, providers, and TypeORM entities, but is visible only to its owning tenant | Super Admin in the owning tenant | Installed into that tenant's global scope; changes take effect after an API restart |
| `organization` | Normal organization or tenant-global business capabilities | Administrator of the target scope | Can load at organization or tenant-global scope |

Use `meta.level = 'tenant'` when a plugin registers Nest modules, controllers, TypeORM entities, or other process-level infrastructure but the product must serve only one customer tenant. A tenant-level plugin combines:

* **Process-level technical capabilities**: it can register server modules, routes, and entities like a system plugin.
* **Tenant-level product isolation**: plugin discovery, configuration, providers, strategies, frontend assets, and controller APIs are available only to the owning tenant.

Tenant-level plugins also follow these constraints:

* A plugin name can belong to only one tenant, preventing duplicate registration of controllers, entities, and process-level providers.
* A non-Default tenant uses `tenant:<tenantId>:global`; the Default tenant uses `global`.
* Controllers carry installation-scope metadata, and the host's global guard rejects requests from other tenants or organizations.
* Install and update stage a new version for the next API restart; uninstall also requires an API restart to remove the runtime module.
* The plugin must declare a stable `artifactNamespace` and derive database tables, controller routes, and other process-level identifiers from it.

Use `meta.level = 'system'` only for a true platform capability shared by every tenant. Most plugins that do not register process-level infrastructure should keep the default `organization` level. Regardless of level, plugin business tables should still persist and enforce tenant and organization boundaries where applicable.

---

📌 Summary:

* `XpertPlugin` defines plugin **metadata, configuration, and lifecycle**
* `XpertServerPlugin` registers plugins as **NestJS modules**
* **Enhancement points (Strategy)** are the core for plugins to extend host system functionality
* All plugins form extensible and maintainable modules via **lifecycle + strategy interfaces + config schema**
* Plugin resources can be initialized into **Workspace** or **Xpert** targets with tracked installation state
* Plugin scope controls installation placement, while level controls capability and lifecycle; a `tenant` plugin is a process-level plugin owned by one tenant
