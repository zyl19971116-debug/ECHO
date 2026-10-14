import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { storage } from "@/lib/storage";
import { quotaStatus } from "@/lib/quota";
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
            error: true,
            asset: { select: { objectKey: true, sha256: true } },
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
    if (!data) return NextResponse.json({ error: "PROFILE_NOT_FOUND" }, { status: 404 });
    const generations = await Promise.all(data.generations.map(async (item) => ({ ...item, asset: undefined, imageUrl: item.asset && item.status === "COMPLETED" ? await storage.getSignedUrl(item.asset.objectKey) : null, imageHash: item.asset?.sha256 || null })));
    return NextResponse.json({ profile: { ...data, generations, quota: await quotaStatus(user.userId) } });
  } catch {
    return NextResponse.json({ error: "PROFILE_UNAVAILABLE" }, { status: 503 });
  }
}
