import { Worker } from 'bullmq'
import { createBullConnection } from '@/common/queues/connection'

const prefix = process.env.BULLMQ_PREFIX ?? 'threadswap'

// scheduler is required for delayed jobs / retries with backoff / stalled checks to work correctly

export function startExampleWorker() {
  const connection: any = createBullConnection()

  // keep one scheduler instance running per queue (can be in the worker process)

  const worker = new Worker(
    'example',
    async (job) => {
      if (job.name === 'log_message') {
        console.log('[job] log_message:', job.data)
        return { ok: true }
      }
      return { ok: false }
    },
    {
      connection,
      prefix,
      concurrency: 5,
    }
  )
  worker.on('completed', (job) => console.log(`[job] completed ${job.id}`))
  worker.on('failed', (job, err) => console.error(`[job] failed ${job?.id}`, err))

  return worker
}
