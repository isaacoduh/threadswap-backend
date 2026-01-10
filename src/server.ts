import 'dotenv/config'
import '@/types/express.request-id'
import http from 'http'
import { createApp } from '@/app'
import { ensureRedisSessionConnected } from '@/common/redis/redis.session.client'
import { createSocketServer } from './modules/realtime/socket/socket.server'
import { logger } from './common/logging/logger'

const port = Number(process.env.PORT ?? 8080)

async function main() {
  await ensureRedisSessionConnected()

  const app = createApp()
  const httpServer = http.createServer(app)

  // attach socket.io
  createSocketServer(httpServer)

  httpServer.listen(port, () => {
    logger.info('server_started', { port })
  })
}

main().catch((err) => {
  console.error('[backend-api] failed to start', err)
  process.on('unhandledRejection', (reason) => {
    logger.error('unhandledRejection', { reason })
  })

  process.on('uncaughtException', (err) => {
    logger.error('uncaughtException', { err })
    process.exit(1)
  })
  process.exit(1)
})
