import { createHash, randomBytes } from "crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { currentUser } from "@/lib/auth";
import { ROBINHOOD_CHAIN_ID } from "@/lib/chain";
import { db } from "@/lib/db";
import { clientIp, expectedOrigin, hasTrustedOrigin } from "@/lib/request-security";
import { enforceRateLimit } from "@/lib/rate-limit";
import { assertVoteTarget, assertVotingOpen } from "@/lib/voting-policy";
const S = z.object({ challengeId: z.string().cuid(), submissionId: z.string().cuid() });
export async function POST(req: Request) {
  if (!hasTrustedOrigin(req)) return NextResponse.json({ error: "UNTRUSTED_ORIGIN" }, { status: 403 });
  const me = await currentUser(); if (!me) return NextResponse.json({ error: "AUTH_REQUIRED" }, { status: 401 });
  try {
    await enforceRateLimit(`vote:nonce:${clientIp(req)}:${me.userId}`, 12, 60);
    const x = S.parse(await req.json()); const challenge = await db.challenge.findUnique({ where: { id: x.challengeId } }); assertVotingOpen(challenge);
    const prior = await db.vote.findUnique({ where: { challengeId_voterUserId: { challengeId: x.challengeId, voterUserId: me.userId } } }); if (prior) throw new Error("ALREADY_VOTED");
    const submission = await db.submission.findUnique({ where: { id: x.submissionId }, include: { asset: true } }); assertVoteTarget(submission, x.challengeId, me.userId);
    const nonce = randomBytes(32).toString("hex"); const nonceHash = createHash("sha256").update(nonce).digest("hex"); const ttl = Math.min(600, Math.max(30, Number(process.env.VOTE_NONCE_TTL_SECONDS || 300))); const expiresAt = new Date(Date.now() + ttl * 1000);
    await db.voteNonce.create({ data: { userId: me.userId, challengeId: x.challengeId, submissionId: x.submissionId, nonceHash, expiresAt } });
    const origin = expectedOrigin(req);
    return NextResponse.json({ nonce, deadline: expiresAt.getTime(), domain: new URL(origin).host, chainId: ROBINHOOD_CHAIN_ID });
  } catch (error) { const code = error instanceof Error ? error.message : "VOTE_NONCE_FAILED"; return NextResponse.json({ error: code }, { status: code === "RATE_LIMITED" ? 429 : code === "RATE_LIMIT_UNAVAILABLE" ? 503 : 409 }); }
}
