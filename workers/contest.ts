import { Worker } from "bullmq";
import { advanceChallenge, reconcileChallenges } from "../lib/challenge-lifecycle";
import { superviseWorker } from "../lib/worker-runtime";
if (!process.env.REDIS_URL) throw new Error("REDIS_URL is required");
const u = new URL(process.env.REDIS_URL); const connection = { host: u.hostname, port: Number(u.port || 6379), username: u.username || undefined, password: u.password || undefined, tls: u.protocol === "rediss:" ? {} : undefined };
const worker = new Worker("contest-lifecycle", async (job) => job.name === "advance" && job.data.challengeId ? advanceChallenge(String(job.data.challengeId)) : reconcileChallenges(), { connection, concurrency: 1 });
worker.on("failed", (job, error) => console.error("contest lifecycle failed", job?.id, error.name));
console.log("Echo contest lifecycle worker ready");
superviseWorker(worker, "contest-lifecycle");
