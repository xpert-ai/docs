import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createServer } from 'node:http';
import { chat, readSse } from '../public/examples/agent-chat.mjs';

const event = (name, data) => `data: ${JSON.stringify({ type: 'event', event: name, data })}\n\n`;
const start = event('on_conversation_start', { id: 'conversation-test' });
const end = event('on_conversation_end', { id: 'conversation-test', status: 'idle', error: null });

async function serverTest(handler, run) {
  const server = createServer(handler);
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  try {
    await run({ baseUrl: `http://127.0.0.1:${server.address().port}`, apiKey: 'fixture-key', xpertId: 'fixture-agent' });
  } finally {
    server.closeAllConnections();
    await new Promise(resolve => server.close(resolve));
  }
}

test('SSE parser handles byte-split UTF-8, CRLF, comments and multiline data', async () => {
  const bytes = new TextEncoder().encode(': ping\r\n\r\nevent: message\r\ndata: {"text":\r\ndata: "你好"}\r\n\r\n');
  const body = new ReadableStream({ start(controller) { for (const byte of bytes) controller.enqueue(Uint8Array.of(byte)); controller.close(); } });
  const frames = [];
  for await (const frame of readSse(body)) frames.push(frame);
  assert.equal(frames.length, 1);
  assert.deepEqual(JSON.parse(frames[0].data), { text: '你好' });
});

test('real HTTP transport sends documented body, combines text and reuses conversation ID', async () => {
  const requests = [];
  await serverTest(async (req, res) => {
    let body = '';
    for await (const chunk of req) body += chunk;
    requests.push({ url: req.url, method: req.method, auth: req.headers.authorization, body: JSON.parse(body) });
    res.writeHead(201, { 'content-type': 'text/event-stream' });
    res.end(start + ': heartbeat\n\n' + 'data: : keep-alive\ndata: \ndata: \n\n' + 'data: {"type":"message","data":"你好"}\n\n' + 'data: {"type":"message","data":{"type":"text","text":"世界"}}\n\n' + end);
  }, async config => {
    const first = await chat({ ...config, input: 'first' });
    assert.equal(first.text, '你好世界');
    await chat({ ...config, input: 'second', conversationId: first.conversationId });
  });
  assert.equal(requests.length, 2);
  assert.equal(requests[0].url, '/api/ai/v1/chat');
  assert.equal(requests[0].method, 'POST');
  assert.equal(requests[0].auth, 'Bearer fixture-key');
  assert.deepEqual(requests[0].body, { request: { action: 'send', message: { input: { input: 'first' } } }, options: { xpertId: 'fixture-agent' } });
  assert.equal(requests[1].body.request.conversationId, 'conversation-test');
});

for (const [name, status, contentType, body, expected] of [
  ['invalid key', 401, 'application/json', '{"message":"Unauthorized"}', /HTTP 401/],
  ['wrong content type', 200, 'application/json', '{}', /Expected an SSE/],
  ['agent failure inside 2xx', 200, 'text/event-stream', start + event('on_conversation_end', { status: 'error', error: 'model failed' }), /Agent failed/],
  ['native SSE error', 200, 'text/event-stream', 'event: error\ndata: failed\n\n', /SSE error/],
  ['application error', 200, 'text/event-stream', event('on_error', { error: 'failed' }), /Agent error/],
  ['interruption', 200, 'text/event-stream', start + event('on_interrupt', {}), /needs confirmation/],
  ['incomplete stream', 200, 'text/event-stream', start, /before on_conversation_end/],
  ['missing conversation', 200, 'text/event-stream', end, /Missing conversation ID/],
  ['non-idle end', 200, 'text/event-stream', start + event('on_conversation_end', { status: 'interrupted' }), /not complete/],
  ['truncated final frame', 200, 'text/event-stream', start + end.trimEnd(), /before on_conversation_end/]
]) {
  test(name, async () => serverTest((req, res) => {
    res.writeHead(status, { 'content-type': contentType });
    res.end(body);
  }, config => assert.rejects(chat({ ...config, input: 'hello' }), expected)));
}

test('hung stream times out', async () => serverTest((req, res) => {
  res.writeHead(200, { 'content-type': 'text/event-stream' });
  res.write(start);
}, config => assert.rejects(chat({ ...config, input: 'hello', timeoutMs: 50 }), /timeout|abort/i)));
