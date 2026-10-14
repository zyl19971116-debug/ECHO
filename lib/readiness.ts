import "server-only";
import { createClient } from "redis";
import { Queue } from "bullmq";
import { db } from "@/lib/db";
import { storage } from "@/lib/storage";
import { checkedPublicClient, contractAddresses } from "@/lib/onchain-config";
const limited = async (fn: () => Promise<unknown>, ms = 5000) => Promise.race([fn(), new Promise((_, reject) => setTimeout(() => reject(new Error("TIMEOUT")), ms))]);
export async function readiness() {
  const checks: Record<string, { ok: boolean; configured: boolean; waiting?: number; failed?: number }> = {};
  checks.postgresql = await check(Boolean(process.env.DATABASE_URL), () => db.$queryRaw`SELECT 1`);
  checks.redis = await check(Boolean(process.env.REDIS_URL), async () => { const client = createClient({ url: process.env.REDIS_URL }); try { await client.connect(); await client.ping(); } finally { if (client.isOpen) await client.quit(); } });
  if (process.env.REDIS_URL) { try { const u = new URL(process.env.REDIS_URL); const connection = { host: u.hostname, port: Number(u.port || 6379), username: u.username || undefined, password: u.password || undefined, tls: u.protocol === "rediss:" ? {} : undefined }; const queues = await Promise.all(["image-generation", "contest-lifecycle", "onchain-rewards"].map(async (name) => { const queue = new Queue(name, { connection }); try { const counts = await queue.getJobCounts("waiting", "delayed", "failed"); return { waiting: counts.waiting + counts.delayed, failed: counts.failed }; } finally { await queue.close(); } })); checks.queues = { ok: true, configured: true, waiting: queues.reduce((n, x) => n + x.waiting, 0), failed: queues.reduce((n, x) => n + x.failed, 0) }; } catch { checks.queues = { ok: false, configured: true }; } } else checks.queues = { ok: false, configured: false };
  checks.storage = await check(Boolean(process.env.S3_BUCKET && process.env.S3_ACCESS_KEY_ID && process.env.S3_SECRET_ACCESS_KEY && process.env.PUBLIC_ASSET_BASE_URL), () => storage.healthCheck());
  checks.ai = { ok: Boolean(process.env.OPENAI_API_KEY && process.env.OPENAI_IMAGE_MODEL), configured: Boolean(process.env.OPENAI_API_KEY) };
  checks.blockchain = await check(Boolean(process.env.ROBINHOOD_MAINNET_RPC_URL), () => checkedPublicClient().then(() => undefined));
  checks.contracts = await check(Boolean(process.env.ECHO_MAINNET_NFT_ADDRESS && process.env.ECHO_MAINNET_REGISTRY_ADDRESS), async () => { contractAddresses(); });
  checks.walletConnect = { ok: Boolean(process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID), configured: Boolean(process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID) };
  checks.origin = { ok: Boolean(process.env.NEXT_PUBLIC_APP_URL?.startsWith("https://")), configured: Boolean(process.env.NEXT_PUBLIC_APP_URL) };
  return { ready: Object.values(checks).every((x) => x.ok), checks };
}
async function check(configured: boolean, fn: () => Promise<unknown>) { if (!configured) return { ok: false, configured: false }; try { await limited(fn); return { ok: true, configured: true }; } catch { return { ok: false, configured: true }; } }
