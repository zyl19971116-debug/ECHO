import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
const key = () => new TextEncoder().encode(process.env.AUTH_SECRET || "");
export async function issueSession(userId: string, address: string) {
  if (!process.env.AUTH_SECRET || process.env.AUTH_SECRET.length < 32)
    throw new Error("AUTH_SECRET_NOT_CONFIGURED");
  return new SignJWT({ userId, address })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(key());
}
export async function currentUser() {
  try {
    const token = (await cookies()).get("echo_session")?.value;
    if (!token) return null;
    const { payload } = await jwtVerify(token, key());
    return { userId: String(payload.userId), address: String(payload.address) };
  } catch {
    return null;
  }
}
