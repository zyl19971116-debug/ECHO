import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { ROBINHOOD_CHAIN_ID, robinhoodChain } from "../lib/chain";
import { bullWorkerConnection } from "../lib/redis-connection";
import { isWalletSessionCurrent, walletSessionIdentityMismatch } from "../lib/wallet-session-policy";

const lock = JSON.parse(readFileSync(new URL("../package-lock.json", import.meta.url), "utf8")) as { packages: Record<string, { version?: string }> };
const version = (name: string) => String(lock.packages[`node_modules/${name}`]?.version || "");
const major = (name: string) => Number(version(name).split(".")[0]);

test("framework and wallet dependency majors remain on the validated migration line", () => {
  assert.equal(major("next"), 15);
  assert.equal(major("@rainbow-me/rainbowkit"), 2);
  assert.equal(major("wagmi"), 2);
  assert.equal(major("viem"), 2);
  assert.equal(major("hardhat"), 2);
  assert.equal(major("tailwindcss"), 3);
});

test("Robinhood mainnet remains the only configured wallet chain", () => {
  assert.equal(ROBINHOOD_CHAIN_ID, 4663);
  assert.equal(robinhoodChain.id, 4663);
  assert.equal(robinhoodChain.testnet, false);
});

test("wallet account, network and expiry changes invalidate a SIWE session", () => {
  const now = new Date("2026-10-14T12:00:00.000Z");
  const session = { authenticated: true, address: "0xabc", chainId: 4663, expiresAt: "2026-10-14T13:00:00.000Z" };
  assert.equal(isWalletSessionCurrent(session, "0xAbC", 4663, now), true);
  assert.equal(walletSessionIdentityMismatch(session, "0xdef", 4663), true);
  assert.equal(walletSessionIdentityMismatch(session, "0xabc", 1), true);
  assert.equal(isWalletSessionCurrent({ ...session, expiresAt: "2026-10-14T11:00:00.000Z" }, "0xabc", 4663, now), false);
});

test("BullMQ worker Redis connections retain blocking commands through transient failures", () => {
  const connection = bullWorkerConnection("rediss://worker:secret@example.com:6380");
  assert.equal(connection.maxRetriesPerRequest, null);
  assert.deepEqual(connection.tls, {});
  assert.equal(connection.username, "worker");
  assert.equal(connection.password, "secret");
});
