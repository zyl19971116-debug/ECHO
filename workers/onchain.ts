import { Worker } from "bullmq";
import { runOnchainJob } from "../lib/onchain-jobs";
if (!process.env.REDIS_URL) throw new Error("REDIS_NOT_CONFIGURED");
const u = new URL(process.env.REDIS_URL); const connection = { host: u.hostname, port: Number(u.port || 6379), username: u.username || undefined, password: u.password || undefined, tls: u.protocol === "rediss:" ? {} : undefined };
new Worker("onchain-rewards", async (job) => runOnchainJob(job.data), { connection, concurrency: 1 });
