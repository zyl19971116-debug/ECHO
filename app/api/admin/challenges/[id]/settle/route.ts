import { NextResponse } from "next/server";
import { currentAdmin } from "@/lib/admin";
import { audit } from "@/lib/audit";
import { clientIp, hasTrustedOrigin } from "@/lib/request-security";
import { enforceRateLimit } from "@/lib/rate-limit";
import { settleChallenge } from "@/lib/settlement";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!hasTrustedOrigin(req)) return NextResponse.json({ error: "UNTRUSTED_ORIGIN" }, { status: 403 });
  const admin = await currentAdmin();
  if (!admin) return NextResponse.json({ error: "ADMIN_REQUIRED" }, { status: 403 });
  const { id } = await params;
  try {
    await enforceRateLimit(`admin:settle:${clientIp(req)}:${admin.userId}`, 10, 3600);
    const result = await settleChallenge(id);
    await audit("ADMIN_SETTLEMENT_RETRIED", "Challenge", id, admin.userId, { resultId: result?.id || null });
    return NextResponse.json({ result });
  } catch (error) {
    const code = error instanceof Error ? error.message : "SETTLEMENT_FAILED";
    return NextResponse.json({ error: code }, { status: code.includes("RATE_LIMIT") ? 429 : code === "VOTING_NOT_ENDED" ? 409 : 503 });
  }
}
