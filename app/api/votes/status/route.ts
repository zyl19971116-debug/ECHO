import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";
export async function GET() {
  try {
    const user = await currentUser();
    const challenge = await db.challenge.findFirst({
      where: { status: { in: ["SUBMISSION", "VOTING"] } },
      orderBy: { number: "desc" },
      select: {
        id: true,
        number: true,
        title: true,
        status: true,
        submissionEnd: true,
        votingEnd: true,
        revealAt: true,
      },
    });
    const vote =
      user && challenge
        ? await db.vote.findUnique({
            where: {
              challengeId_voterUserId: {
                challengeId: challenge.id,
                voterUserId: user.userId,
              },
            },
            select: { id: true, submissionId: true, createdAt: true },
          })
        : null;
    return NextResponse.json({
      authenticated: Boolean(user),
      challenge,
      vote,
      eligible: false,
      submissionEnabled: false,
      reason:
        challenge?.status !== "VOTING"
          ? "VOTING_IS_NOT_OPEN"
          : "SECURE_ONE_TIME_NONCE_AND_ELIGIBILITY_CHECKS_PENDING",
    });
  } catch {
    return NextResponse.json(
      { error: "VOTE_STATUS_UNAVAILABLE" },
      { status: 503 }
    );
  }
}
