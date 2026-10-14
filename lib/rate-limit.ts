import { createClient, type RedisClientType } from "redis";

const globalForRedis = globalThis as unknown as {
  echoRedis?: RedisClientType;
  echoRedisPromise?: Promise<RedisClientType>;
};

async function redisClient() {
  if (!process.env.REDIS_URL) throw new Error("RATE_LIMIT_UNAVAILABLE");
  if (globalForRedis.echoRedis?.isReady) return globalForRedis.echoRedis;
  if (!globalForRedis.echoRedisPromise) {
    const client = createClient({ url: process.env.REDIS_URL });
    client.on("error", () => undefined);
    globalForRedis.echoRedisPromise = client.connect().then(() => {
      globalForRedis.echoRedis = client as RedisClientType;
      return client as RedisClientType;
    });
  }
  return globalForRedis.echoRedisPromise;
}

export async function enforceRateLimit(
  key: string,
  limit: number,
  windowSeconds: number
) {
  try {
    const redis = await redisClient();
    const count = await redis.incr(key);
    if (count === 1) await redis.expire(key, windowSeconds);
    if (count > limit) throw new Error("RATE_LIMITED");
  } catch (error) {
    if (error instanceof Error && error.message === "RATE_LIMITED") throw error;
    throw new Error("RATE_LIMIT_UNAVAILABLE");
  }
}
