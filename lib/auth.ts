import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { db } from "@/lib/db";

const key = () => new TextEncoder().encode(process.env.AUTH_SECRET || "");

export function isActiveSessionRecord(record: { verifiedAt: Date | null; revokedAt: Date | null; expiresAt: Date }, now = new Date()) {
  return Boolean(record.verifiedAt && !record.revokedAt && record.expiresAt > now);
}

export async function issueSession(input: { sessionId: string; userId: string; address: string; chainId: number; expiresAt: Date }) {
  if (!process.env.AUTH_SECRET || process.env.AUTH_SECRET.length < 32) throw new Error("AUTH_SECRET_NOT_CONFIGURED");
  return new SignJWT({ sid: input.sessionId, userId: input.userId, address: input.address, chainId: input.chainId })
    .setProtectedHeader({ alg: "HS256" }).setIssuedAt()
    .setExpirationTime(Math.floor(input.expiresAt.getTime() / 1000)).sign(key());
}

export async function currentUser() {
  try {
    if (!process.env.AUTH_SECRET || process.env.AUTH_SECRET.length < 32) return null;
    const token = (await cookies()).get("echo_session")?.value;
    if (!token) return null;
    const { payload } = await jwtVerify(token, key());
    const sessionId = String(payload.sid || "");
    const row = await db.walletSession.findUnique({ where: { id: sessionId } });
    if (!row || !isActiveSessionRecord(row) || row.userId !== String(payload.userId) || row.address !== String(payload.address) || row.chainId !== Number(payload.chainId)) return null;
    return { sessionId, userId: row.userId, address: row.address, chainId: row.chainId, expiresAt: row.expiresAt };
  } catch { return null; }
}
