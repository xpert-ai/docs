// Generate the Chinese API reference without maintaining a second API contract.
// Run: node scripts/generate-openapi-zh.mjs [--check]
import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const source = JSON.parse(await readFile(new URL('api/openapi.ai.json', root), 'utf8'));
const translations = JSON.parse(await readFile(new URL('api/agent-chat.zh-Hans.translations.json', root), 'utf8'));
const localized = structuredClone(source);
const used = new Set();

function translate(value) {
  if (Array.isArray(value)) {
    value.forEach(translate);
  } else if (value && typeof value === 'object') {
    for (const [key, child] of Object.entries(value)) {
      if ((key === 'summary' || key === 'description') && typeof child === 'string') {
        assert.ok(Object.hasOwn(translations, child), `Missing Chinese translation: ${child}`);
        value[key] = translations[child];
        used.add(child);
      } else {
        translate(child);
      }
    }
  }
}

const operation = localized.paths['/api/ai/v1/chat'].post;
translate(operation);
for (const [name, schema] of Object.entries(localized.components.schemas)) {
  if (name.startsWith('AgentChat')) translate(schema);
}
assert.equal(used.size, Object.keys(translations).length, 'Remove stale translations after updating the source');
// Keep the existing published URL even though the Chinese summary has changed.
operation['x-mint'] = {
  ...operation['x-mint'],
  href: '/zh-hans/api-reference/aiv1/chat-with-an-agent',
  metadata: { ...operation['x-mint']?.metadata, title: operation.summary, description: operation.description }
};
const examples = operation.requestBody.content['application/json'].examples;
examples.firstMessage.value.request.message.input.input = '你好，请简单介绍一下自己。';
examples.continueConversation.value.request.message.input.input = '请继续刚才的话题。';
operation.requestBody.content['application/json'].examples = {
  '首次发送消息': examples.firstMessage,
  '继续已有对话': examples.continueConversation
};
for (const response of Object.values(operation.responses)) {
  const stream = response.content?.['text/event-stream'];
  if (stream?.example) stream.example = stream.example.replace('"data":"Hello"', '"data":"你好"');
}
const output = `${JSON.stringify(localized, null, 2)}\n`;
const target = new URL('api/openapi.ai.zh-Hans.json', root);
if (process.argv.includes('--check')) {
  assert.equal(await readFile(target, 'utf8'), output, 'Run node scripts/generate-openapi-zh.mjs');
  const config = JSON.parse(await readFile(new URL('docs.json', root), 'utf8'));
  const references = [];
  function collect(value) {
    if (!value || typeof value !== 'object') return;
    if (value.openapi?.directory) references.push(value.openapi);
    Object.values(value).forEach(collect);
  }
  collect(config);
  assert.ok(references.some(ref => ref.directory === 'zh-Hans/api-reference' && ref.source === 'api/openapi.ai.zh-Hans.json'));
  assert.ok(references.some(ref => ref.directory === 'en/api-reference' && ref.source === 'api/openapi.ai.json'));
  console.log('Chinese translations, generated specification and language routing are up to date.');
} else {
  await writeFile(target, output);
}
