import { createClient } from 'redis'

const redisUrl = process.env.REDIS_URL
if (!redisUrl) throw new Error('REDIS_URL is not set')

export const redisSessionClient = createClient({ url: redisUrl })

redisSessionClient.on('error', (err) => {
  console.error('[redis] error', err)
})

export async function ensureRedisSessionConnected() {
  if (!redisSessionClient.isOpen) {
    await redisSessionClient.connect()
    console.log('[redis] connected')
  }
}
