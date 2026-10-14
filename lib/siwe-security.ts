import { ROBINHOOD_CHAIN_ID } from "@/lib/chain";

export type SiweSecurityFields = {
  domain: string;
  uri: string;
  chainId: number;
  issuedAt?: string;
  expirationTime?: string;
};

export function validateSiweFields(
  fields: SiweSecurityFields,
  origin: string,
  now = new Date()
) {
  const expected = new URL(origin);
  if (fields.domain !== expected.host) throw new Error("SIWE_DOMAIN_MISMATCH");
  if (new URL(fields.uri).origin !== expected.origin)
    throw new Error("SIWE_URI_MISMATCH");
  if (fields.chainId !== ROBINHOOD_CHAIN_ID)
    throw new Error("SIWE_CHAIN_MISMATCH");
  if (!fields.issuedAt || !fields.expirationTime)
    throw new Error("SIWE_TIME_MISSING");
  const issuedAt = new Date(fields.issuedAt);
  const expiration = new Date(fields.expirationTime);
  if (!Number.isFinite(issuedAt.getTime()) || !Number.isFinite(expiration.getTime()))
    throw new Error("SIWE_TIME_INVALID");
  if (issuedAt.getTime() > now.getTime() + 60_000)
    throw new Error("SIWE_ISSUED_IN_FUTURE");
  if (issuedAt.getTime() < now.getTime() - 10 * 60_000)
    throw new Error("SIWE_TOO_OLD");
  if (expiration <= now || expiration.getTime() > issuedAt.getTime() + 15 * 60_000)
    throw new Error("SIWE_EXPIRATION_INVALID");
}
