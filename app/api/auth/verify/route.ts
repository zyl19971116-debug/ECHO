import { NextResponse } from "next/server";
import { SiweMessage } from "siwe";
import { z } from "zod";
import { db } from "@/lib/db";
import { issueSession } from "@/lib/auth";
import { consumeNonce } from "@/lib/nonce-consumption";
import { clientIp, expectedOrigin, hasTrustedOrigin } from "@/lib/request-security";
import { enforceRateLimit } from "@/lib/rate-limit";
import { validateSiweFields } from "@/lib/siwe-security";

const S = z.object({ message: z.string().max(5000), signature: z.string().regex(/^0x[0-9a-fA-F]+$/) });
export async function POST(req: Request) {
  try {
    if (!hasTrustedOrigin(req)) return NextResponse.json({ error: "UNTRUSTED_ORIGIN" }, { status: 403 });
    await enforceRateLimit(`siwe:verify:${clientIp(req)}`, 10, 60);
    const { message, signature } = S.parse(await req.json());
    const siwe = new SiweMessage(message);
    const origin = expectedOrigin(req);
    validateSiweFields(siwe, origin);
    const row = await db.walletSession.findUnique({ where: { nonce: siwe.nonce } });
    if (!row || row.verifiedAt || row.revokedAt || row.expiresAt <= new Date() || row.address !== siwe.address.toLowerCase() || row.chainId !== siwe.chainId) throw new Error("NONCE_INVALID");
    const verified = await siwe.verify({ signature, nonce: row.nonce, domain: new URL(origin).host, time: new Date().toISOString() });
    if (!verified.success) throw new Error("SIGNATURE_VERIFICATION_FAILED");
    const sessionExpiresAt = new Date(Date.now() + 24 * 60 * 60_000);
    const user = await db.$transaction(async (tx) => {
      const nextUser = await tx.user.upsert({ where: { walletAddress: row.address }, update: {}, create: { walletAddress: row.address } });
      await consumeNonce(tx, row.id, nextUser.id, sessionExpiresAt);
      return nextUser;
    });
    const token = await issueSession({ sessionId: row.id, userId: user.id, address: row.address, chainId: siwe.chainId, expiresAt: sessionExpiresAt });
    const res = NextResponse.json({ address: row.address, chainId: siwe.chainId, expiresAt: sessionExpiresAt.toISOString() });
    res.cookies.set("echo_session", token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", expires: sessionExpiresAt });
    return res;
  } catch (error) {
    const code = error instanceof Error ? error.message : "SIGNATURE_VERIFICATION_FAILED";
    return NextResponse.json({ error: code }, { status: code === "RATE_LIMITED" ? 429 : code === "RATE_LIMIT_UNAVAILABLE" ? 503 : 401 });
  }
}
