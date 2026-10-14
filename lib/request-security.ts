import { timingSafeEqual } from "crypto";

export function expectedOrigin(req: Request) {
  const configured = process.env.NEXT_PUBLIC_APP_URL;
  if (configured) return new URL(configured).origin;
  if (process.env.NODE_ENV !== "production") return new URL(req.url).origin;
  throw new Error("APP_ORIGIN_NOT_CONFIGURED");
}

export function hasTrustedOrigin(req: Request) {
  const origin = req.headers.get("origin");
  if (!origin) return false;
  const expected = expectedOrigin(req);
  const a = Buffer.from(origin);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function clientIp(req: Request) {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}
