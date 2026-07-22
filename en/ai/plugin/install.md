---
sidebar_position: 5
title: Publish & Use
---

After developing your plugin, the final step is to publish it to npm and enable it in the host system (Xpert AI).

## Publish Plugin

Run the following commands in the monorepo root directory:

```bash
# Build the plugin
npx nx build my-plugin

# Use the monorepo's release workflow
npx nx release

# Or manually publish to npm
npx nx run @xpert-ai/my-plugin:nx-release-publish --access public --otp=<one-time-password-if-needed>
```

Once published, you'll get an installable package on npm, for example:

```
@xpert-ai/my-plugin
```

## Use Plugin

In the Xpert AI host system, declare the list of enabled plugins using the `PLUGINS` environment variable. Separate multiple plugins with commas:

```bash
PLUGINS=@xpert-ai/my-plugin1,@xpert-ai/my-plugin2
```

When the host starts, it will automatically parse the `PLUGINS` environment variable and load these plugins in order.

**Notes**:

* The host project should install the plugin packages via npm/yarn/pnpm (`npm install @xpert-ai/my-plugin`) and configure the plugin list in the environment variable.
* The plugin's `meta.name` must match the npm package name.
* If a plugin fails to load correctly, check the logs for `register` or `onPluginBootstrap` output.
* After starting the Xpert AI system, you can view the loaded plugins on the system settings [Plugins page](https://app.xpertai.cn/settings/plugins).

## Installation Scope

Every installed plugin has an explicit level and scope. Level controls capability and lifecycle; scope controls installation placement:

| Level | Installation scope | Who can manage it | Who can use it |
| --- | --- | --- | --- |
| `organization` | Current organization, or the current tenant's global scope | Administrator of that scope | Current organization, or current tenant |
| `tenant` | `global` or `tenant:<tenantId>:global` | Super Admin in the owning tenant | Owning tenant only |
| `system` | `system:global` | Super Admin in the Default tenant | Every tenant |

**Tenant level** means more than installing a normal plugin into tenant-global scope. The plugin may register system-level technical capabilities such as controllers, TypeORM entities, and process-level providers, while product ownership and access remain limited to one tenant.

### Install a Tenant-Level Plugin

Before installation, verify that runtime `meta` and `package.json` declare the same level and namespace:

```json
{
  "xpert": {
    "plugin": {
      "level": "tenant",
      "artifactNamespace": "contract_review"
    }
  }
}
```

Installation flow:

1. Sign in as a Super Admin of the target tenant.
2. Open the Plugins page in tenant administration scope and install the package.
3. Restart the API service when the installation result requests it.
4. Return to the target tenant and verify plugin status, configuration, Workbench views, and APIs.
5. Switch to another tenant and verify that the plugin and business entry points are absent; direct plugin API requests must be denied.

Tenant-level plugins use these safeguards:

* A plugin name can belong to only one tenant; a second tenant cannot install another copy.
* Install and update stage the artifact, and the new controllers, entities, and providers load after an API restart.
* Uninstall first deactivates the persisted registration; runtime removal completes after an API restart.
* Only a Super Admin in the owning tenant can manage its configuration.
* `artifactNamespace` must remain stable to prevent table, route, and registry collisions with other process-level plugins.

### Migrate from System Level to Tenant Level

Do not change a plugin directly from system to tenant level while the old system registration is active. That could register two copies of process-level modules. Use this sequence:

1. In the Default tenant, have a Super Admin uninstall the old system plugin.
2. Restart the API and verify that the old runtime module has been removed.
3. Publish or prepare a new plugin version that declares `level = 'tenant'`.
4. Install the new version as a Super Admin in the target tenant.
5. Restart the API again to activate the tenant-level plugin.
6. Validate business data and configuration in the target tenant, then run a cross-tenant isolation check.

Back up existing plugin configuration before migration. A system instance and a tenant instance have different owners and scopes, so the platform does not automatically copy every system configuration value into the target tenant.

At runtime, the platform resolves plugin capabilities in this order:

```text
organization -> tenant-global -> system-global -> built-in
```

So organization or tenant plugins can intentionally override a system default without creating a second system instance.

## Initialize Plugin Resources

Loading a plugin into the host is only the first step. The host can also initialize the resources declared inside the plugin bundle into the target runtime.

On the Plugins page, the installed plugin card exposes a resource initialization action. Opening it launches a dialog that reads the current bundle definitions live, rather than relying on a stale cached list.

Resources are split into two targets:

* **Workspace**: initialize into a workspace for `Skills`, `MCP`, and `Apps`
* **Xpert**: initialize into an existing Xpert for `Hooks`

The dialog groups resources by type and shows their current state:

* Already initialized resources are marked as installed and cannot be selected again
* If the plugin bundle changes, the dialog can surface stale definitions as updateable resources
* `assets/` are bundle metadata and presentation assets, not installable resources

After initialization, the host binds the resource to the actual runtime object and updates the corresponding middleware, toolset, or connector state in the workspace or Xpert.
