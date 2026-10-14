import "server-only";
import { Queue } from "bullmq";
function connection() { if (!process.env.REDIS_URL) throw new Error("REDIS_NOT_CONFIGURED"); const url = new URL(process.env.REDIS_URL); return { host: url.hostname, port: Number(url.port || 6379), username: url.username || undefined, password: url.password || undefined, tls: url.protocol === "rediss:" ? {} : undefined }; }
let queue: Queue | undefined;
export function generationQueue() { queue ||= new Queue("image-generation", { connection: connection() }); return queue; }
