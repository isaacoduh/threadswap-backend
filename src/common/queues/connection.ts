import IORedis from 'ioredis'

const redisUrl = process.env.REDIS_URL as string
if (!redisUrl) throw new Error('REDIS_URL is not set')

export function createBullConnection() {
  return new IORedis(redisUrl, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  })
}
