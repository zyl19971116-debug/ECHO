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
        votingStart: true,
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
    const submissions = challenge?.status === "VOTING" ? await db.submission.findMany({ where: { challengeId: challenge.id, status: "SUBMITTED", asset: { visibility: "PUBLIC" } }, orderBy: { anonymousNumber: "asc" }, select: { id: true, anonymousNumber: true, title: true, description: true, imageUrl: true, imageHash: true, createdAt: true } }) : [];
    const now = new Date(); const votingStart = challenge?.votingStart || challenge?.submissionEnd;
    const eligible = Boolean(user && challenge?.status === "VOTING" && votingStart && now >= votingStart && now < challenge.votingEnd && !vote);
    return NextResponse.json({
      authenticated: Boolean(user),
      challenge,
      vote,
      submissions,
      eligible,
      submissionEnabled: eligible,
      policy: "ONE_WALLET_ONE_VOTE_NOT_ANTI_SYBIL",
      reason: !challenge || challenge.status !== "VOTING" ? "VOTING_IS_NOT_OPEN" : vote ? "ALREADY_VOTED" : eligible ? null : "OUTSIDE_VOTING_WINDOW",
    });
  } catch {
    return NextResponse.json(
      { error: "VOTE_STATUS_UNAVAILABLE" },
      { status: 503 }
    );
  }
}
