import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
export async function GET() {
  const user = await currentUser();
  return NextResponse.json({
    authenticated: Boolean(user),
    address: user?.address ?? null,
  });
}
