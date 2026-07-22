---
sidebar_position: 9
title: Sandbox Jobs and Browser Runtime
description: Use Xpert's shared Browser Runtime for isolated plugin exports with built-in defaults and capability warnings.
---

# Sandbox Jobs and Browser Runtime

Sandbox Jobs run browser rendering, PDF/PPTX export, and document conversion in short-lived, resource-bounded environments. Chromium comes from Xpert's shared Browser Runtime—not the API image or the current interactive agent sandbox.

Presentation Studio PDF/PPTX export is the first product feature using this capability.

## Export experience

1. A user requests an export from the Workbench or an agent.
2. The plugin creates its export record and queues a browser-pool job.
3. Xpert starts a one-use Browser Runtime sandbox when capacity is available.
4. The plugin's Presentation Action runs with platform Playwright/Chromium.
5. Xpert validates the PDF/PPTX and writes it to the current Project or Xpert Workspace.
6. The export record exposes the download and the temporary container is reclaimed.

The original conversation need not remain active. System export can also remain enabled when interactive agent sandboxes are disabled.

## Interactive sandbox versus Sandbox Job

| Capability | Interactive agent sandbox | Sandbox Job |
| --- | --- | --- |
| Lifetime | Conversation/environment | One temporary instance per task |
| Scope | user/project/environment | job |
| Work | Interactive tools and commands | Registered background Action |
| Retry | Conversation-controlled | Managed Queue plus idempotent Job |
| Output | Current runtime workspace | Workspace Files portable reference |

Plugins do not receive arbitrary shell access. A run request names only an Action and version; it cannot supply an image, command, entrypoint, environment, Docker option, or host path.

## Shared Runtime, plugin-owned behavior

| Part | Owner | Example |
| --- | --- | --- |
| Sandbox Runtime Suite | Xpert platform | Image Catalog, version, release tooling |
| Browser Runtime | Xpert platform | Node, Playwright, Chromium, Noto fonts, Runner Host |
| Runtime Definition | Xpert OSS Runtime Suite | Profile name, fixed Runner, versions, resources, and security requirements; no Provider/image |
| Runtime Binding / Provider | Pro or community implementation | Maps a Definition to an immutable artifact and creates isolated instances |
| Sandbox Action Bundle | System plugin | Presentation Runner, pinned Dashi assets, Action manifest |

Plugins therefore do not maintain a Docker image for common browser work. Future Agent, Office, Python, or GPU images can use the same Runtime Suite release system as separate image families.

## Presentation Studio availability

HTML remains browser-free. PDF/PPTX expose structured Action health:

| Reason | Meaning | Operator action |
| --- | --- | --- |
| `ACTION_MISSING` | Matching Action is absent | Check plugin version/package |
| `ACTION_INVALID` | Manifest or bundle hash is invalid | Verify the final npm tarball, rebuild/reinstall the plugin, and restart API |
| `PROFILE_MISSING` | Browser Runtime Definition is absent | Upgrade the Xpert Runtime Suite |
| `RUNTIME_UNBOUND` | The API has no compatible Provider Binding | Install the Pro Docker Provider or an OSS/community Provider |
| `VERSION_MISMATCH` | Action and Runtime are incompatible | Upgrade or roll back one side |
| `PROFILE_UNHEALTHY` | Manifest or hardened smoke fails | Inspect digest and Provider logs |
| `PROVIDER_UNAVAILABLE` | A registered Provider cannot enumerate its Bindings | Inspect the Provider and execution-engine health |
| `WORKER_UNAVAILABLE` | The API browser-pool consumer is disabled or unhealthy | Restore the API queue consumer and Redis connection |

Do not download Chrome into API containers as an incident workaround; disable PDF/PPTX and preserve HTML instead.

## How an export request is accepted

Workbench and server-side export endpoints combine two independent readiness checks before creating a browser export record or queue job:

1. Sandbox Jobs `getActionHealth()` verifies the Action, Runtime Definition, API-local Binding, immutable artifact, Provider, and Runtime manifest.
2. Managed Queue `getExecutionPoolHealth({ executionPool: 'sandbox-browser' })` verifies that the browser execution pool has a live consumer.

PDF/PPTX is available only when both checks pass. The menu shows the most specific warning when either one fails, and the server repeats the check to prevent stale UI state from creating a permanently queued export. These checks are capability discovery, not settings users must configure.

