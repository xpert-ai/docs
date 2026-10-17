# XpertAI Docs

## Generate Navigation

Generate or update the `docs.json` navigation configuration based on the folder structure:

```sh
node generate-navigation.mjs
```

### Options

- `--docs <path>`: Path to `docs.json` (default: `docs.json`)
- `--content-root <path>`: Content root directory (default: current directory)
- `--languages <list>`: Comma-separated languages (e.g. `en,zh-Hans`)
- `--dry-run`: Print result without writing `docs.json`
- `--update-titles`: Update English MDX titles from mapping or filename

### Examples

```sh
# Specify docs.json and content root
node generate-navigation.mjs --docs ./docs.json --content-root .

# Only build navigation for en and zh-Hans
node generate-navigation.mjs --languages en,zh-Hans

# Preview result without writing
node generate-navigation.mjs --dry-run

# Update English titles while generating navigation
node generate-navigation.mjs --update-titles
```

Pages with `sidebar_hidden: true` in frontmatter are kept as routable documents but skipped when generating `docs.json`. Use this for deprecated compatibility pages or pages placed manually in a different navigation tab, such as the standalone SDK guide.

## Run Locally with Docker

Run the documentation site locally using Docker:

```sh
docker build -t xpert-ai/docs . \
  && docker run --rm -p 3000:3000 xpert-ai/docs
```

## Preview Locally with Mint

`mint dev`

## Chinese Agent Chat API Reference

Legacy AI/v1 OpenAPI integration is deprecated and no longer maintained; availability and compatibility are not guaranteed. The historical OpenAPI reference is also unmaintained. This does not deprecate the current assistants, threads, runs, context-upload or ChatKit-session endpoints. New integrations should use `@xpert-ai/xpert-sdk`, as documented in `en/ai/agent/development-api.mdx` and `zh-Hans/ai/agent/development-api.mdx`.

The historical English specification remains in `api/openapi.ai.json`. Only legacy AI/v1 operations carry `deprecated: true`; the ChatKit session endpoint is excluded because it remains part of UI integration. All pages carry a reference-maintenance notice linking to the SDK guide. The Chinese navigation uses the generated `api/openapi.ai.zh-Hans.json`; the shared notice, agent chat details, schemas and file-upload migration details are localized. Other historical endpoint details retain their source descriptions.

After updating the source specification, update `api/agent-chat.zh-Hans.translations.json` for any changed localized descriptions and regenerate:

```sh
node scripts/generate-openapi-zh.mjs
node scripts/generate-openapi-zh.mjs --check
```

Do not edit the generated specification directly. The generator preserves the published Chinese agent chat URL and fails when translations are missing or stale.

## Data documentation checks

Run the dependency-free metadata and local-link check before publishing the Chinese Data Xpert documentation:

```bash
node scripts/check-data-docs.mjs
```

The check fails when a page under `zh-Hans/data` lacks a title or description, or when a relative Markdown/MDX link or local image cannot be resolved. External URLs are intentionally skipped.

## SDK HTTP API Reference

The SDK tab also contains current HTTP reference pages for the guide's agent, thread, run, attachment and Store examples. These use `api/openapi.sdk.json`, independently of the historical OpenAPI reference. Each operation includes its corresponding SDK method, stable page URL, request parameters and response examples.

The English specification is the contract source. When updating it, verify the corresponding controllers and handlers in `xpert-develop/packages/server-ai/src/ai` and wire fields in `xpert-sdk-js/packages/core/src/client.ts`. Do not copy SDK options that the server ignores into the supported request fields. Keep the different start, wait and reconnect behaviors explicit. The initial reference covers the 18 operations used in the SDK guide, not the entire SDK surface.

Update `api/sdk.zh-Hans.translations.json`, then generate and check the Chinese reference:

```sh
node scripts/generate-sdk-openapi-zh.mjs
node scripts/generate-sdk-openapi-zh.mjs --check
node --test scripts/test-sdk-openapi.mjs scripts/test-navigation.mjs
```

