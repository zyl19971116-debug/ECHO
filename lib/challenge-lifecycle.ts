import type { ChallengeStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { audit } from "@/lib/audit";
import { settleChallenge } from "@/lib/settlement";

type TimedChallenge = { status: ChallengeStatus; submissionStart: Date; submissionEnd: Date; votingStart: Date | null; votingEnd: Date; revealAt: Date };
export function desiredChallengeStatus(c: TimedChallenge, _hasResult: boolean, now = new Date()): ChallengeStatus {
  if (now >= c.revealAt) return "REVEAL";
  if (now >= c.votingEnd) return "FINALIZED";
  if (now >= (c.votingStart || c.submissionEnd)) return "VOTING";
  if (now >= c.submissionStart) return "SUBMISSION";
  return "DRAFT";
}
const order: ChallengeStatus[] = ["DRAFT", "SUBMISSION", "VOTING", "FINALIZED", "REVEAL"];
export async function advanceChallenge(id: string, now = new Date()) {
  let challenge = await db.challenge.findUnique({ where: { id }, include: { result: true } }); if (!challenge) return null;
  if (!challenge.publishedAt) return challenge;
  let target = desiredChallengeStatus(challenge, Boolean(challenge.result), now);
  while (order.indexOf(challenge.status) < order.indexOf(target)) {
    const next = order[order.indexOf(challenge.status) + 1];
    const changed = await db.challenge.updateMany({ where: { id, status: challenge.status }, data: { status: next } });
    if (!changed.count) { challenge = await db.challenge.findUniqueOrThrow({ where: { id }, include: { result: true } }); continue; }
    await db.challengeTransitionLog.upsert({ where: { challengeId_fromStatus_toStatus: { challengeId: id, fromStatus: challenge.status, toStatus: next } }, update: {}, create: { challengeId: id, fromStatus: challenge.status, toStatus: next, transitionedAt: now } });
    await audit("CHALLENGE_STATUS_CHANGED", "Challenge", id, undefined, { from: challenge.status, to: next });
    challenge = await db.challenge.findUniqueOrThrow({ where: { id }, include: { result: true } });
    if (next === "FINALIZED") { await settleChallenge(id, now); challenge = await db.challenge.findUniqueOrThrow({ where: { id }, include: { result: true } }); target = desiredChallengeStatus(challenge, Boolean(challenge.result), now); }
    if (next === "REVEAL" && challenge.result) {
      await createEchoContinuation(id, now);
      if (process.env.ECHO_MAINNET_REGISTRY_ADDRESS && process.env.MAINNET_AWARD_MINTER_PRIVATE_KEY && process.env.MAINNET_TRANSACTION_APPROVED === "true" && process.env.REDIS_URL) {
        const { enqueueResult } = await import("@/lib/onchain-queue");
        await enqueueResult(id);
        await audit("ONCHAIN_RESULT_AUTO_QUEUED", "Challenge", id);
      }
    }
  }
  return challenge;
}
export async function reconcileChallenges(now = new Date()) {
  const rows = await db.challenge.findMany({ where: { publishedAt: { not: null }, status: { not: "REVEAL" }, submissionStart: { lte: now } }, select: { id: true } });
  for (const row of rows) await advanceChallenge(row.id, now);
  return rows.length;
}
export async function createEchoContinuation(challengeId: string, now = new Date()) {
  const existing = await db.echoChainNode.findUnique({ where: { challengeId } }); if (existing) return existing;
  return db.$transaction(async (tx) => {
    const challenge = await tx.challenge.findUniqueOrThrow({ where: { id: challengeId }, include: { result: { include: { winner: true } } } });
    if (!challenge.result) throw new Error("RESULT_REQUIRED");
    const previous = await tx.echoChainNode.findFirst({ orderBy: { createdAt: "desc" } });
    const last = await tx.challenge.findFirst({ orderBy: { number: "desc" }, select: { number: true } });
    const start = new Date(now.getTime() + 24 * 60 * 60_000); const submissionEnd = new Date(start.getTime() + 24 * 60 * 60_000); const votingEnd = new Date(submissionEnd.getTime() + 24 * 60 * 60_000); const revealAt = new Date(votingEnd.getTime() + 60 * 60_000);
    const next = await tx.challenge.create({ data: { number: (last?.number || 0) + 1, title: `Echo of ${challenge.title}`, description: `Moderator review required. Inspired by winning work: ${challenge.result.winner.title}.`, theme: `PENDING_MODERATION · ${challenge.theme}`, submissionStart: start, submissionEnd, votingStart: submissionEnd, votingEnd, revealAt, status: "DRAFT" } });
    return tx.echoChainNode.create({ data: { challengeId, previousNodeId: previous?.id, nextChallengeId: next.id, relation: `Winner “${challenge.result.winner.title}” continues into a moderator-reviewed draft.` } });
  });
}
