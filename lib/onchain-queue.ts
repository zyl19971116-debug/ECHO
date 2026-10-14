import "server-only";
import { Queue } from "bullmq";
function connection() { if (!process.env.REDIS_URL) throw new Error("REDIS_NOT_CONFIGURED"); const u = new URL(process.env.REDIS_URL); return { host: u.hostname, port: Number(u.port || 6379), username: u.username || undefined, password: u.password || undefined, tls: u.protocol === "rediss:" ? {} : undefined }; }
let queue: Queue | undefined;
export function onchainQueue() { queue ||= new Queue("onchain-rewards", { connection: connection() }); return queue; }
export async function enqueueResult(challengeId: string) { return onchainQueue().add("result", { kind: "result", challengeId }, { jobId: `result-${challengeId}`, attempts: 8, backoff: { type: "exponential", delay: 15_000 }, removeOnComplete: 100 }); }
export async function enqueueAward(challengeId: string, rank: number) { return onchainQueue().add("award", { kind: "award", challengeId, rank }, { jobId: `award-${challengeId}-${rank}`, attempts: 8, backoff: { type: "exponential", delay: 15_000 }, removeOnComplete: 100 }); }