Do not edit `api/openapi.sdk.zh-Hans.json` directly. The localization generator preserves endpoint paths, schemas and examples. Navigation uses [Mintlify OpenAPI groups](https://mintlify.com/docs/api-playground/openapi-setup) to render the method badges, parameter reference, generated code samples and API playground. A successful documentation render does not verify live API execution.

## Live Dashboard product documentation

AI → Live Dashboard (实时看板) is a separate tab after Projects & Tasks, mirrored
in `en` and `zh-Hans`. Its six task-oriented pages live under
`{language}/ai/live-dashboard/`:

| Route suffix | User task |
| --- | --- |
| `index` | Understand live dashboards, drafts and versioned definitions |
| `create` | Describe a business request, open the card and verify the result |
| `edit` | Continue editing the same dashboard and confirm publication |
| `data-sources` | Choose supported sources, files and refresh behavior |
| `sharing` | Share a formal version and use the floating standalone toolbar |
| `troubleshooting` | Resolve save, chart, filter, version and access problems |

The AI overview at `{language}/ai/getting-started/index` is the first page under
Getting Started and features a Live Dashboard entry. Keep the general Artifact
overview under AI → Agent → Artifacts, and cross-link to the dashboard section
from conversation, data source and ontology Workbench guides.

Keep this order in `navigation-order-tree.json` as well as `docs.json`, and keep
the tab's bilingual labels in `display-name-overrides.json`, so navigation
regeneration retains the reading flow. The 12 previous
`/{language}/ai/agent/artifacts/dashboard-*` routes redirect to their new pages
through `docs.json`'s `redirects` array; preserve these mappings when reorganizing
navigation. Internal links should point directly to the new routes.

The pages describe existing functionality;
they do not schedule feature development or promise general public-package availability.
Internal architecture, contracts and verification limits belong in the Xpert source
repository's `docs/{language}/guides/artifacts-dashboard/` feature documentation.

When updating these pages, distinguish saved definitions from data snapshots, page
timers from background subscriptions, draft revisions from formal versions, and
team read-only sharing from private Workspace script dependencies. Keep commands,
local accounts, test receipts and release checklists out of the product workflow.

## Projects & Tasks product documentation

AI → Projects & Tasks (项目与任务) is a separate tab immediately after Agent.
The 12 pages under each `{language}/ai/projects/` tree cover the overview,
quickstart, project types, Assistants and context, members, files, planning,
task views, execution and acceptance, group collaboration, schedules and troubleshooting.
Keep the English and Chinese paths and navigation order aligned.

The old `/{language}/ai/agent/conversation/projects` routes redirect to the new
overview. Preserve these redirects; internal links should use the new routes.
The AI overview, Bosi tutorial and ChatKit project-selector guide link to this section.
Navigation is defined in `docs.json`, `navigation-order-tree.json` and
`display-name-overrides.json`. Preview generation before applying it: existing
manual navigation elsewhere in the site can differ from the directory-derived output.

The initial research on 2026-10-17 used the local `xpert` source checkout and its
Plugin SDK documentation. For subsequent updates, cross-check these sources:

| Product topic | Source in the Xpert repository |
| --- | --- |
| Task and group workflows | `docs/zh-Hans/guides/project-tasks.mdx`, `group-project-tasks.mdx` and their English counterparts |
| Project types and first-send creation | `docs/zh-Hans/guides/project-application-types.mdx`, `docs/conversation-project-bootstrap.md`, `services/project-type.service.ts` and `services/conversation-project.service.ts` under `packages/server-ai/src/xpert-project/` |
| Visible Cloud actions | `apps/cloud/src/app/features/project/`: routes, creation, plans, files, configuration and membership dialogs |
| Authorization and governed content | `packages/server-ai/src/xpert-project/services/`: access, membership, content and workspace-file services |
| Dispatch, acceptance and shared task UI | `packages/server-ai/src/xpert-project/runtime/`, `plugins/project-tasks/README.md`, `views/project-tasks.provider.ts`, `remote-components/project-tasks/` |
| Execution viewer and schedules | `packages/server-ai/src/agent-invocation/remote-components/coding-execution/README.md`, `packages/server-ai/src/xpert-task/xpert-task.service.ts` |
| SDK boundaries | `packages/plugin-sdk/docs/README.md` (task types), `en/RESOURCE-CARDS.md`, `en/view-extension-protocol.md`, `en/runtime-capabilities.md` and `workspace-file-tools.md` |

Architecture proposals under `docs/zh-Hans/solutions/` include planned features
and older UI inventories; confirm capabilities against current implementation.
Keep product instructions distinct from SDK contracts and deployment procedures.
In particular, preserve the distinctions between planning and dispatch, successful
execution and acceptance, working files and committed deliverables, group membership
and Project authorization, and scheduled runs and business tasks. Source inspection
and documentation builds do not establish deployed availability or live execution.
