---
sidebar_position: 7
title: Managed Queues
---

Managed Queues let plugins run background jobs without owning BullMQ infrastructure.

The platform owns the Redis connection, physical BullMQ queue, worker, retries, delayed scheduling, cancellation, and tenant context restoration. A plugin only enqueues a logical job and declares a handler for `{pluginName, queueName, jobName}`.

Use Managed Queues for plugin work that must happen after the current request returns:

- outbound messages and notifications
- inbound event aggregation or debounce windows
- retryable third-party API calls
- delayed follow-up work
- long-running plugin tasks that should not block HTTP callbacks

Do not create plugin-local `BullModule.forRoot()`, `BullModule.registerQueue()`, `@Processor()`, `WorkerHost`, or `InjectQueue` for new plugin jobs.

## Why Plugins Should Not Own BullMQ

Plugin-owned BullMQ setups are easy in a single process, but fragile in production:

- different tenants can install the same plugin and collide on queue names or Redis keys
- workers run without an HTTP request, so tenant and organization context can be lost
- every plugin creates its own Redis connection and retry behavior
- cancellation and delayed scheduling become plugin-specific
- multi-pod debugging has no single platform view

Managed Queues keep the physical queue platform-owned:

```text
xpert:managed-queue:plugin-jobs
```

The plugin identity and logical queue are stored in the job data envelope.

## Enqueue Jobs

Resolve the queue service from the plugin context:

```ts
import {
  MANAGED_QUEUE_SERVICE_TOKEN,
  type ManagedQueueService
} from '@xpert-ai/plugin-sdk'

const managedQueue = ctx.resolve<ManagedQueueService>(MANAGED_QUEUE_SERVICE_TOKEN)
```

Enqueue a job:

```ts
const result = await managedQueue.enqueue({
  pluginName: '@xpert-ai/plugin-community-wechat',
  queueName: 'wechat.outbound',
  jobName: 'send-message',
  payload: {
    integrationId,
    outboundLogId
  },
  tenantId,
  organizationId,
  scopeKey,
  jobId: `wechat:outbound:${outboundLogId}`,
  delayMs: 1_000,
  attempts: 3,
  backoffMs: {
    type: 'fixed',
    delay: 60_000
  },
  removeOnComplete: {
    age: 24 * 60 * 60,
    count: 5000
  }
})
```

Store `result.jobId` in your plugin business table when users may cancel, inspect, or retry the task later.

Cancel a waiting or delayed job:

```ts
await managedQueue.cancel({ jobId: result.jobId })
```

If the job is already active, completed, or failed, the platform returns a non-success result and the plugin should use its business state to decide what to show.

## Declare Job Processors

Use `@PluginJobProcessor()` instead of BullMQ `@Processor()`:

```ts
import {
  PluginJobProcessor,
  type ManagedQueueJob
} from '@xpert-ai/plugin-sdk'

@PluginJobProcessor({
  pluginName: '@xpert-ai/plugin-community-wechat',
  queueName: 'wechat.outbound',
  jobName: 'send-message',
  concurrency: 1
})
@Injectable()
export class WechatOutboundJobHandler {
  async handle(job: ManagedQueueJob<WechatOutboundQueueJobData>) {
    await this.queueService.processSendTextJob(job)
  }
}
```

The platform restores tenant and organization context from the job envelope before calling `handle()`.

One class can handle multiple logical job names:

```ts
@PluginJobProcessor({ pluginName, queueName: 'wechat.inbound', jobName: 'aggregate' })
@PluginJobProcessor({ pluginName, queueName: 'wechat.inbound', jobName: 'flush' })
@Injectable()
export class WechatInboundJobHandler {
  async handle(job: ManagedQueueJob<InboundJobData>) {
    if (job.name === 'aggregate') {
      return this.aggregate(job.data)
    }
    if (job.name === 'flush') {
      return this.flush(job.data)
    }
  }
}
```

## Redis State And Locks

If the plugin needs rate-limit state, aggregation state, or distributed locks, use platform Redis from `ManagedQueueService.getRedis()`:

```ts
const redis = await managedQueue.getRedis()
await redis.set(lockKey, '1', 'PX', 30_000, 'NX')
```

Always scope Redis keys. Good key components include:

- `pluginName`
- `tenantId`
- `organizationId`
- `integrationId`
- account id or external conversation id

Example:

```text
plugin_wechat:{tenantId}:{integrationId}:lock:outbound
plugin_wechat:{tenantId}:{organizationId}:inbound:{aggregateKey}
```

Do not read Redis through BullMQ private clients.

## Retry And Failure

A handler should throw when the job should be retried:

```ts
async handle(job: ManagedQueueJob<Payload>) {
  try {
    await this.send(job.data)
  } catch (error) {
    await this.recordFailure(job, error)
    throw error
  }
}
```

BullMQ applies `attempts` and `backoffMs`. The plugin should still update its own business records, such as message logs or integration health.

## Concurrency

`concurrency` limits local calls to the same logical handler in the current API process. It does not guarantee cluster-wide serial execution.

For cross-pod ordering or rate limits, use Redis locks or business state. For example, an outbound messaging plugin should still lock by tenant and integration before sending.

## Migrating Existing Plugins

When moving a plugin from self-managed BullMQ to Managed Queues:

1. remove BullMQ imports and module registration from the plugin package
2. replace `queue.add()` with `ManagedQueueService.enqueue()`
3. replace direct job removal with `ManagedQueueService.cancel()`
4. replace `@Processor()` classes with `@PluginJobProcessor()` handlers
5. move Redis state and locks to platform Redis
6. include tenant, organization, and integration scope in all keys
7. ensure the handler can run without an HTTP request
8. drain old physical queues before deployment

For the WeChat community plugin, old queue consumers are intentionally not kept. Operators must drain old `plugin_wechat` BullMQ queues before switching production traffic to the Managed Queue version.
