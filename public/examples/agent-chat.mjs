import { pathToFileURL } from 'node:url';

// POST SSE requires fetch; EventSource cannot send this JSON request body.
export async function* readSse(body) {
  const reader = body.pipeThrough(new TextDecoderStream()).getReader();
  let buffer = '';
  let data = [];
  let event = 'message';
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += value;
      let match;
      while ((match = /\r\n|\r(?!$)|\n/.exec(buffer))) {
        const line = buffer.slice(0, match.index);
        buffer = buffer.slice(match.index + match[0].length);
        if (line === '') {
          if (data.length) yield { event, data: data.join('\n') };
          data = [];
          event = 'message';
        } else if (!line.startsWith(':')) {
          const colon = line.indexOf(':');
          const field = colon === -1 ? line : line.slice(0, colon);
          let content = colon === -1 ? '' : line.slice(colon + 1);
          if (content.startsWith(' ')) content = content.slice(1);
          if (field === 'data') data.push(content);
          if (field === 'event') event = content;
        }
      }
    }
    // An incomplete final frame is not a completed SSE event.
  } finally {
    await reader.cancel();
    reader.releaseLock();
  }
}

export async function chat({ baseUrl, apiKey, xpertId, input, conversationId, onText = () => {}, timeoutMs = 120000 }) {
  const response = await fetch(`${baseUrl.replace(/\/$/, '')}/api/ai/v1/chat`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json', Accept: 'text/event-stream' },
    body: JSON.stringify({
      request: { action: 'send', ...(conversationId ? { conversationId } : {}), message: { input: { input } } },
      options: { xpertId }
    }),
    signal: AbortSignal.timeout(timeoutMs)
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}: ${await response.text()}`);
  if (!response.headers.get('content-type')?.includes('text/event-stream') || !response.body) {
    throw new Error('Expected an SSE response');
  }
  let ended = false;
  let status;
  let text = '';
  for await (const frame of readSse(response.body)) {
    if (frame.event === 'error') throw new Error(`SSE error: ${frame.data}`);
    // The v1 keepAlive operator may be serialized as data instead of a comment.
    if (frame.data.trim() === ': keep-alive') continue;
    const payload = JSON.parse(frame.data);
    if (payload.type === 'message') {
      const delta = typeof payload.data === 'string' ? payload.data
        : payload.data?.type === 'text' ? payload.data.text ?? '' : '';
      text += delta;
      onText(delta);
    }
    if (payload.type !== 'event') continue;
    if (payload.event === 'on_conversation_start') conversationId = payload.data.id;
    if (payload.event === 'on_error') throw new Error(`Agent error: ${JSON.stringify(payload.data)}`);
    if (payload.event === 'on_interrupt') throw new Error('Agent needs confirmation; use the resume API flow');
    if (payload.event === 'on_conversation_end') {
      ended = true;
      status = payload.data.status;
      if (payload.data.error || status === 'error') throw new Error(`Agent failed: ${JSON.stringify(payload.data)}`);
    }
  }
  if (!ended) throw new Error('Stream closed before on_conversation_end; do not retry blindly');
  if (!conversationId) throw new Error('Missing conversation ID');
  if (status !== 'idle') throw new Error(`Conversation is not complete: ${status}`);
  return { conversationId, text, status };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { XPERT_BASE_URL: baseUrl, XPERT_API_KEY: apiKey, XPERT_ID: xpertId } = process.env;
  if (!baseUrl || !apiKey || !xpertId) throw new Error('Set XPERT_BASE_URL, XPERT_API_KEY and XPERT_ID');
  try {
    const first = await chat({ baseUrl, apiKey, xpertId, input: 'Remember this test word: orange. Reply briefly.', onText: chunk => process.stdout.write(chunk) });
    process.stdout.write('\n');
    const second = await chat({ baseUrl, apiKey, xpertId, conversationId: first.conversationId, input: 'What test word did I ask you to remember?', onText: chunk => process.stdout.write(chunk) });
    if (second.conversationId !== first.conversationId) throw new Error('Conversation ID changed');
    process.stdout.write(`\nConversation: ${second.conversationId}\n`);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
