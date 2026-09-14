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

Pages with `sidebar_hidden: true` in frontmatter are kept as routable documents but skipped when generating `docs.json`. Use this for deprecated compatibility pages that should not appear in navigation.

## Run Locally with Docker

Run the documentation site locally using Docker:

```sh
docker build -t xpert-ai/docs . \
  && docker run --rm -p 3000:3000 xpert-ai/docs
```

## Preview Locally with Mint

`mint dev`

## Chinese Agent Chat API Reference

The English API contract remains in `api/openapi.ai.json`. The Chinese navigation uses the generated `api/openapi.ai.zh-Hans.json`; currently the agent chat endpoint and its schemas are localized. Other endpoints retain their source descriptions.

After updating the source specification, update `api/agent-chat.zh-Hans.translations.json` for any changed agent chat descriptions and regenerate:

```sh
node scripts/generate-openapi-zh.mjs
node scripts/generate-openapi-zh.mjs --check
```

Do not edit the generated specification directly. The generator preserves the published Chinese agent chat URL and fails when translations are missing or stale.
