import { NextResponse } from "next/server";
import { db } from "@/lib/db";
export async function GET() {
  try {
    const challenge = await db.challenge.findFirst({
      where: { publishedAt: { not: null }, status: { in: ["DRAFT", "SUBMISSION", "VOTING", "FINALIZED"] } },
      orderBy: { number: "desc" },
      select: {
        id: true,
        number: true,
        title: true,
        description: true,
        theme: true,
        submissionStart: true,
        submissionEnd: true,
        votingStart: true,
        votingEnd: true,
        revealAt: true,
        status: true,
        _count: { select: { submissions: { where: { status: "SUBMITTED" } } } },
      },
    });
    return NextResponse.json({ challenge });
  } catch {
    return NextResponse.json(
      { error: "CURRENT_CHALLENGE_UNAVAILABLE" },
      { status: 503 }
    );
  }
}
