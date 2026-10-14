import { createHash } from "crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { keccak256, toBytes, verifyMessage } from "viem";
import { audit } from "@/lib/audit";
import { currentUser } from "@/lib/auth";
import { ROBINHOOD_CHAIN_ID } from "@/lib/chain";
import { db } from "@/lib/db";
import { clientIp, expectedOrigin, hasTrustedOrigin } from "@/lib/request-security";
import { enforceRateLimit } from "@/lib/rate-limit";
import { buildVoteMessage } from "@/lib/vote-message";
import { assertVoteTarget, assertVotingOpen } from "@/lib/voting-policy";
import { consumeVoteNonce } from "@/lib/vote-nonce";
const S = z.object({ challengeId: z.string().cuid(), submissionId: z.string().cuid(), nonce: z.string().length(64), deadline: z.number().int(), chainId: z.literal(ROBINHOOD_CHAIN_ID), domain: z.string().min(1), signature: z.string().regex(/^0x[0-9a-fA-F]+$/) });
export async function POST(req: Request) {
  if (!hasTrustedOrigin(req)) return NextResponse.json({ error: "UNTRUSTED_ORIGIN" }, { status: 403 });
  const me = await currentUser(); if (!me) return NextResponse.json({ error: "AUTH_REQUIRED" }, { status: 401 });
  try {
    await enforceRateLimit(`vote:submit:${clientIp(req)}:${me.userId}`, 12, 60);
    const x = S.parse(await req.json()); const origin = expectedOrigin(req); if (x.domain !== new URL(origin).host || x.chainId !== me.chainId) throw new Error("INVALID_DOMAIN_OR_CHAIN");
    const nonceHash = createHash("sha256").update(x.nonce).digest("hex"); const nonceRow = await db.voteNonce.findUnique({ where: { nonceHash } });
    if (!nonceRow || nonceRow.userId !== me.userId || nonceRow.challengeId !== x.challengeId || nonceRow.submissionId !== x.submissionId || nonceRow.consumedAt || nonceRow.expiresAt <= new Date() || nonceRow.expiresAt.getTime() !== x.deadline) throw new Error("VOTE_NONCE_INVALID");
    const message = buildVoteMessage({ domain: x.domain, challengeId: x.challengeId, submissionId: x.submissionId, wallet: me.address, nonce: x.nonce, deadline: x.deadline, chainId: x.chainId });
    const valid = await verifyMessage({ address: me.address as `0x${string}`, message, signature: x.signature as `0x${string}` }); if (!valid) throw new Error("INVALID_SIGNATURE");
    const vote = await db.$transaction(async (tx) => {
      const challenge = await tx.challenge.findUnique({ where: { id: x.challengeId } }); assertVotingOpen(challenge);
      const submission = await tx.submission.findUnique({ where: { id: x.submissionId }, include: { asset: true } }); assertVoteTarget(submission, x.challengeId, me.userId);
      await consumeVoteNonce(tx, nonceRow.id);
      return tx.vote.create({ data: { challengeId: x.challengeId, submissionId: x.submissionId, voterUserId: me.userId, signatureHash: keccak256(toBytes(x.signature)) }, select: { id: true, submissionId: true, createdAt: true } });
    });
    await audit("VOTE_CAST", "Vote", vote.id, me.userId, { challengeId: x.challengeId, submissionId: x.submissionId, policy: "ONE_WALLET_ONE_VOTE" });
    return NextResponse.json({ vote, mode: "OFF_CHAIN_SIGNED_VOTE" }, { status: 201 });
  } catch (error) { const raw = error instanceof Error ? error.message : "VOTE_FAILED"; const code = raw.includes("Unique constraint") ? "ALREADY_VOTED" : ["INVALID_SIGNATURE", "INVALID_DOMAIN_OR_CHAIN", "VOTE_NONCE_INVALID", "VOTE_NONCE_ALREADY_USED", "VOTING_NOT_OPEN", "VOTE_NOT_ALLOWED", "ALREADY_VOTED", "RATE_LIMITED", "RATE_LIMIT_UNAVAILABLE"].includes(raw) ? raw : "VOTE_REJECTED"; await audit("VOTE_REJECTED", "Vote", undefined, me.userId, { reasonCode: code }).catch(() => undefined); return NextResponse.json({ error: code }, { status: code === "RATE_LIMITED" ? 429 : code === "RATE_LIMIT_UNAVAILABLE" ? 503 : code === "INVALID_SIGNATURE" ? 401 : 409 }); }
}
