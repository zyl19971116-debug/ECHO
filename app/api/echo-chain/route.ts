import { NextResponse } from "next/server";
import { db } from "@/lib/db";
export async function GET() {
  try {
    const raw = await db.echoChainNode.findMany({
      where: {
        challenge: {
          status: { in: ["REVEAL", "FINALIZED"] },
          revealAt: { lte: new Date() },
          result: { isNot: null },
        },
      },
      orderBy: { createdAt: "asc" },
      include: {
        nextChallenge: { select: { id: true, number: true, title: true, theme: true, status: true, publishedAt: true } },
        challenge: {
          include: {
            result: {
              include: {
                winner: {
                  include: {
                    creator: { select: { walletAddress: true } },
                    awards: { include: { nft: true } },
                  },
                },
              },
            },
          },
        },
      },
    });
    const nodes = raw.sort((a, b) => a.challenge.number - b.challenge.number).map((node) => ({ id: node.id, relation: node.relation, previousNodeId: node.previousNodeId, createdAt: node.createdAt, nextChallenge: node.nextChallenge?.publishedAt ? node.nextChallenge : node.nextChallenge ? { status: "PENDING_REVIEW" } : null, challenge: { id: node.challenge.id, number: node.challenge.number, title: node.challenge.title, theme: node.challenge.theme, result: node.challenge.result ? { finalizedAt: node.challenge.result.finalizedAt, resultHash: node.challenge.result.resultHash, winner: { id: node.challenge.result.winner.id, anonymousNumber: node.challenge.result.winner.anonymousNumber, title: node.challenge.result.winner.title, imageUrl: node.challenge.result.winner.imageUrl, creatorAddress: node.challenge.result.winner.creator.walletAddress, awards: node.challenge.result.winner.awards } } : null } }));
    return NextResponse.json({ nodes });
  } catch {
    return NextResponse.json(
      { error: "ECHO_CHAIN_UNAVAILABLE" },
      { status: 503 }
    );
  }
}
