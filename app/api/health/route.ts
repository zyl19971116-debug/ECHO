import { NextResponse } from "next/server";
export async function GET() { return NextResponse.json({ status: "ok", service: "echo-market-web", timestamp: new Date().toISOString() }, { headers: { "Cache-Control": "no-store" } }); }
