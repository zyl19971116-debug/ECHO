import { NextResponse } from "next/server";
import { db } from "@/lib/db";
export async function GET() {
  try {
    const [creations, creators, votes, winners] = await Promise.all([
      db.submission.count(),
      db.user.count(),
      db.vote.count(),
      db.challengeResult.count(),
    ]);
    return NextResponse.json({ creations, creators, votes, winners });
  } catch {
    return NextResponse.json({ error: "STATS_UNAVAILABLE" }, { status: 503 });
  }
}
