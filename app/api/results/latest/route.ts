import { NextResponse } from "next/server";
import { db } from "@/lib/db";
export async function GET() {
  try {
    const challenge = await db.challenge.findFirst({
      where: {
        status: { in: ["REVEAL", "FINALIZED"] },
        revealAt: { lte: new Date() },
        result: { isNot: null },
      },
      orderBy: { number: "desc" },
      include: { result: true },
    });
    if (!challenge) return NextResponse.json({ challenge: null, podium: [] });
    const submissions = await db.submission.findMany({
      where: { challengeId: challenge.id, status: "SUBMITTED" },
      include: {
        creator: { select: { walletAddress: true } },
        votes: { select: { id: true } },
        awards: { include: { nft: true } },
      },
    });
    const podium = submissions
      .sort(
        (a, b) =>
          b.votes.length - a.votes.length ||
          a.createdAt.getTime() - b.createdAt.getTime() ||
          a.id.localeCompare(b.id)
      )
      .slice(0, 3)
      .map((s, index) => ({
        id: s.id,
        anonymousNumber: s.anonymousNumber,
        title: s.title,
        description: s.description,
        imageUrl: s.imageUrl,
        voteCount: s.votes.length,
        creatorAddress: s.creator.walletAddress,
        rank: index + 1,
        nft: s.awards.find((a) => a.rank === index + 1)?.nft ?? null,
      }));
    return NextResponse.json({
      challenge: {
        id: challenge.id,
        number: challenge.number,
        title: challenge.title,
        status: challenge.status,
        revealAt: challenge.revealAt,
        result: challenge.result,
      },
      podium,
    });
  } catch {
    return NextResponse.json({ error: "RESULTS_UNAVAILABLE" }, { status: 503 });
  }
}
