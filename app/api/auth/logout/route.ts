import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { clientIp, hasTrustedOrigin } from "@/lib/request-security";
import { enforceRateLimit } from "@/lib/rate-limit";

export async function POST(req: Request) {
  try {
    if (!hasTrustedOrigin(req)) return NextResponse.json({ error: "UNTRUSTED_ORIGIN" }, { status: 403 });
    await enforceRateLimit(`siwe:logout:${clientIp(req)}`, 20, 60);
    const session = await currentUser();
    if (session) await db.walletSession.updateMany({ where: { id: session.sessionId, revokedAt: null }, data: { revokedAt: new Date() } });
    const response = NextResponse.json({ ok: true });
    response.cookies.set("echo_session", "", { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", maxAge: 0, path: "/" });
    return response;
  } catch (error) {
    const code = error instanceof Error ? error.message : "LOGOUT_FAILED";
    return NextResponse.json({ error: code }, { status: code === "RATE_LIMITED" ? 429 : 503 });
  }
}
