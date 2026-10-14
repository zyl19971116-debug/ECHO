import { NextResponse } from "next/server";
import { db } from "@/lib/db";
export async function GET() {
  try {
    const challenge = await db.challenge.findFirst({
      where: { status: { in: ["SUBMISSION", "VOTING"] } },
      orderBy: { number: "desc" },
      select: {
        id: true,
        number: true,
        title: true,
        description: true,
        theme: true,
        submissionStart: true,
        submissionEnd: true,
        votingEnd: true,
        revealAt: true,
        status: true,
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
