import { createHash } from "crypto";
import { db } from "@/lib/db";
import { audit } from "@/lib/audit";
export type RankedSubmission = { submissionId: string; voteCount: number; createdAt: Date };
export function rankSubmissions(rows: RankedSubmission[]) { return [...rows].sort((a, b) => b.voteCount - a.voteCount || a.createdAt.getTime() - b.createdAt.getTime() || a.submissionId.localeCompare(b.submissionId)).map((row, i) => ({ ...row, rank: i + 1 })); }
export function resultHash(challengeId: string, ranked: ReturnType<typeof rankSubmissions>, version = 1) { const canonical = JSON.stringify({ challengeId, version, entries: ranked.map((x) => ({ rank: x.rank, submissionId: x.submissionId, voteCount: x.voteCount })) }); return createHash("sha256").update(canonical).digest("hex"); }
export async function settleChallenge(challengeId: string, now = new Date()) {
  const existing = await db.challengeResult.findUnique({ where: { challengeId } }); if (existing) return existing;
  const challenge = await db.challenge.findUnique({ where: { id: challengeId } });
  if (!challenge || now < challenge.votingEnd) throw new Error("VOTING_NOT_ENDED");
  await db.settlementJob.upsert({ where: { challengeId }, update: { status: "PROCESSING", attempts: { increment: 1 }, errorCode: null }, create: { challengeId, status: "PROCESSING", attempts: 1 } });
  try {
    const submissions = await db.submission.findMany({ where: { challengeId, status: "SUBMITTED" }, select: { id: true, createdAt: true, _count: { select: { votes: { where: { createdAt: { lte: challenge.votingEnd } } } } } } });
    const ranked = rankSubmissions(submissions.map((x) => ({ submissionId: x.id, voteCount: x._count.votes, createdAt: x.createdAt })));
    if (!ranked.length) { await db.settlementJob.update({ where: { challengeId }, data: { status: "NO_SUBMISSIONS", settledAt: now } }); return null; }
    const hash = resultHash(challengeId, ranked);
    const result = await db.$transaction(async (tx) => {
      const found = await tx.challengeResult.findUnique({ where: { challengeId } }); if (found) return found;
      const created = await tx.challengeResult.create({ data: { challengeId, winnerSubmissionId: ranked[0].submissionId, resultHash: hash, finalizedAt: now, totalVotes: ranked.reduce((n, x) => n + x.voteCount, 0), settlementVersion: 1 } });
      await tx.challengeResultEntry.createMany({ data: ranked.map((x) => ({ challengeId, resultId: created.id, submissionId: x.submissionId, rank: x.rank, voteCount: x.voteCount })) });
      for (const entry of ranked.slice(0, 3)) await tx.award.upsert({ where: { challengeId_rank: { challengeId, rank: entry.rank } }, update: {}, create: { challengeId, submissionId: entry.submissionId, userId: (await tx.submission.findUniqueOrThrow({ where: { id: entry.submissionId }, select: { creatorUserId: true } })).creatorUserId, rank: entry.rank } });
      await tx.settlementJob.update({ where: { challengeId }, data: { status: "COMPLETED", settledAt: now } });
      return created;
    });
    await audit("CHALLENGE_SETTLED", "Challenge", challengeId, undefined, { resultHash: hash, totalVotes: result.totalVotes }); return result;
  } catch (error) {
    const racedResult = await db.challengeResult.findUnique({ where: { challengeId } });
    if (racedResult) { await db.settlementJob.update({ where: { challengeId }, data: { status: "COMPLETED", settledAt: racedResult.finalizedAt, errorCode: null } }); return racedResult; }
    await db.settlementJob.update({ where: { challengeId }, data: { status: "FAILED", errorCode: error instanceof Error ? error.name : "UNKNOWN" } }); await audit("CHALLENGE_SETTLEMENT_FAILED", "Challenge", challengeId, undefined, { reasonCode: error instanceof Error ? error.name : "UNKNOWN" }); throw error;
  }
}
