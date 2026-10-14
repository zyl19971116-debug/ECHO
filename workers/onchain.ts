import { Worker } from "bullmq";
import { runOnchainJob } from "../lib/onchain-jobs";
import { superviseWorker } from "../lib/worker-runtime";
import { bullWorkerConnection } from "../lib/redis-connection";
if (!process.env.REDIS_URL) throw new Error("REDIS_NOT_CONFIGURED");
const connection = bullWorkerConnection(process.env.REDIS_URL);
const worker = new Worker("onchain-rewards", async (job) => runOnchainJob(job.data), { connection, concurrency: 1 });
worker.on("failed", (job, error) => console.error(JSON.stringify({ level: "error", event: "onchain_job_failed", jobId: job?.id, error: error.name })));
superviseWorker(worker, "onchain-rewards");
