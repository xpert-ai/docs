---
title: 接入 XpertAI API
sidebar_position: 1
sidebar_hidden: true
---

<Info>
SDK 是独立的程序接入方式，不依赖 ChatKit。通用服务端接入请参考 [开发 SDK](/zh-hans/ai/agent/development-api)；本页保留 SDK 和 ChatKit UI 嵌入相关说明。
</Info>

## 接入方式概览

| 方式 | 适用场景 | 是否需要 `client_secret` | 推荐凭据 | 典型入口 |
| --- | --- | --- | --- | --- |
| SDK 接入 | Node.js / TypeScript 服务端、脚本工具、后端工作流 | 否，服务端直连时不需要 | `apiKey` | `Client`、`client.assistants`、`client.threads`、`client.runs` |
| API 直接调用 | 任意语言、网关、Server-to-Server 集成 | 否，服务端直连时不需要 | `apiKey` | `/api/ai/assistants/search`、`/api/ai/threads`、`/api/ai/threads/{thread_id}/runs/stream` |
| ChatKit UI 嵌入 | 浏览器侧嵌入 ChatKit 小组件 | 是 | 服务端保存 `apiKey`，前端只拿 `client_secret` | `POST /api/ai/v1/chatkit/sessions` |

如果你只是从自己的服务端调用 XpertAI API，不需要先换取 `client_secret`。`client_secret` 主要用于 ChatKit UI 或其他浏览器侧短期访问场景。

## 接入前准备

开始前请先准备以下信息：

- `apiUrl`
  - 公有云示例：`https://api.xpertai.cn/api/ai`
  - 私有部署请替换成你自己的 XpertAI AI API 地址
- `apiKey`
  - 建议使用服务端安全保存的长期凭据
  - 可通过 `x-api-key` 或 `Authorization: Bearer <apiKey>` 传递
- `xpertId`
  - 即目标已发布 xpert 的 `xpert_id`

如果你的 xpert 依赖组织或终端用户上下文，还可以在请求里额外传递：

- `organization-id`
- `x-principal-user-id`

这两个头建议只在高级场景下使用，不需要混入最小接入示例。

## 通过 SDK 接入

XpertAI SDK 仓库名是 [`xpert-sdk-js`](https://github.com/xpert-ai/xpert-sdk-js)，但实际安装包名为 `@xpert-ai/xpert-sdk`。

### 1. 安装 SDK

```bash
npm install @xpert-ai/xpert-sdk
```

### 2. 初始化 `Client`

`ClientConfig` 支持常用参数包括：

- `apiUrl`
- `apiKey`
- `timeoutMs`
- `defaultHeaders`
- `onRequest`

最小初始化示例如下：

```ts
import { Client } from "@xpert-ai/xpert-sdk";

const client = new Client({
  apiUrl: process.env.XPERTAI_API_URL ?? "https://api.xpertai.cn/api/ai",
  apiKey: process.env.XPERTAI_API_KEY ?? "",
});
```

如果你需要在整个会话中固定组织或业务用户上下文，可以在 `defaultHeaders` 中统一注入：

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

### 3. 最小对话示例

下面的示例展示了完整主链路：

1. 使用 `client.assistants` 查询 xpert
2. 使用 `client.threads` 创建线程
3. 使用 `client.runs` 发起一次对话运行

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

  const thread = await client.threads.create();

  const result = await client.runs.wait(thread.thread_id, xpert.xpert_id, {
    input: {
      action: "send",
      message: {
        input: {
          input: "你好，请介绍一下你能做什么？",
        },
      },
    },
  });

  console.log(result);
}

main().catch(console.error);
```

### 4. 常用能力

SDK 中最常用的子客户端包括：

- `client.assistants`
  - 查询或读取 xpert 信息
- `client.threads`
  - 创建和管理线程
- `client.runs`
  - 使用 `wait()` 获取最终结果，或使用 `stream()` 实时消费 SSE 流
- `client.contexts`
  - 上传上下文文件，例如 `client.contexts.uploadFile()`
- `client.knowledges`
  - 创建或管理知识库资源

例如，当你需要上传一个文件再交给 xpert 使用时，可以这样写：

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

  const thread = await client.threads.create();

  const result = await client.runs.wait(thread.thread_id, xpertId, {
    input: {
      action: "send",
      message: {
        input: {
          input: "请总结附件重点。",
          files: [file],
        },
      },
    },
  });

  console.log(result);
}
```

