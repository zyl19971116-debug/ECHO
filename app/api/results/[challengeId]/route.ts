import { NextResponse } from "next/server";
import { revealedResult } from "@/lib/result-dto";
export async function GET(_: Request, { params }: { params: Promise<{ challengeId: string }> }) { try { const { challengeId } = await params; const result = await revealedResult(challengeId); return result ? NextResponse.json(result) : NextResponse.json({ error: "RESULT_NOT_REVEALED" }, { status: 404 }); } catch { return NextResponse.json({ error: "RESULTS_UNAVAILABLE" }, { status: 503 }); } }
