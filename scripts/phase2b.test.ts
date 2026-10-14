import assert from "node:assert/strict";
import test from "node:test";
import sharp from "sharp";
import { normalizeGeneratedImage } from "../lib/image-processing";
import { claimQuotaSlot, utcDay } from "../lib/quota";
import { failedAttemptStatus } from "../lib/worker-state";
import { publicSubmissionSelect } from "../lib/public-dto";
import { containsSensitivePromptData } from "../lib/moderation";

test("normalizes PNG bytes and computes a real SHA-256", async () => {
  const raw = await sharp({ create: { width: 2, height: 2, channels: 4, background: "#00ffff" } }).png().toBuffer();
  const result = await normalizeGeneratedImage(raw);
  assert.equal(result.mimeType, "image/png");
  assert.match(result.sha256, /^[a-f0-9]{64}$/);
  assert.equal(result.bytes.length > 0, true);
});

test("rejects invalid image bytes and oversized images", async () => {
  await assert.rejects(() => normalizeGeneratedImage(Buffer.from("not an image")), /Input buffer|IMAGE/);
  await assert.rejects(() => normalizeGeneratedImage(Buffer.alloc(10), 5), /IMAGE_SIZE_INVALID/);
});

test("quota claim is atomic under concurrent requests and resets by UTC day", async () => {
  const counts = new Map<string, number>();
  const tx = { generationQuota: {
    async upsert({ create }: any) { if (!counts.has(`${create.userId}:${create.day}`)) counts.set(`${create.userId}:${create.day}`, 0); },
    async updateMany({ where }: any) { const key = `${where.userId}:${where.day}`; const value = counts.get(key) || 0; if (value >= where.reserved.lt) return { count: 0 }; counts.set(key, value + 1); return { count: 1 }; },
    async findUniqueOrThrow({ where }: any) { return { reserved: counts.get(`${where.userId_day.userId}:${where.userId_day.day}`) }; },
  } };
  const results = await Promise.allSettled(Array.from({ length: 7 }, () => claimQuotaSlot(tx, "user", "2026-10-14", 5)));
  assert.equal(results.filter((x) => x.status === "fulfilled").length, 5);
  await assert.doesNotReject(() => claimQuotaSlot(tx, "user", "2026-10-15", 5));
  assert.equal(utcDay(new Date("2026-10-15T00:00:00Z")), "2026-10-15");
});

test("worker marks intermediate failures as retrying and only final attempt failed", () => {
  assert.equal(failedAttemptStatus(1, 3), "RETRYING");
  assert.equal(failedAttemptStatus(3, 3), "FAILED");
});

test("public submission DTO excludes identity and private storage fields", () => {
  assert.equal("creatorUserId" in publicSubmissionSelect, false);
  assert.equal("assetId" in publicSubmissionSelect, false);
  assert.equal("creator" in publicSubmissionSelect, false);
});
test("server prompt screening detects wallet, email and phone-shaped personal data", () => {
  assert.equal(containsSensitivePromptData("paint 0x0000000000000000000000000000000000000001"), true);
  assert.equal(containsSensitivePromptData("portrait for me@example.com"), true);
  assert.equal(containsSensitivePromptData("call +1 415 555 0123"), true);
  assert.equal(containsSensitivePromptData("an abstract glass city at dawn"), false);
});