## 通过 API 直接调用

<Note>
以下 `assistants`、`threads`、`runs` 接口也是 SDK 使用的底层 HTTP 接口，并未废弃。一般程序接入推荐使用 [官方 SDK](/zh-hans/ai/agent/development-api)。旧 AI/v1 OpenAPI 接入与这些接口不同；旧接口及其示例不再维护，不保证可用。
</Note>

如果你不使用 SDK，也可以直接调用公开的 REST API。

### 1. 使用 `apiKey` 鉴权

你可以任选一种方式：

- `x-api-key: sk-x-...`
- `Authorization: Bearer sk-x-...`

下面示例统一使用 `x-api-key`。

### 2. 查询 xpert

如果你已经知道 xpert ID，可以直接调用 `GET /api/ai/assistants/{id}`。如果你希望先按条件筛选 assistant，可以调用搜索接口：

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

如果你已经拿到了 xpert ID，可以进一步确认详情：

```bash
curl "https://api.xpertai.cn/api/ai/assistants/<xpert-id>" \
  -H "x-api-key: sk-x-your-api-key"
```

### 3. 创建 thread

```bash
curl -X POST "https://api.xpertai.cn/api/ai/threads" \
  -H "Content-Type: application/json" \
  -H "x-api-key: sk-x-your-api-key" \
  -d '{}'
```

返回结果中会包含 `thread_id`。后续运行 xpert 时要继续使用这个线程 ID。

### 4. 调用 `runs/stream`

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
          "input": "你好，请介绍一下你能做什么？"
        }
      }
    }
  }'
```

这个接口会以 SSE 形式持续返回事件流，适合实时聊天和前端流式展示。

### 5. 可选：上传文件后再发起对话

如果你的 xpert 需要读取附件，可以先上传上下文文件：

```bash
curl -X POST "https://api.xpertai.cn/api/ai/contexts/file" \
  -H "x-api-key: sk-x-your-api-key" \
  -F "file=@./manual.pdf"
```

上传成功后，可将返回结果中的文件对象作为 `files` 传给运行请求：

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
          "input": "请总结附件重点。",
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

## 鉴权与安全说明

### `apiKey` 与 `client_secret` 的区别

- `apiKey`
  - 长期凭据
  - 适合服务端到服务端调用
  - 不应该暴露给浏览器
- `client_secret`
  - 短期凭据
  - 适合 ChatKit UI 或前端侧短时访问
  - 由 `POST /api/ai/v1/chatkit/sessions` 签发

### 什么时候需要 `client_secret`

如果你是：

- 在自己的服务端使用 SDK 调用 XpertAI
- 在自己的服务端直接发起 REST 调用

那么通常只需要 `apiKey`。

如果你是：

- 在浏览器里嵌入 ChatKit UI
- 需要把一个短期凭据交给前端侧运行时

那么应该由你自己的后端换取 `client_secret`，再把它返回给前端。

### `chatkit/sessions` 的正确调用方式

`POST /api/ai/v1/chatkit/sessions` 只用于换取短期 `client_secret`。当前接口请求体只需要传递 `expires_after`：

```bash
curl -X POST "https://api.xpertai.cn/api/ai/v1/chatkit/sessions" \
  -H "Content-Type: application/json" \
  -H "x-api-key: sk-x-your-api-key" \
  -d '{
    "expires_after": 600
  }'
```

请注意：

- 不需要在请求体中传 `xpert`
- 不需要在请求体中传 `user`
- 如果需要固定组织或业务用户上下文，请通过请求头传递 `organization-id` 和 `x-principal-user-id`

### 安全建议

- 永远不要在浏览器中暴露长期 `apiKey`
- 前端只持有短期 `client_secret`
- 如果使用 xpert 专用 key，请确保它绑定的 xpert 与实际访问目标一致
- 需要审计终端用户身份时，在服务端换取 `client_secret` 阶段传入 `x-principal-user-id`

## 下一步

- 如果你要嵌入前端聊天 UI，请先阅读 [💬 ChatKit SDK](./index)
- 如果你要继续自定义视觉与交互，请查看 [主题和自定义](./chatkit-themes)、[小部件](./chatkit-widgets)、[客户端工具](./chatkit-tool)
