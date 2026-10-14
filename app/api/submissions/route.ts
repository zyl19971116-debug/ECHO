import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { publicSubmissionSelect } from "@/lib/public-dto";
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
  const me = await currentUser();
  if (!me)
    return NextResponse.json({ error: "AUTH_REQUIRED" }, { status: 401 });
  try {
    const x = S.parse(await req.json());
    const c = await db.challenge.findUnique({ where: { id: x.challengeId } });
    if (
      !c ||
      c.status !== "SUBMISSION" ||
      Date.now() < c.submissionStart.getTime() ||
      Date.now() >= c.submissionEnd.getTime()
    )
      return NextResponse.json(
        { error: "SUBMISSIONS_CLOSED" },
        { status: 409 }
      );
    const job = await db.generationJob.findFirst({
      where: {
        id: x.generationId,
        userId: me.userId,
        status: "SUCCEEDED",
        challengeId: c.id,
      },
    });
    if (!job?.imageUrl)
      return NextResponse.json(
        { error: "GENERATION_NOT_READY" },
        { status: 409 }
      );
    const created = await db.$transaction(async (tx) => {
      const count = await tx.submission.count({ where: { challengeId: c.id } });
      return tx.submission.create({
        data: {
          challengeId: c.id,
          creatorUserId: me.userId,
          anonymousNumber: count + 1,
          title: x.title,
          description: x.description,
          imageUrl: job.imageUrl!,
          imageHash: "pending-storage-hash",
        },
        select: publicSubmissionSelect,
      });
    });
    return NextResponse.json({ submission: created }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "INVALID_OR_DUPLICATE_SUBMISSION" },
      { status: 400 }
    );
  }
}
