import { NextResponse } from "next/server";
import { z } from "zod";
import { currentAdmin } from "@/lib/admin";
import { audit } from "@/lib/audit";
import { enqueueAward } from "@/lib/onchain-queue";
import { clientIp, hasTrustedOrigin } from "@/lib/request-security";
import { enforceRateLimit } from "@/lib/rate-limit";
const S = z.object({ challengeId: z.string().cuid(), rank: z.number().int().min(1).max(3) });
export async function POST(req: Request) { if (!hasTrustedOrigin(req)) return NextResponse.json({ error: "UNTRUSTED_ORIGIN" }, { status: 403 }); const admin = await currentAdmin(); if (!admin) return NextResponse.json({ error: "ADMIN_REQUIRED" }, { status: 403 }); try { await enforceRateLimit(`admin:onchain-award:${clientIp(req)}:${admin.userId}`, 20, 3600); const x = S.parse(await req.json()); const job = await enqueueAward(x.challengeId, x.rank); await audit("ADMIN_NFT_AWARD_QUEUED", "Challenge", x.challengeId, admin.userId, { rank: x.rank }); return NextResponse.json({ jobId: job.id, status: "QUEUED" }, { status: 202 }); } catch (error) { const code = error instanceof Error ? error.message : "QUEUE_FAILED"; return NextResponse.json({ error: code }, { status: code.includes("RATE_LIMIT") ? 429 : 503 }); } }
