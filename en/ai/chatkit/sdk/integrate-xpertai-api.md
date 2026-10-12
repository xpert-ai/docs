---
title: Integrate XpertAI API
sidebar_position: 1
sidebar_hidden: true
---

<Info>
SDK integration is independent of ChatKit. For general server integration, see [Development SDK](/en/ai/agent/development-api). This page retains SDK and ChatKit UI embedding details.
</Info>

## Integration Overview

| Method | Use Case | Requires `client_secret`? | Recommended Credential | Typical Entry Point |
| --- | --- | --- | --- | --- |
| SDK Integration | Node.js / TypeScript server-side, scripting tools, backend workflows | No, not needed for server-to-server | `apiKey` | `Client`, `client.assistants`, `client.threads`, `client.runs` |
| Direct API Call | Any language, gateway, server-to-server integration | No, not needed for server-to-server | `apiKey` | `/api/ai/assistants/search`, `/api/ai/threads`, `/api/ai/threads/{thread_id}/runs/stream` |
| ChatKit UI Embedding | Browser-side ChatKit widget embedding | Yes | Store `apiKey` on server, frontend only receives `client_secret` | `POST /api/ai/v1/chatkit/sessions` |

If you are only calling the XpertAI API from your own server, you do not need to obtain a `client_secret` first. The `client_secret` is primarily used for ChatKit UI or other browser-side short-term access scenarios.

## Prerequisites

Before getting started, prepare the following information:

- `apiUrl`
  - Public cloud example: `https://api.xpertai.cn/api/ai`
  - For private deployments, replace with your own XpertAI AI API address
- `apiKey`
  - It is recommended to use a long-term credential stored securely on the server side
  - Can be passed via `x-api-key` or `Authorization: Bearer <apiKey>`
- `xpertId`
  - The `xpert_id` of the target published xpert

If your xpert depends on organization or end-user context, you can also pass these additional headers in your requests:

- `organization-id`
- `x-principal-user-id`

These two headers are recommended only for advanced scenarios and do not need to be included in minimal integration examples.

## Integration via SDK

