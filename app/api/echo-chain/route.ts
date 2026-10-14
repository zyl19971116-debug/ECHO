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
    const nodes = raw.sort((a, b) => a.challenge.number - b.challenge.number);
    return NextResponse.json({ nodes });
  } catch {
    return NextResponse.json(
      { error: "ECHO_CHAIN_UNAVAILABLE" },
      { status: 503 }
    );
  }
}
