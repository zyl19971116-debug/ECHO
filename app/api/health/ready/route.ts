import { NextResponse } from "next/server";
import { readiness } from "@/lib/readiness";
export async function GET() { const result = await readiness(); return NextResponse.json({ status: result.ready ? "ready" : "not_ready", checks: result.checks, timestamp: new Date().toISOString() }, { status: result.ready ? 200 : 503, headers: { "Cache-Control": "no-store" } }); }
