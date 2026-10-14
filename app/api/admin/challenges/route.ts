import { NextResponse } from "next/server";
import { z } from "zod";
import { currentAdmin } from "@/lib/admin";
import { audit } from "@/lib/audit";
import { scheduleChallenge } from "@/lib/contest-queue";
import { db } from "@/lib/db";
import { clientIp, hasTrustedOrigin } from "@/lib/request-security";
import { enforceRateLimit } from "@/lib/rate-limit";
const S = z.object({ title: z.string().min(3).max(120), description: z.string().min(3).max(1000), theme: z.string().min(3).max(300), submissionStart: z.coerce.date(), submissionEnd: z.coerce.date(), votingStart: z.coerce.date(), votingEnd: z.coerce.date(), revealAt: z.coerce.date(), publish: z.boolean().default(false) }).refine((x) => x.submissionStart < x.submissionEnd && x.submissionEnd <= x.votingStart && x.votingStart < x.votingEnd && x.votingEnd <= x.revealAt, "INVALID_CHALLENGE_TIMELINE");
export async function GET() { const admin = await currentAdmin(); if (!admin) return NextResponse.json({ error: "ADMIN_REQUIRED" }, { status: 403 }); return NextResponse.json({ challenges: await db.challenge.findMany({ orderBy: { number: "desc" }, take: 50 }) }); }
export async function POST(req: Request) {
  if (!hasTrustedOrigin(req)) return NextResponse.json({ error: "UNTRUSTED_ORIGIN" }, { status: 403 });
  const admin = await currentAdmin(); if (!admin) return NextResponse.json({ error: "ADMIN_REQUIRED" }, { status: 403 });
  try {
    await enforceRateLimit(`admin:challenge:${clientIp(req)}:${admin.userId}`, 10, 3600);
    const x = S.parse(await req.json()); const last = await db.challenge.findFirst({ orderBy: { number: "desc" }, select: { number: true } });
    const challenge = await db.challenge.create({ data: { number: (last?.number || 0) + 1, title: x.title, description: x.description, theme: x.theme, submissionStart: x.submissionStart, submissionEnd: x.submissionEnd, votingStart: x.votingStart, votingEnd: x.votingEnd, revealAt: x.revealAt, publishedAt: x.publish ? new Date() : null, status: "DRAFT" } });
    if (x.publish) await scheduleChallenge(challenge);
    await audit(x.publish ? "ADMIN_CHALLENGE_PUBLISHED" : "ADMIN_CHALLENGE_CREATED", "Challenge", challenge.id, admin.userId);
    return NextResponse.json({ challenge }, { status: 201 });
  } catch (error) { const code = error instanceof Error ? error.message : "INVALID_CHALLENGE"; return NextResponse.json({ error: code }, { status: code.includes("RATE_LIMIT") ? 429 : 400 }); }
}
