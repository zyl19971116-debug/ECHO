import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { generationDto, generationInclude } from "@/lib/generation-dto";
import { quotaStatus } from "@/lib/quota";
export async function GET() {
  const me = await currentUser();
  if (!me) return NextResponse.json({ error: "AUTH_REQUIRED" }, { status: 401 });
  try {
    const rows = await db.generationJob.findMany({ where: { userId: me.userId }, orderBy: { createdAt: "desc" }, take: 30, include: generationInclude });
    return NextResponse.json({ generations: await Promise.all(rows.map(generationDto)), quota: await quotaStatus(me.userId) });
  } catch { return NextResponse.json({ error: "GENERATIONS_UNAVAILABLE" }, { status: 503 }); }
}
