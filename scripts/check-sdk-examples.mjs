// Type-check every TypeScript block in both SDK guides against a built SDK package.
// Usage: node scripts/check-sdk-examples.mjs ../xpert-sdk-js/packages/core
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

assert.ok(process.argv[2], 'Pass the path to a built @xpert-ai/xpert-sdk package with TypeScript and @types/node installed.');
const sdkRoot = path.resolve(process.argv[2]);
const require = createRequire(path.join(sdkRoot, 'package.json'));
const ts = require('typescript');
const sdk = JSON.parse(await readFile(path.join(sdkRoot, 'package.json'), 'utf8'));
assert.equal(sdk.name, '@xpert-ai/xpert-sdk');
const root = fileURLToPath(new URL('../', import.meta.url));
const temporary = await mkdtemp(path.join(tmpdir(), 'xpert-sdk-docs-'));
const sources = new Map();

try {
  for (const language of ['en', 'zh-Hans']) {
    for (const page of ['ai/agent/development-api.mdx', 'ai/chatkit/sdk/integrate-xpertai-api.md']) {
      const relative = `${language}/${page}`;
      const markdown = await readFile(path.join(root, relative), 'utf8');
      const blocks = [...markdown.matchAll(/^```(?:ts|typescript)\r?\n([\s\S]*?)^```/gm)];
      assert.ok(blocks.length, `No TypeScript examples found in ${relative}`);
      for (const block of blocks) {
        const code = block[1];
        const parsed = ts.createSourceFile('example.ts', code, ts.ScriptTarget.Latest, true);
        const imports = parsed.statements.filter(ts.isImportDeclaration);
        let body = code;
        for (const statement of [...imports].reverse()) {
          body = body.slice(0, statement.pos) + code.slice(statement.pos, statement.end).replace(/[^\n]/g, ' ') + body.slice(statement.end);
        }
        // Give partial guide snippets their documented context. Keep each original
        // block in its own scope so complete examples can declare their own client.
        const prefix = [
          'import type { Client as ExampleClient, ChatSendRequest as ExampleInput, Thread as ExampleThread, Run as ExampleRun } from "@xpert-ai/xpert-sdk";',
          ...imports.map(statement => statement.getText(parsed)),
          'async function check(client: ExampleClient, xpertId: string, thread: ExampleThread, input: ExampleInput, run: ExampleRun) {',
          'type ChatSendRequest = ExampleInput;',
          '{',
          '',
        ].join('\n');
        const file = path.join(temporary, `example-${sources.size}.mts`);
        const firstLine = markdown.slice(0, block.index).split('\n').length + 1;
        sources.set(file, { relative, firstLine, prefixLines: prefix.split('\n').length - 1 });
        await writeFile(file, `${prefix}${body}\n}\n}\n`);
      }
    }
  }

  const program = ts.createProgram([...sources.keys()], {
    target: ts.ScriptTarget.ES2022,
    module: ts.ModuleKind.NodeNext,
    moduleResolution: ts.ModuleResolutionKind.NodeNext,
    strict: true,
    noEmit: true,
    skipLibCheck: true,
    types: ['node'],
    typeRoots: [path.dirname(path.dirname(require.resolve('@types/node/package.json')))],
    paths: { '@xpert-ai/xpert-sdk': [path.resolve(sdkRoot, sdk.types)] },
  });
  const diagnostics = ts.getPreEmitDiagnostics(program);
  for (const diagnostic of diagnostics) {
    const source = diagnostic.file && sources.get(diagnostic.file.fileName);
    const location = diagnostic.file?.getLineAndCharacterOfPosition(diagnostic.start ?? 0);
    const line = source && location ? source.firstLine + Math.max(0, location.line - source.prefixLines) : 0;
    console.error(`${source?.relative ?? diagnostic.file?.fileName ?? 'SDK'}:${line}: ${ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n')}`);
  }
  if (diagnostics.length) process.exitCode = 1;
  else console.log(`Checked ${sources.size} TypeScript examples across all four SDK guides against ${sdk.name}@${sdk.version}.`);
} finally {
  await rm(temporary, { recursive: true, force: true });
}
