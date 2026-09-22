import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

const generator = fileURLToPath(new URL('../generate-navigation.mjs', import.meta.url));
const languages = ['en', 'zh-Hans'];

for (const names of [['Sdk'], ['SDK'], ['Sdk', 'SDK']]) {
  test(`SDK navigation merges ${names.join(' / ')} and stays stable on regeneration`, async (t) => {
    const root = await mkdtemp(path.join(tmpdir(), 'xpert-navigation-'));
    t.after(() => rm(root, { recursive: true, force: true }));
    const docsPath = path.join(root, 'docs.json');
    const docs = { navigation: { languages: [] } };
    for (const language of languages) {
      const sdkPath = `${language}/ai/chatkit/sdk`;
      await mkdir(path.join(root, sdkPath), { recursive: true });
      await writeFile(path.join(root, sdkPath, 'integrate-xpertai-api.md'), '---\ntitle: API\n---\n');
      await writeFile(path.join(root, sdkPath, 'new-page.md'), '---\ntitle: New page\n---\n');
      docs.navigation.languages.push({
        language,
        products: [{
          product: 'AI',
          tabs: [{
            tab: 'Chatkit',
            groups: [
              ...names.map((group) => ({
                group,
                icon: 'code',
                expanded: true,
                pages: [`${sdkPath}/integrate-xpertai-api`],
              })),
              { group: 'Manual API', icon: 'plug', openapi: '/api/openapi.json' },
            ],
          }],
        }],
      });
    }
    await writeFile(docsPath, JSON.stringify(docs));
    const generate = () => execFileSync(process.execPath, [
      generator, '--docs', docsPath, '--content-root', root, '--languages', languages.join(','),
    ]);
    generate();
    const first = await readFile(docsPath, 'utf8');
    for (const language of JSON.parse(first).navigation.languages) {
      const groups = language.products[0].tabs[0].groups;
      assert.deepEqual(groups.map(({ group }) => group), ['SDK', 'Manual API']);
      assert.equal(groups[0].icon, 'code');
      assert.equal(groups[0].expanded, true);
      assert.deepEqual(new Set(groups[0].pages), new Set([
        `${language.language}/ai/chatkit/sdk/integrate-xpertai-api`,
        `${language.language}/ai/chatkit/sdk/new-page`,
      ]));
      assert.deepEqual(groups[1], { group: 'Manual API', icon: 'plug', openapi: '/api/openapi.json' });
    }
    generate();
    assert.equal(await readFile(docsPath, 'utf8'), first);
  });
}
