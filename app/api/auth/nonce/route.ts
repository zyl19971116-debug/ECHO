import { randomBytes } from "crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { ROBINHOOD_CHAIN_ID } from "@/lib/chain";
import { clientIp, hasTrustedOrigin } from "@/lib/request-security";
import { enforceRateLimit } from "@/lib/rate-limit";

const S = z.object({ address: z.string().regex(/^0x[a-fA-F0-9]{40}$/), chainId: z.literal(ROBINHOOD_CHAIN_ID) });
export async function POST(req: Request) {
  try {
    if (!hasTrustedOrigin(req)) return NextResponse.json({ error: "UNTRUSTED_ORIGIN" }, { status: 403 });
    const body = S.parse(await req.json());
    await enforceRateLimit(`siwe:nonce:${clientIp(req)}:${body.address.toLowerCase()}`, 10, 60);
    const nonce = randomBytes(16).toString("hex");
    await db.walletSession.create({ data: { address: body.address.toLowerCase(), chainId: body.chainId, nonce, expiresAt: new Date(Date.now() + 10 * 60_000) } });
    return NextResponse.json({ nonce });
  } catch (error) {
    const code = error instanceof Error ? error.message : "INVALID_NONCE_REQUEST";
    return NextResponse.json({ error: code }, { status: code === "RATE_LIMITED" ? 429 : code === "RATE_LIMIT_UNAVAILABLE" ? 503 : 400 });
  }
}
