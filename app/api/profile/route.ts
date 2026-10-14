import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";
export async function GET() {
  const user = await currentUser();
  if (!user)
    return NextResponse.json({ error: "AUTH_REQUIRED" }, { status: 401 });
  try {
    const data = await db.user.findUnique({
      where: { id: user.userId },
      select: {
        walletAddress: true,
        generations: {
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            status: true,
            imageUrl: true,
            prompt: true,
            style: true,
            format: true,
            createdAt: true,
          },
        },
        submissions: {
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            anonymousNumber: true,
            title: true,
            imageUrl: true,
            status: true,
            createdAt: true,
            challenge: { select: { number: true, title: true, status: true } },
          },
        },
        votes: {
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            createdAt: true,
            challenge: { select: { number: true, title: true, status: true } },
            submission: { select: { anonymousNumber: true, title: true } },
          },
        },
        awards: {
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            rank: true,
            createdAt: true,
            submission: {
              select: {
                id: true,
                anonymousNumber: true,
                title: true,
                imageUrl: true,
              },
            },
            nft: {
              select: {
                status: true,
                tokenId: true,
                transactionHash: true,
                contractAddress: true,
                chainId: true,
              },
            },
          },
        },
      },
    });
    return NextResponse.json({ profile: data });
  } catch {
    return NextResponse.json({ error: "PROFILE_UNAVAILABLE" }, { status: 503 });
  }
}
