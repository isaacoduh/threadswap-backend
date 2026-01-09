import session from 'express-session'
import { RedisStore } from 'connect-redis'
import { redisSessionClient } from '@/common/redis/redis.session.client'

const secret = process.env.SESSION_SECRET as string
if (!secret) throw new Error('SESSION_SECRET is not set')

const cookieName = process.env.SESSION_COOKIE_NAME ?? 'threadswap.sid'
const ttlSeconds = Number(process.env.SESSION_TTL_SECONDS ?? 60 * 60 * 24 * 14) // 14 days

export function sessionMiddleware() {
  return session({
    name: cookieName,
    secret,
    resave: false,
    saveUninitialized: false,
    rolling: true,
    store: new RedisStore({
      client: redisSessionClient,
      prefix: 'sess:',
      ttl: ttlSeconds,
    }),
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: ttlSeconds * 1000,
    },
  })
}
