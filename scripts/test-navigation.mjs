import assert from 'node:assert/strict';
import { test } from 'node:test';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const run = promisify(execFile);
const generator = fileURLToPath(new URL('../generate-navigation.mjs', import.meta.url));

async function withFixture(pages, tabs, check) {
  const root = await mkdtemp(path.join(tmpdir(), 'xpert-navigation-'));
  try {
    for (const [relative, content] of Object.entries(pages)) {
      const file = path.join(root, relative);
      await mkdir(path.dirname(file), { recursive: true });
      await writeFile(file, content);
    }
    const configPath = path.join(root, 'docs.json');
    await writeFile(configPath, JSON.stringify({
      navigation: { languages: [{ language: 'en', products: [{ product: 'AI', tabs }] }] }
    }));
    const generate = async () => {
      await run(process.execPath, [generator, '--docs', configPath, '--content-root', root, '--languages', 'en']);
      return JSON.parse(await readFile(configPath, 'utf8'));
    };
    await check(generate);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}

const aiTabs = config => config.navigation.languages[0].products.find(product => product.product === 'AI').tabs;

test('SDK group aliases merge once and retain manual metadata', async () => {
  const page = 'en/ai/chatkit/sdk/integration';
  await withFixture({ [`${page}.md`]: '---\ntitle: Integration\n---\nGuide\n' }, [{
    tab: 'Chatkit', groups: [
      { group: 'Sdk', pages: [page] },
      { group: 'SDK', icon: 'code', pages: [page] }
    ]
  }], async generate => {
    const config = await generate();
    const groups = aiTabs(config).find(tab => tab.tab === 'Chatkit').groups;
    assert.equal(groups.length, 1);
    assert.equal(groups[0].group, 'SDK');
    assert.equal(groups[0].icon, 'code');
    assert.deepEqual(groups[0].pages, [page]);
    assert.deepEqual(await generate(), config);
  });
});

test('independent SDK navigation survives regeneration without ChatKit duplicates', async () => {
  const guide = 'en/ai/agent/development-api';
  const reference = { group: 'HTTP API Reference', openapi: { source: 'api/openapi.sdk.json', directory: 'en/sdk-api' } };
  await withFixture({
    'en/ai/chatkit/index.md': '---\ntitle: ChatKit\n---\nChatKit\n',
    'en/ai/chatkit/sdk/integration.md': '---\ntitle: Historical integration\nsidebar_hidden: true\n---\nHistory\n',
    [`${guide}.mdx`]: '---\ntitle: Development SDK\nsidebar_hidden: true\n---\nSDK\n'
  }, [
    { tab: 'Chatkit', groups: [{ group: 'Default', pages: ['en/ai/chatkit/index'] }] },
    { tab: 'SDK', groups: [{ group: 'Standalone Integration', pages: [guide] }, reference] }
  ], async generate => {
    const config = await generate();
    const tabs = aiTabs(config);
    const sdk = tabs.filter(tab => tab.tab === 'SDK');
    assert.equal(sdk.length, 1);
    assert.equal(sdk[0].groups.length, 2);
    assert.deepEqual(sdk[0].groups[0].pages, [guide]);
    assert.deepEqual(sdk[0].groups[1], reference);
    const chatkit = tabs.find(tab => tab.tab === 'Chatkit');
    assert.ok(chatkit.groups.every(group => !/sdk/i.test(group.group)));
    assert.deepEqual(await generate(), config);
  });
});
