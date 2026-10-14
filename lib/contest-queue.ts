import "server-only";
import { Queue } from "bullmq";
function connection() { if (!process.env.REDIS_URL) throw new Error("REDIS_NOT_CONFIGURED"); const u = new URL(process.env.REDIS_URL); return { host: u.hostname, port: Number(u.port || 6379), username: u.username || undefined, password: u.password || undefined, tls: u.protocol === "rediss:" ? {} : undefined }; }
let queue: Queue | undefined;
export function contestQueue() { queue ||= new Queue("contest-lifecycle", { connection: connection() }); return queue; }
export async function scheduleChallenge(challenge: { id: string; submissionStart: Date; votingStart: Date | null; submissionEnd: Date; votingEnd: Date; revealAt: Date }) {
  const times = [challenge.submissionStart, challenge.votingStart || challenge.submissionEnd, challenge.votingEnd, challenge.revealAt];
  for (const [index, at] of times.entries()) await contestQueue().add("advance", { challengeId: challenge.id }, { jobId: `${challenge.id}-${index}`, delay: Math.max(0, at.getTime() - Date.now()), attempts: 5, backoff: { type: "exponential", delay: 5000 }, removeOnComplete: 100 });
  await ensureContestReconciliation();
}
export async function ensureContestReconciliation() { if (process.env.CHALLENGE_SCHEDULER_ENABLED !== "true") return; await contestQueue().upsertJobScheduler("challenge-reconciliation", { every: Number(process.env.CHALLENGE_RECONCILIATION_INTERVAL || 60000) }, { name: "reconcile", data: {} }); }
