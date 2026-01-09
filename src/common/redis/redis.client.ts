import Redis from "ioredis"

const redisUrl = process.env.REDIS_URL as string;
if(!redisUrl) throw new Error("REDIS_URL is not set");

declare global {
    // eslint-disable-next-line no-var
    var __redis: Redis | undefined
}

function createClient() {
    return new Redis(redisUrl, {
        maxRetriesPerRequest: 2,
        enableReadyCheck: true,
        lazyConnect: false
    })
}

export const redis = global.__redis ?? createClient();

if (process.env.NODE_ENV !== "production") {
  global.__redis = redis;
}