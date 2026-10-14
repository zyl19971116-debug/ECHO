import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";
export async function GET(
  _: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const me = await currentUser();
  if (!me)
    return NextResponse.json({ error: "AUTH_REQUIRED" }, { status: 401 });
  const { id } = await params;
  const job = await db.generationJob.findFirst({
    where: { id, userId: me.userId },
    select: {
      id: true,
      status: true,
      imageUrl: true,
      error: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  return job
    ? NextResponse.json(job)
    : NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
}
