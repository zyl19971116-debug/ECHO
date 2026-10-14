export function bullWorkerConnection(urlValue: string) {
  const url = new URL(urlValue);
  return {
    host: url.hostname,
    port: Number(url.port || 6379),
    username: url.username || undefined,
    password: url.password || undefined,
    tls: url.protocol === "rediss:" ? {} : undefined,
    // BullMQ workers use blocking Redis commands and must not exhaust ioredis retries.
    maxRetriesPerRequest: null,
    enableReadyCheck: true,
  };
}
