import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { randomBytes } from "crypto";
const S = z.object({ address: z.string().regex(/^0x[a-fA-F0-9]{40}$/) });
export async function POST(req: Request) {
  try {
    const { address } = S.parse(await req.json());
    const nonce = randomBytes(16).toString("hex");
    await db.walletSession.create({
      data: {
        address: address.toLowerCase(),
        nonce,
        expiresAt: new Date(Date.now() + 10 * 60_000),
      },
    });
    return NextResponse.json({ nonce });
  } catch {
    return NextResponse.json(
      { error: "INVALID_NONCE_REQUEST" },
      { status: 400 }
    );
  }
}
