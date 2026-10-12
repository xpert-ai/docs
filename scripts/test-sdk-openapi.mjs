import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

const root = new URL('../', import.meta.url);
const readJson = async path => JSON.parse(await readFile(new URL(path, root), 'utf8'));
const source = await readJson('api/openapi.sdk.json');
const localized = await readJson('api/openapi.sdk.zh-Hans.json');
const operations = spec => Object.values(spec.paths).flatMap(path => Object.values(path));

function contract(value) {
  if (Array.isArray(value)) return value.map(contract);
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(Object.entries(value)
    .filter(([key, child]) => key !== 'x-mint' && !(typeof child === 'string' && ['title', 'summary', 'description'].includes(key)))
    .map(([key, child]) => [key, contract(child)]));
}

test('localization preserves the current HTTP contract and separate stable URLs', () => {
  assert.deepEqual(contract(localized), contract(source));
  for (const [language, spec] of [['en', source], ['zh-hans', localized]]) {
    const urls = operations(spec).map(op => op['x-mint'].href);
    assert.equal(new Set(urls).size, urls.length);
    assert.ok(urls.every(url => url.startsWith(`/${language}/sdk-api/`)));
    assert.ok(operations(spec).every(op => !op.deprecated));
    assert.ok(Object.keys(spec.paths).every(path => !path.includes('/v1/')));
  }
});

test('documented runnable SDK methods and guide links have reference pages', async () => {
  const methods = new Set(operations(source).map(op => op['x-sdk-method']));
  for (const [language, spec] of [['en', source], ['zh-Hans', localized]]) {
    const guide = await readFile(new URL(`${language}/ai/agent/development-api.mdx`, root), 'utf8');
    const codeBlocks = [...guide.split('<Accordion')[0].matchAll(/^```ts\n([\s\S]*?)^```/gm)];
    for (const block of codeBlocks) {
      for (const call of block[1].matchAll(/client\.([a-z]+\.[A-Za-z]+)\(/g)) {
        assert.ok(methods.has(call[1]), `Missing HTTP reference for ${call[1]}`);
      }
    }
    const urls = new Set(operations(spec).map(op => op['x-mint'].href));
    for (const link of guide.matchAll(/\]\((\/[^)]+\/sdk-api\/[^)]+)\)/g)) {
      assert.ok(urls.has(link[1]), `Unknown reference link: ${link[1]}`);
    }
  }
});

test('start, wait and replay retain distinct documented wire contracts', () => {
  const stream = source.paths['/api/ai/threads/{thread_id}/runs/stream'].post;
  const wait = source.paths['/api/ai/threads/{thread_id}/runs/wait'].post;
  const join = source.paths['/api/ai/threads/{thread_id}/runs/{run_id}/stream'].get;
  for (const op of [stream, wait]) {
    const sample = op.requestBody.content['application/json'].example;
    assert.ok(sample.assistant_id);
    assert.equal(sample.input.action, 'send');
    assert.equal(typeof sample.input.message.input.input, 'string');
    assert.ok(!('request' in sample) && !('options' in sample));
  }
  assert.ok(stream.responses['201'].headers['Content-Location']);
  assert.deepEqual(wait.responses['201'].content['application/json'].example, { role: 'ai', content: 'Hello' });
  assert.equal(join.requestBody, undefined);
  assert.ok(join.parameters.some(parameter => parameter.in === 'header' && parameter.name === 'Last-Event-ID'));
  assert.ok(!Object.keys(source.paths).some(path => /\/history$|\/join$/.test(path)));
});