The XpertAI SDK repository is [`xpert-sdk-js`](https://github.com/xpert-ai/xpert-sdk-js), but the actual npm package name is `@xpert-ai/xpert-sdk`.

### 1. Install the SDK

```bash
npm install @xpert-ai/xpert-sdk
```

### 2. Initialize the `Client`

`ClientConfig` supports the following common parameters:

- `apiUrl`
- `apiKey`
- `timeoutMs`
- `defaultHeaders`
- `onRequest`

Minimal initialization example:

```ts
import { Client } from "@xpert-ai/xpert-sdk";

const client = new Client({
  apiUrl: process.env.XPERTAI_API_URL ?? "https://api.xpertai.cn/api/ai",
  apiKey: process.env.XPERTAI_API_KEY ?? "",
});
```

If you need to fix organization or business user context for the entire session, you can inject them uniformly via `defaultHeaders`:

```ts
import { Client } from "@xpert-ai/xpert-sdk";

const client = new Client({
  apiUrl: process.env.XPERTAI_API_URL ?? "https://api.xpertai.cn/api/ai",
  apiKey: process.env.XPERTAI_API_KEY ?? "",
  defaultHeaders: {
    "organization-id": "org-001",
    "x-principal-user-id": "user-001",
  },
});
```

### 3. Minimal Conversation Example

The following example demonstrates the complete main flow:

1. Use `client.assistants` to query an xpert
2. Use `client.threads` to create a thread
3. Use `client.runs` to initiate a conversation run

```ts
import { Client } from "@xpert-ai/xpert-sdk";

const client = new Client({
  apiUrl: process.env.XPERTAI_API_URL ?? "https://api.xpertai.cn/api/ai",
  apiKey: process.env.XPERTAI_API_KEY ?? "",
});

async function main() {
  const assistants = await client.assistants.search({
    limit: 1,
    metadata: {
      slug: "your-xpert-slug",
    },
  });

  const xpert = assistants[0];
  if (!xpert) {
    throw new Error("Assistant not found");
  }

  const thread = await client.threads.create({ assistantId: xpert.xpert_id });

  const result = await client.runs.wait(thread.thread_id, xpert.xpert_id, {
    input: {
      action: "send",
      message: {
        input: {
          input: "Hello, can you tell me what you can do?",
        },
      },
    },
  });

  console.log(result);
}

main().catch(console.error);
```

Create the thread with `assistantId` and use the same agent ID for the run. If creation succeeds but the run returns 403, see the permission troubleshooting section in the [SDK guide](/en/ai/agent/development-api).

### 4. Common Capabilities

The most commonly used sub-clients in the SDK include:

- `client.assistants`
  - Query or read xpert information
- `client.threads`
  - Create and manage threads
- `client.runs`
  - Use `wait()` to get the final result, or use `stream()` to consume the SSE stream in real time
- `client.contexts`
  - Upload context files, e.g., `client.contexts.uploadFile()`
- `client.knowledges`
  - Create or manage knowledge base resources

For example, when you need to upload a file for the xpert to use:

```ts
import fs from "node:fs/promises";
import { Blob } from "node:buffer";
import { Client } from "@xpert-ai/xpert-sdk";

const client = new Client({
  apiUrl: process.env.XPERTAI_API_URL ?? "https://api.xpertai.cn/api/ai",
  apiKey: process.env.XPERTAI_API_KEY ?? "",
});

async function runWithFile(xpertId: string) {
  const fileBuffer = await fs.readFile("./manual.pdf");
  const file = await client.contexts.uploadFile(new Blob([fileBuffer]), {
    filename: "manual.pdf",
  });

  const thread = await client.threads.create({ assistantId: xpertId });

  const result = await client.runs.wait(thread.thread_id, xpertId, {
    input: {
      action: "send",
      message: {
        input: {
          input: "Please summarize the key points of the attachment.",
          files: [file],
        },
      },
    },
  });

  console.log(result);
}
```

## Direct API Calls

<Note>
The following assistants, threads and runs endpoints are the same HTTP endpoints used by the SDK; they are not deprecated. The [official SDK](/en/ai/agent/development-api) is recommended for general application integration. Legacy AI/v1 OpenAPI integration is separate: those old endpoints and examples are no longer maintained, and their availability is not guaranteed.
</Note>

If you are not using the SDK, you can also call the public REST API directly.

### 1. Authentication with `apiKey`

You can choose either method:

- `x-api-key: sk-x-...`
- `Authorization: Bearer sk-x-...`

The examples below use `x-api-key` consistently.

### 2. Query an Xpert

If you already know the xpert ID, you can call `GET /api/ai/assistants/{id}` directly. If you want to filter assistants by criteria first, you can use the search endpoint:

```bash
curl -X POST "https://api.xpertai.cn/api/ai/assistants/search" \
  -H "Content-Type: application/json" \
  -H "x-api-key: sk-x-your-api-key" \
  -d '{
    "limit": 1,
    "offset": 0,
    "metadata": {
      "slug": "your-xpert-slug"
    }
  }'
```

If you already have the xpert ID, you can further confirm the details:

```bash
curl "https://api.xpertai.cn/api/ai/assistants/<xpert-id>" \
  -H "x-api-key: sk-x-your-api-key"
```

### 3. Create a Thread

```bash
curl -X POST "https://api.xpertai.cn/api/ai/threads" \
  -H "Content-Type: application/json" \
  -H "x-api-key: sk-x-your-api-key" \
  -d '{"assistant_id": "<xpert-id>"}'
```

The response will contain a `thread_id`. You will need to continue using this thread ID for subsequent xpert runs.

The HTTP field is `assistant_id`; the TypeScript SDK uses `assistantId`. Although the protocol accepts an unbound thread, agent integrations should bind the target agent at creation and use the same ID for the run. Successful thread creation does not guarantee run permission; see the [SDK guide](/en/ai/agent/development-api) for 403 troubleshooting.

### 4. Call `runs/stream`

```bash
curl -N -X POST "https://api.xpertai.cn/api/ai/threads/<thread-id>/runs/stream" \
  -H "Content-Type: application/json" \
  -H "x-api-key: sk-x-your-api-key" \
  -d '{
    "xpert_id": "<xpert-id>",
    "input": {
      "action": "send",
      "message": {
        "input": {
          "input": "Hello, can you tell me what you can do?"
        }
      }
    }
  }'
```

This endpoint returns a continuous SSE event stream, suitable for real-time chat and frontend streaming display.

### 5. Optional: Upload a File Before Starting a Conversation

If your xpert needs to read attachments, you can upload a context file first:

```bash
curl -X POST "https://api.xpertai.cn/api/ai/contexts/file" \
  -H "x-api-key: sk-x-your-api-key" \
  -F "file=@./manual.pdf"
```

After a successful upload, you can pass the returned file object as `files` in the run request:

```bash
curl -N -X POST "https://api.xpertai.cn/api/ai/threads/<thread-id>/runs/stream" \
  -H "Content-Type: application/json" \
  -H "x-api-key: sk-x-your-api-key" \
  -d '{
    "xpert_id": "<xpert-id>",
    "input": {
      "action": "send",
      "message": {
        "input": {
          "input": "Please summarize the key points of the attachment.",
          "files": [
            {
              "id": "<file-id>",
              "name": "manual.pdf",
              "url": "<file-url>"
            }
          ]
        }
      }
    }
  }'
```

## Authentication & Security

### Difference Between `apiKey` and `client_secret`

- `apiKey`
  - Long-term credential
  - Suitable for server-to-server calls
  - Should never be exposed to the browser
- `client_secret`
  - Short-term credential
  - Suitable for ChatKit UI or frontend-side short-term access
  - Issued by `POST /api/ai/v1/chatkit/sessions`

### When Do You Need `client_secret`?

If you are:

- Calling XpertAI from your own server using the SDK
- Making direct REST calls from your own server

Then you typically only need the `apiKey`.

If you are:

- Embedding ChatKit UI in a browser
- Need to provide a short-term credential to the frontend runtime

Then your backend should obtain a `client_secret` and return it to the frontend.

### Correct Usage of `chatkit/sessions`

`POST /api/ai/v1/chatkit/sessions` is only used to obtain a short-term `client_secret`. The current endpoint request body only requires `expires_after`:

```bash
curl -X POST "https://api.xpertai.cn/api/ai/v1/chatkit/sessions" \
  -H "Content-Type: application/json" \
  -H "x-api-key: sk-x-your-api-key" \
  -d '{
    "expires_after": 600
  }'
```

Please note:

- You do not need to pass `xpert` in the request body
- You do not need to pass `user` in the request body
- If you need to fix organization or business user context, pass `organization-id` and `x-principal-user-id` via request headers

### Security Recommendations

- Never expose long-term `apiKey` in the browser
- The frontend should only hold the short-term `client_secret`
- If using an xpert-specific key, make sure it is bound to the same xpert as the actual access target
- When you need to audit end-user identity, pass `x-principal-user-id` during the `client_secret` exchange on the server side

## Next Steps

- If you want to embed a frontend chat UI, start by reading [💬 ChatKit SDK](./index)
- If you want to further customize visuals and interactions, check out [Themes and Customization](./chatkit-themes), [Widgets](./chatkit-widgets), [Client Tools](./chatkit-tool)
