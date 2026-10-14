import { NextResponse } from "next/server";
import { db } from "@/lib/db";
export async function GET() {
  try {
    const challenges = await db.challenge.findMany({
      where: { status: { in: ["REVEAL", "FINALIZED"] } },
      orderBy: { number: "desc" },
      select: {
        id: true,
        number: true,
        title: true,
        description: true,
        theme: true,
        status: true,
        submissionStart: true,
        submissionEnd: true,
        votingEnd: true,
        revealAt: true,
      },
    });
    return NextResponse.json({ challenges });
  } catch {
    return NextResponse.json(
      { error: "CHALLENGE_HISTORY_UNAVAILABLE" },
      { status: 503 }
    );
  }
}
