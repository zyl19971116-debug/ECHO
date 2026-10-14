import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { generationDto, generationInclude } from "@/lib/generation-dto";
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const me = await currentUser(); if (!me) return NextResponse.json({ error: "AUTH_REQUIRED" }, { status: 401 });
  const { id } = await params;
  const row = await db.generationJob.findFirst({ where: { id, userId: me.userId }, include: generationInclude });
  return row ? NextResponse.json(await generationDto(row)) : NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
}