After acceptance, the export can move through `queued`, capacity `waiting`, `starting`, `running`, and a terminal `succeeded`, `failed`, or `cancelled` state. Capacity waiting does not consume a retry. An idempotent retry returns an earlier success or reattaches to active work; only a new attempt may select another healthy Runtime Binding.

## Default enablement and production deployment

1. Publish a Sandbox Runtime Suite through the Xpert version release.
2. In Pro, register both the dedicated `DockerSandboxRuntimeProvider` and the separate interactive `DockerSandboxProvider` in the API process. OSS may install another public-SPI Provider distribution.
3. Let Provider release CI supply its immutable Runtime Suite lock; users do not configure image/profile/provider settings.
4. Verify Runtime, Action, API-local Provider health, and execution-pool health.

PDF/PPTX capability detection is enabled by default; there is no tenant feature switch. If any prerequisite is missing, the Workbench displays its structured warning, does not enqueue browser work, and keeps HTML available.

The OSS Compose files do not mount the Docker socket or pull Browser Runtime artifacts. Its API consumes the browser queue but has no production Binding, so health reports `RUNTIME_UNBOUND`. Pro keeps `DockerSandboxProvider` and `DockerSandboxRuntimeProvider` as separate strategy classes in the same Docker Sandbox module and registers both in API; they share the Docker engine layer, not lifecycle contracts. `xpert-plugins` contains no second Docker implementation package. The Pro module's `runtime-suite.lock.json` pins production artifacts as `repository@sha256:<digest>`; mutable tags and a `SANDBOX_BROWSER_RUNTIME_IMAGE` override are not accepted.

## Open source and Pro

| Distribution | Included by default | PDF/PPTX behavior |
| --- | --- | --- |
| OSS | Jobs Core, Runtime Definitions, Actions, Provider SPI, health evidence, files, and audit; no production Provider | Shows `RUNTIME_UNBOUND`; HTML remains available and no browser job is queued |
| Pro | OSS plus a dedicated DockerSandboxRuntimeProvider, shared Docker engine adapter, and immutable lock | API uses packaged defaults; PDF/PPTX becomes available automatically when artifact health is ready |
| Community | OSS plus a Podman/Kubernetes/remote Provider registered as system infrastructure | Determined by API-local Provider and Binding health |

Xpert does not substitute an unsafe local-process production Provider. OSS API containers do not receive Docker access; a Pro or community API receives only the engine access required by its installed Provider. Browser export is health-driven by default: unmet conditions display an actionable warning instead of a silently disabled menu. `RUNTIME_UNBOUND` means the API executor cannot supply a compatible Binding.

`Sandbox Action bundle hash mismatch` is not a missing deployment setting. It means the installed Action files differ from the hash recorded in its manifest. Action-owned dependencies must live in an ordinary directory such as `bundle/runtime-modules`, never nested `node_modules`, and release CI must run a real `npm pack`, extract the tarball, and recompute the hash from extracted content. Operators should upgrade or reinstall the fixed Presentation Studio package and restart the API to refresh the Action Registry; no image, profile, Provider, or `CHROME_PATH` environment variable is needed.

## Isolation, capacity, and files

The default Browser Runtime profile uses 2 CPU, 4 GiB memory, 1 GiB shared memory, 4 GiB temporary storage, a 300-second task timeout, and a 360-second hard deadline. Containers run non-root with a read-only root, dropped capabilities, no-new-privileges, and no public network by default. Only the current Job workspace is writable; plugin directories and host `node_modules` are never mounted.

Capacity defaults to 20 global, 4 per tenant, and 2 per user. Quota saturation remains `waiting` without creating a partial container or consuming a business retry.

Queue messages carry business identifiers. Handlers load immutable snapshots and pass persisted Workspace Files references with size and SHA-256. Xpert validates tenant and paths, persists validated output as portable references, and keeps buffers/base64 out of queue state.

## Retry, cancellation, and boundaries

Stable business IDs plus immutable checksums reuse prior success or reattach to active work. Capacity-service, Provider startup, browser launch, timeout, and OOM failures are retryable. Action/Profile/version, invalid input, and invalid output are deterministic and are not retried.

Cancellation stops both the Managed Queue work and an active Sandbox Job. Success, failure, and cancellation reclaim containers and Job volumes; orphan cleanup handles platform crashes.

Current boundaries: v1 actions are system-plugin only, every export gets a fresh container, aggregate input and output are limited to 350 MiB each, runtime dependency installation is forbidden, and `CHROME_PATH`/local backend remain development-test compatibility only.

Plugin developers should use the Sandbox Action Bundle reference in the Xpert Plugin Development skill.
