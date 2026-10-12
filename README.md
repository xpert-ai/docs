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
