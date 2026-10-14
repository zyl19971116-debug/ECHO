import { Worker } from "bullmq";
import OpenAI from "openai";
import { db } from "../lib/db";
import { audit } from "../lib/audit";
import { moderateImage } from "../lib/moderation";
import { confirmQuota, refundQuota } from "../lib/quota";
import { storage } from "../lib/storage";
import { normalizeGeneratedImage } from "../lib/image-processing";
import { failedAttemptStatus } from "../lib/worker-state";
import { superviseWorker } from "../lib/worker-runtime";

if (!process.env.REDIS_URL || !process.env.OPENAI_API_KEY) throw new Error("REDIS_URL and OPENAI_API_KEY are required");
const redis = new URL(process.env.REDIS_URL);
const connection = { host: redis.hostname, port: Number(redis.port || 6379), username: redis.username || undefined, password: redis.password || undefined, tls: redis.protocol === "rediss:" ? {} : undefined };
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const sizes = { SQUARE: "1024x1024", LANDSCAPE: "1536x1024", PORTRAIT: "1024x1536" } as const;

const worker = new Worker("image-generation", async (bullJob) => {
  const id = String(bullJob.data.generationId);
  const row = await db.generationJob.findUniqueOrThrow({ where: { id }, include: { asset: true } });
  if (row.status === "COMPLETED" && row.asset) return;
  await db.generationJob.update({ where: { id }, data: { status: "PROCESSING", attempts: { increment: 1 }, error: null, errorCode: null } });
  try {
    const output = await openai.images.generate({ model: process.env.OPENAI_IMAGE_MODEL || "gpt-image-1", prompt: `${row.prompt}\nVisual style: ${row.style}. No text, signatures, logos, watermarks, faces, wallet addresses, or identity markers.`, size: sizes[row.format as keyof typeof sizes] as "1024x1024" | "1536x1024" | "1024x1536", output_format: "png" });
    const b64 = output.data?.[0]?.b64_json;
    if (!b64) throw new Error("AI_EMPTY_IMAGE");
    const normalized = await normalizeGeneratedImage(Buffer.from(b64, "base64"));
    const { bytes, sha256 } = normalized;
    const moderation = await moderateImage(bytes, "image/png");
    if (!moderation.approved) {
      await db.generationJob.update({ where: { id }, data: { status: "REJECTED", moderationStatus: "REJECTED", errorCode: "IMAGE_REJECTED", error: "The generated image cannot be entered in the public competition." } });
      if (row.quotaDay) await refundQuota(row.userId, row.quotaDay, id);
      await audit("AI_IMAGE_REJECTED", "GenerationJob", id, row.userId);
      return;
    }
    let objectKey: string;
    try { objectKey = await storage.uploadPrivate(bytes, "image/png", sha256, id); }
    catch (error) { await audit("AI_IMAGE_UPLOAD_FAILED", "GenerationJob", id, row.userId, { reasonCode: error instanceof Error ? error.name : "UNKNOWN" }); throw error; }
    const asset = await db.storedAsset.upsert({ where: { objectKey }, update: { mimeType: "image/png", fileSize: bytes.length, sha256, uploadStatus: "UPLOADED" }, create: { provider: process.env.STORAGE_PROVIDER || "s3", objectKey, mimeType: "image/png", fileSize: bytes.length, sha256, uploadStatus: "UPLOADED", visibility: "PRIVATE" } });
    await db.generationJob.update({ where: { id }, data: { status: "COMPLETED", moderationStatus: "APPROVED", assetId: asset.id, imageUrl: null } });
    if (row.quotaDay) await confirmQuota(row.userId, row.quotaDay, id);
    if (row.quotaDay) await audit("GENERATION_QUOTA_CONFIRMED", "GenerationJob", id, row.userId, { day: row.quotaDay });
    await audit("AI_GENERATION_COMPLETED", "GenerationJob", id, row.userId, { assetId: asset.id, sha256 });
  } catch (error) {
    const code = error instanceof Error ? error.message.slice(0, 80) : "GENERATION_FAILED";
    await db.generationJob.update({ where: { id }, data: { errorCode: code, error: "Image generation did not complete. You can retry when the service is available." } });
    throw error;
  }
}, { connection, concurrency: Number(process.env.WORKER_CONCURRENCY || 2), lockDuration: 120_000, stalledInterval: 30_000, maxStalledCount: 1 });

worker.on("failed", async (job, error) => {
  if (!job) return;
  const id = String(job.data.generationId); const final = failedAttemptStatus(job.attemptsMade, Number(job.opts.attempts || 1)) === "FAILED";
  const row = await db.generationJob.update({ where: { id }, data: { status: final ? "FAILED" : "RETRYING", errorCode: final ? "GENERATION_RETRIES_EXHAUSTED" : "GENERATION_RETRYING", error: final ? "Image generation failed after all retry attempts." : "The generation service is retrying this task." } });
  if (final && row.quotaDay) await refundQuota(row.userId, row.quotaDay, id);
  if (final && row.quotaDay) await audit("GENERATION_QUOTA_REFUNDED", "GenerationJob", id, row.userId, { day: row.quotaDay, reasonCode: "RETRIES_EXHAUSTED" });
  await audit(final ? "AI_GENERATION_FAILED" : "AI_GENERATION_RETRYING", "GenerationJob", id, row.userId, { attemptsMade: job.attemptsMade, reasonCode: error.name });
});
console.log("Echo image worker ready");
superviseWorker(worker, "image-generation");
