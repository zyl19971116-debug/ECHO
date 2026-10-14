import { createHash } from "crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { generationQueue } from "@/lib/generation-queue";
import { moderatePrompt } from "@/lib/moderation";
import { reserveQuota, refundQuota, releaseReservation, utcDay } from "@/lib/quota";
import { clientIp, hasTrustedOrigin } from "@/lib/request-security";
import { enforceRateLimit } from "@/lib/rate-limit";

const S = z.object({ prompt: z.string().min(8).max(800), style: z.enum(["FUTURISTIC", "ABSTRACT", "CYBERPUNK", "MINIMAL", "SURREAL", "SCULPTURE"]), format: z.enum(["SQUARE", "LANDSCAPE", "PORTRAIT"]), requestId: z.string().uuid() });
export async function POST(req: Request) {
  if (!hasTrustedOrigin(req)) return NextResponse.json({ error: "UNTRUSTED_ORIGIN" }, { status: 403 });
  const me = await currentUser();
  if (!me) return NextResponse.json({ error: "CONNECT_WALLET_AND_SIGN_IN_FIRST" }, { status: 401 });
  if (!process.env.OPENAI_API_KEY || !process.env.REDIS_URL || !process.env.DATABASE_URL) return NextResponse.json({ error: "GENERATION_INFRASTRUCTURE_NOT_CONFIGURED" }, { status: 503 });
  let reserved = false; let createdId: string | undefined; const day = utcDay();
  try {
    const input = S.parse(await req.json());
    const existing = await db.generationJob.findUnique({ where: { idempotencyKey: input.requestId } });
    if (existing) {
      if (existing.userId !== me.userId) return NextResponse.json({ error: "REQUEST_ID_CONFLICT" }, { status: 409 });
      return NextResponse.json({ jobId: existing.id, status: existing.status }, { status: 202 });
    }
    await Promise.all([
      enforceRateLimit(`ai:ip:${clientIp(req)}`, 10, 3600), enforceRateLimit(`ai:user:${me.userId}`, 8, 3600),
      enforceRateLimit(`ai:wallet:${me.address}`, 8, 3600), enforceRateLimit(`ai:session:${me.sessionId}`, 8, 3600),
      enforceRateLimit(`ai:global:${day}`, Number(process.env.GLOBAL_DAILY_GENERATION_LIMIT || 500), 90000),
    ]);
    const active = await db.generationJob.count({ where: { status: { in: ["QUEUED", "PROCESSING", "RETRYING"] } } });
    if (active >= Number(process.env.MAX_CONCURRENT_GENERATIONS || 10)) throw new Error("GENERATION_CAPACITY_REACHED");
    const challenge = await db.challenge.findFirst({ where: { status: "SUBMISSION", submissionStart: { lte: new Date() }, submissionEnd: { gt: new Date() } }, orderBy: { number: "desc" } });
    if (!challenge) return NextResponse.json({ error: "NO_ACTIVE_SUBMISSION_PHASE" }, { status: 409 });
    const moderation = await moderatePrompt(input.prompt);
    if (!moderation.approved) {
      const rejected = await db.generationJob.create({ data: { userId: me.userId, challengeId: challenge.id, prompt: input.prompt, style: input.style, format: input.format, idempotencyKey: input.requestId, status: "REJECTED", moderationStatus: "REJECTED", errorCode: "PROMPT_REJECTED", error: "This prompt cannot be used for the public competition." } });
      await audit("AI_PROMPT_REJECTED", "GenerationJob", rejected.id, me.userId, { promptHash: createHash("sha256").update(input.prompt).digest("hex") });
      return NextResponse.json({ jobId: rejected.id, status: rejected.status, error: rejected.error }, { status: 422 });
    }
    try { await enforceRateLimit(`ai:budget:${day}`, Math.max(1, Math.floor(Number(process.env.GLOBAL_DAILY_COST_BUDGET || 25) / Number(process.env.AI_ESTIMATED_COST_PER_IMAGE || 0.05))), 90000); }
    catch (error) { if (error instanceof Error && error.message === "RATE_LIMITED") throw new Error("GLOBAL_COST_BUDGET_REACHED"); throw error; }
    await reserveQuota(me.userId, day); reserved = true;
    const job = await db.generationJob.create({ data: { userId: me.userId, challengeId: challenge.id, prompt: input.prompt, style: input.style, format: input.format, idempotencyKey: input.requestId, quotaDay: day, status: "QUEUED", moderationStatus: "APPROVED" } });
    createdId = job.id;
    await audit("GENERATION_QUOTA_RESERVED", "GenerationJob", job.id, me.userId, { day });
    await audit("AI_GENERATION_REQUESTED", "GenerationJob", job.id, me.userId, { promptHash: createHash("sha256").update(input.prompt).digest("hex") });
    await generationQueue().add("generate", { generationId: job.id }, { jobId: job.id, attempts: 3, backoff: { type: "exponential", delay: 3000 }, removeOnComplete: 100 });
    return NextResponse.json({ jobId: job.id, status: job.status }, { status: 202 });
  } catch (error) {
    if (reserved) {
      if (createdId) {
        await db.generationJob.updateMany({ where: { id: createdId, status: "QUEUED" }, data: { status: "FAILED", errorCode: "QUEUE_ENQUEUE_FAILED", error: "The generation queue is unavailable. Your quota was returned." } }).catch(() => undefined);
        await refundQuota(me.userId, day, createdId).catch(() => undefined);
        await audit("GENERATION_QUOTA_REFUNDED", "GenerationJob", createdId, me.userId, { day, reasonCode: "QUEUE_ENQUEUE_FAILED" }).catch(() => undefined);
      }
      else await releaseReservation(me.userId, day).catch(() => undefined);
    }
    const raw = error instanceof Error ? error.message : "INVALID_GENERATION_REQUEST";
    const allowed = ["DAILY_GENERATION_LIMIT_REACHED", "GENERATION_CAPACITY_REACHED", "GLOBAL_COST_BUDGET_REACHED", "RATE_LIMITED", "RATE_LIMIT_UNAVAILABLE"];
    const code = allowed.includes(raw) ? raw : raw.startsWith("[") ? "INVALID_GENERATION_REQUEST" : "GENERATION_SERVICE_UNAVAILABLE";
    const status = ["DAILY_GENERATION_LIMIT_REACHED", "GLOBAL_COST_BUDGET_REACHED", "RATE_LIMITED"].includes(code) ? 429 : code.includes("CAPACITY") || code.includes("UNAVAILABLE") ? 503 : 400;
    return NextResponse.json({ error: code }, { status });
  }
}
