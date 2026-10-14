import { Worker } from "bullmq";
import { runOnchainJob } from "../lib/onchain-jobs";
import { superviseWorker } from "../lib/worker-runtime";
if (!process.env.REDIS_URL) throw new Error("REDIS_NOT_CONFIGURED");
const u = new URL(process.env.REDIS_URL); const connection = { host: u.hostname, port: Number(u.port || 6379), username: u.username || undefined, password: u.password || undefined, tls: u.protocol === "rediss:" ? {} : undefined };
const worker = new Worker("onchain-rewards", async (job) => runOnchainJob(job.data), { connection, concurrency: 1 });
worker.on("failed", (job, error) => console.error(JSON.stringify({ level: "error", event: "onchain_job_failed", jobId: job?.id, error: error.name })));
superviseWorker(worker, "onchain-rewards");
