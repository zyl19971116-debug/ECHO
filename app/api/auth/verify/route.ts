import { NextResponse } from "next/server";
import { SiweMessage } from "siwe";
import { z } from "zod";
import { db } from "@/lib/db";
import { issueSession } from "@/lib/auth";
const S = z.object({
  message: z.string().max(5000),
  signature: z.string().regex(/^0x[0-9a-fA-F]+$/),
});
export async function POST(req: Request) {
  try {
    const { message, signature } = S.parse(await req.json());
    const siwe = new SiweMessage(message);
    const row = await db.walletSession.findUnique({
      where: { nonce: siwe.nonce },
    });
    if (
      !row ||
      row.verifiedAt ||
      row.expiresAt < new Date() ||
      row.address !== siwe.address.toLowerCase()
    )
      throw new Error();
    const ok = await siwe.verify({
      signature,
      nonce: row.nonce,
      domain: new URL(
        process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
      ).host,
    });
    if (!ok.success) throw new Error();
    const user = await db.user.upsert({
      where: { walletAddress: row.address },
      update: {},
      create: { walletAddress: row.address },
    });
    await db.walletSession.update({
      where: { id: row.id },
      data: { userId: user.id, verifiedAt: new Date() },
    });
    const token = await issueSession(user.id, row.address);
    const res = NextResponse.json({ address: row.address });
    res.cookies.set("echo_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 604800,
    });
    return res;
  } catch {
    return NextResponse.json(
      { error: "SIGNATURE_VERIFICATION_FAILED" },
      { status: 401 }
    );
  }
}
