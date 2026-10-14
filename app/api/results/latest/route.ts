import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { revealedResult } from "@/lib/result-dto";
export async function GET() { try { const row = await db.challenge.findFirst({ where: { status: "REVEAL", revealAt: { lte: new Date() }, result: { isNot: null } }, orderBy: { number: "desc" }, select: { id: true } }); if (!row) return NextResponse.json({ challenge: null, podium: [] }); return NextResponse.json(await revealedResult(row.id)); } catch { return NextResponse.json({ error: "RESULTS_UNAVAILABLE" }, { status: 503 }); } }
