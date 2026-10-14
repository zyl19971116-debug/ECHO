import assert from "node:assert/strict";
import test from "node:test";
import { validateSiweFields } from "../lib/siwe-security";
import { consumeNonce } from "../lib/nonce-consumption";
import { isActiveSessionRecord } from "../lib/auth";

const now = new Date("2026-10-14T08:00:00.000Z");
const valid = {
  domain: "localhost:3002",
  uri: "http://localhost:3002",
  chainId: 4663,
  issuedAt: new Date(now.getTime() - 1_000).toISOString(),
  expirationTime: new Date(now.getTime() + 9 * 60_000).toISOString(),
};

test("accepts a bound, current Robinhood mainnet SIWE message", () => {
  assert.doesNotThrow(() => validateSiweFields(valid, "http://localhost:3002", now));
});

test("rejects cross-origin and wrong-chain SIWE messages", () => {
  assert.throws(() => validateSiweFields({ ...valid, domain: "evil.example" }, "http://localhost:3002", now), /DOMAIN/);
  assert.throws(() => validateSiweFields({ ...valid, uri: "https://evil.example" }, "http://localhost:3002", now), /URI/);
  assert.throws(() => validateSiweFields({ ...valid, chainId: 1 }, "http://localhost:3002", now), /CHAIN/);
});

test("rejects expired, future, and overlong SIWE messages", () => {
  assert.throws(() => validateSiweFields({ ...valid, expirationTime: now.toISOString() }, "http://localhost:3002", now), /EXPIRATION/);
  assert.throws(() => validateSiweFields({ ...valid, issuedAt: new Date(now.getTime() + 120_000).toISOString() }, "http://localhost:3002", now), /FUTURE/);
  assert.throws(() => validateSiweFields({ ...valid, expirationTime: new Date(now.getTime() + 30 * 60_000).toISOString() }, "http://localhost:3002", now), /EXPIRATION/);
});

test("atomic nonce consumption permits exactly one concurrent winner", async () => {
  let consumed = false;
  const tx = { walletSession: { async updateMany() { await Promise.resolve(); if (consumed) return { count: 0 }; consumed = true; return { count: 1 }; } } };
  const results = await Promise.allSettled([
    consumeNonce(tx, "session", "user", new Date(now.getTime() + 86_400_000), now),
    consumeNonce(tx, "session", "user", new Date(now.getTime() + 86_400_000), now),
  ]);
  assert.equal(results.filter((result) => result.status === "fulfilled").length, 1);
  assert.equal(results.filter((result) => result.status === "rejected").length, 1);
});

test("revoked and expired database sessions cannot authenticate", () => {
  assert.equal(isActiveSessionRecord({ verifiedAt: now, revokedAt: null, expiresAt: new Date(now.getTime() + 1_000) }, now), true);
  assert.equal(isActiveSessionRecord({ verifiedAt: now, revokedAt: now, expiresAt: new Date(now.getTime() + 1_000) }, now), false);
  assert.equal(isActiveSessionRecord({ verifiedAt: now, revokedAt: null, expiresAt: now }, now), false);
});
