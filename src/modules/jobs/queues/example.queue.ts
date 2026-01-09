// PRODUCER
import { Queue } from 'bullmq'
import { createBullConnection } from '@/common/queues/connection'

const connection: any = createBullConnection()

export const exampleQueue = new Queue('example', {
  connection,
  prefix: process.env.BULLMQ_PREFIX ?? 'threadswap',
})

export async function enqueueExampleJob(payload: { message: string }) {
  return exampleQueue.add('log_message', payload, {
    attempts: 3,
    backoff: { type: 'exponential', delay: 1000 },
  })
}
