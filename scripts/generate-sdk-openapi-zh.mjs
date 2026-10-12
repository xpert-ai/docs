// Keep one HTTP contract and localize only its reader-facing text.
// Run: node scripts/generate-sdk-openapi-zh.mjs [--check]
import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const readJson = async path => JSON.parse(await readFile(new URL(path, root), 'utf8'));
const source = await readJson('api/openapi.sdk.json');
const translations = await readJson('api/sdk.zh-Hans.translations.json');
const localized = structuredClone(source);
const used = new Set();

function translate(value) {
  if (Array.isArray(value)) {
    value.forEach(translate);
  } else if (value && typeof value === 'object') {
    for (const [key, child] of Object.entries(value)) {
      if (['title', 'summary', 'description'].includes(key) && typeof child === 'string' && child) {
        assert.ok(Object.hasOwn(translations, child), `Missing Chinese translation: ${child}`);
        value[key] = translations[child];
        used.add(child);
      } else {
        translate(child);
      }
    }
  }
}

translate(localized);
assert.equal(used.size, Object.keys(translations).length, 'Remove stale SDK translations');
for (const path of Object.values(localized.paths)) {
  for (const operation of Object.values(path)) {
    // Translation must not change the public URL or mix current and legacy pages.
    assert.ok(operation['x-mint']?.href?.startsWith('/en/sdk-api/'));
    operation['x-mint'].href = operation['x-mint'].href.replace('/en/', '/zh-hans/');
    operation['x-mint'].metadata = { title: operation.summary, description: operation.description };
  }
}

const output = `${JSON.stringify(localized, null, 2)}\n`;
const target = new URL('api/openapi.sdk.zh-Hans.json', root);
if (process.argv.includes('--check')) {
  assert.equal(await readFile(target, 'utf8'), output, 'Run node scripts/generate-sdk-openapi-zh.mjs');
  const config = await readJson('docs.json');
  for (const language of config.navigation.languages) {
    if (!['en', 'zh-Hans'].includes(language.language)) continue;
    const sdk = language.products.find(product => product.product === 'AI').tabs.find(tab => tab.tab === 'SDK');
    const spec = language.language === 'en' ? 'api/openapi.sdk.json' : 'api/openapi.sdk.zh-Hans.json';
    assert.ok(sdk.groups.some(group => group.openapi?.source === spec && group.openapi.directory === `${language.language}/sdk-api`));
  }
  console.log('SDK API translations, generated specification and navigation are up to date.');
} else {
  await writeFile(target, output);
}
