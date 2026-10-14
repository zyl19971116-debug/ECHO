import { NextResponse } from "next/server";
import { currentAdmin } from "@/lib/admin";
import { audit } from "@/lib/audit";
import { scheduleChallenge } from "@/lib/contest-queue";
import { db } from "@/lib/db";
import { clientIp, hasTrustedOrigin } from "@/lib/request-security";
import { enforceRateLimit } from "@/lib/rate-limit";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!hasTrustedOrigin(req)) return NextResponse.json({ error: "UNTRUSTED_ORIGIN" }, { status: 403 });
  const admin = await currentAdmin();
  if (!admin) return NextResponse.json({ error: "ADMIN_REQUIRED" }, { status: 403 });
  const { id } = await params;
  try {
    await enforceRateLimit(`admin:publish:${clientIp(req)}:${admin.userId}`, 20, 3600);
    const existing = await db.challenge.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "CHALLENGE_NOT_FOUND" }, { status: 404 });
    if (existing.status !== "DRAFT") return NextResponse.json({ error: "ONLY_DRAFT_CAN_BE_PUBLISHED" }, { status: 409 });
    const challenge = existing.publishedAt ? existing : await db.challenge.update({ where: { id }, data: { publishedAt: new Date() } });
    await scheduleChallenge(challenge);
    await audit("ADMIN_CHALLENGE_PUBLISHED", "Challenge", id, admin.userId);
    return NextResponse.json({ challenge });
  } catch (error) {
    const code = error instanceof Error ? error.message : "PUBLISH_FAILED";
    return NextResponse.json({ error: code }, { status: code.includes("RATE_LIMIT") ? 429 : 503 });
  }
}
