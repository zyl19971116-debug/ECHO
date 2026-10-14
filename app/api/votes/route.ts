import { NextResponse } from "next/server";
import { z } from "zod";
import { verifyMessage, keccak256, toBytes } from "viem";
import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { hasTrustedOrigin } from "@/lib/request-security";
const S = z.object({
  challengeId: z.string().cuid(),
  submissionId: z.string().cuid(),
  nonce: z.string().min(16).max(128),
  deadline: z.number().int(),
  chainId: z.number().int(),
  domain: z.string().min(1),
  signature: z.string().regex(/^0x[0-9a-fA-F]+$/),
});
export async function POST(req: Request) {
  if (!hasTrustedOrigin(req)) return NextResponse.json({ error: "UNTRUSTED_ORIGIN" }, { status: 403 });
  const me = await currentUser();
  if (!me)
    return NextResponse.json({ error: "AUTH_REQUIRED" }, { status: 401 });
  try {
    const x = S.parse(await req.json());
    if (Date.now() > x.deadline)
      return NextResponse.json({ error: "SIGNATURE_EXPIRED" }, { status: 400 });
    const expectedDomain = new URL(
      process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    ).host;
    if (
      x.domain !== expectedDomain ||
      String(x.chainId) !== process.env.NEXT_PUBLIC_ROBINHOOD_CHAIN_ID
    )
      return NextResponse.json(
        { error: "INVALID_DOMAIN_OR_CHAIN" },
        { status: 400 }
      );
    const message = `ECHO MARKET VOTE\nDomain: ${x.domain}\nChallenge: ${x.challengeId}\nSubmission: ${x.submissionId}\nWallet: ${me.address}\nNonce: ${x.nonce}\nDeadline: ${x.deadline}\nChain ID: ${x.chainId}`;
    if (
      !(await verifyMessage({
        address: me.address as `0x${string}`,
        message,
        signature: x.signature as `0x${string}`,
      }))
    )
      return NextResponse.json({ error: "INVALID_SIGNATURE" }, { status: 401 });
    const result = await db.$transaction(async (tx) => {
      const c = await tx.challenge.findUnique({ where: { id: x.challengeId } });
      if (!c || c.status !== "VOTING" || new Date() >= c.votingEnd) return null;
      const s = await tx.submission.findUnique({
        where: { id: x.submissionId },
      });
      if (!s || s.challengeId !== c.id || s.creatorUserId === me.userId)
        return null;
      return tx.vote.create({
        data: {
          challengeId: c.id,
          submissionId: s.id,
          voterUserId: me.userId,
          signatureHash: keccak256(toBytes(x.signature)),
        },
        select: { id: true, createdAt: true },
      });
    });
    return result
      ? NextResponse.json({ vote: result }, { status: 201 })
      : NextResponse.json({ error: "VOTE_NOT_ALLOWED" }, { status: 409 });
  } catch {
    return NextResponse.json(
      { error: "INVALID_OR_DUPLICATE_VOTE" },
      { status: 400 }
    );
  }
}
