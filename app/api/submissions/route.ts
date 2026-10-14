import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { publicSubmissionSelect } from "@/lib/public-dto";
import { hasTrustedOrigin } from "@/lib/request-security";
import { storage } from "@/lib/storage";
import { audit } from "@/lib/audit";
import { assertEligibleGeneration, assertSubmissionWindow } from "@/lib/submission-policy";
const S = z.object({
  challengeId: z.string().cuid(),
  generationId: z.string().cuid(),
  title: z.string().min(1).max(100),
  description: z.string().max(500),
});
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const mode = url.searchParams.get("mode") || "current";
    const explicitId = url.searchParams.get("challengeId") || undefined;
    const current = await db.challenge.findFirst({
      where: { status: { in: ["SUBMISSION", "VOTING"] } },
      orderBy: { number: "desc" },
      select: { id: true },
    });
    const where: Prisma.SubmissionWhereInput = explicitId
      ? { challengeId: explicitId, status: "SUBMITTED" }
      : mode === "history"
        ? { status: "SUBMITTED", challenge: { status: { in: ["REVEAL", "FINALIZED"] } } }
        : mode === "current"
          ? { challengeId: current?.id || "__none__", status: "SUBMITTED" }
          : { status: "SUBMITTED" };
    const rows = await db.submission.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 24,
      select: {
        id: true,
        challengeId: true,
        anonymousNumber: true,
        title: true,
        description: true,
        imageUrl: true,
        imageHash: true,
        createdAt: true,
        status: true,
        _count: { select: { votes: true } },
        challenge: {
          select: { number: true, title: true, status: true, revealAt: true },
        },
      },
    });
    const now = Date.now();
    const submissions = rows.map((row) => {
      const revealed =
        ["REVEAL", "FINALIZED"].includes(row.challenge.status) &&
        row.challenge.revealAt.getTime() <= now;
      return {
        id: row.id,
        challengeId: row.challengeId,
        anonymousNumber: row.anonymousNumber,
        title: row.title,
        description: row.description,
        imageUrl: row.imageUrl,
        imageHash: row.imageHash,
        createdAt: row.createdAt,
        status: row.status,
        challenge: row.challenge,
        voteCount: revealed ? row._count.votes : null,
      };
    });
    return NextResponse.json({ mode, submissions });
  } catch {
    return NextResponse.json(
      { error: "SUBMISSIONS_UNAVAILABLE" },
      { status: 503 }
    );
  }
}
export async function POST(req: Request) {
  if (!hasTrustedOrigin(req)) return NextResponse.json({ error: "UNTRUSTED_ORIGIN" }, { status: 403 });
  const me = await currentUser();
  if (!me)
    return NextResponse.json({ error: "AUTH_REQUIRED" }, { status: 401 });
  try {
    const x = S.parse(await req.json());
    const c = await db.challenge.findUnique({ where: { id: x.challengeId } });
    try { assertSubmissionWindow(c); } catch { return NextResponse.json({ error: "SUBMISSIONS_CLOSED" }, { status: 409 }); }
    const job = await db.generationJob.findFirst({
      where: { id: x.generationId },
      include: { asset: true },
    });
    try { assertEligibleGeneration(job, me.userId, c!.id); } catch { return NextResponse.json({ error: "GENERATION_NOT_READY" }, { status: 409 }); }
    const asset = job.asset;
    const metadata = await storage.getObjectMetadata(asset.objectKey);
    if (metadata.ContentLength !== asset.fileSize || metadata.Metadata?.sha256 !== asset.sha256) return NextResponse.json({ error: "STORED_ASSET_INTEGRITY_FAILED" }, { status: 409 });
    const prior = await db.submission.findUnique({ where: { challengeId_creatorUserId: { challengeId: c.id, creatorUserId: me.userId } } });
    if (prior?.status === "SUBMITTED") return NextResponse.json({ error: "ALREADY_SUBMITTED" }, { status: 409 });
    if (prior && prior.assetId !== asset.id) return NextResponse.json({ error: "SUBMISSION_GENERATION_MISMATCH" }, { status: 409 });
    let created = prior ? await db.submission.findUniqueOrThrow({ where: { id: prior.id }, select: publicSubmissionSelect }) : await db.$transaction(async (tx) => {
      const allocated = await tx.challenge.update({ where: { id: c.id }, data: { nextAnonymousNumber: { increment: 1 } }, select: { nextAnonymousNumber: true } });
      return tx.submission.create({
        data: {
          challengeId: c.id,
          creatorUserId: me.userId,
          anonymousNumber: allocated.nextAnonymousNumber - 1,
          title: x.title,
          description: x.description,
          imageUrl: "",
          imageHash: asset.sha256,
          assetId: asset.id,
          status: "DRAFT",
        },
        select: publicSubmissionSelect,
      });
    });
    const published = await storage.publishApproved(asset.objectKey);
    created = await db.submission.update({ where: { id: created.id }, data: { imageUrl: published.url, status: "SUBMITTED", asset: { update: { publicObjectKey: published.publicKey, visibility: "PUBLIC" } } }, select: publicSubmissionSelect });
    await audit("SUBMISSION_CREATED", "Submission", created.id, me.userId, { challengeId: c.id, anonymousNumber: created.anonymousNumber });
    return NextResponse.json({ submission: created }, { status: 201 });
  } catch (error) {
    await audit("SUBMISSION_REJECTED", "Submission", undefined, me.userId, { reasonCode: error instanceof Error ? error.name : "UNKNOWN" }).catch(() => undefined);
    return NextResponse.json(
      { error: "INVALID_OR_DUPLICATE_SUBMISSION" },
      { status: 400 }
    );
  }
}
