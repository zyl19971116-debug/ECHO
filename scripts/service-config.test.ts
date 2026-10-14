import assert from "node:assert/strict";
import test from "node:test";
import { inspectServiceConfig } from "../lib/service-config";

test("service inspection reports presence and validity without returning values", () => {
  const checks = inspectServiceConfig({ DATABASE_URL: "postgresql://u:p@db:5432/echo", REDIS_URL: "rediss://:p@redis:6380", AUTH_SECRET: "x".repeat(32), NEXT_PUBLIC_APP_URL: "https://echo.example", ROBINHOOD_SERVER_RPC_URL: "https://rpc.example" });
  assert.deepEqual(checks.DATABASE_URL, { present: true, valid: true, reason: "PostgreSQL URL required" });
  assert.equal(checks.REDIS_URL.valid, true);
  assert.equal(checks.AUTH_SECRET.valid, true);
  assert.equal(checks.NEXT_PUBLIC_APP_URL.valid, true);
  assert.equal(checks.ROBINHOOD_SERVER_RPC_URL.valid, true);
  assert.equal(JSON.stringify(checks).includes("postgresql://"), false);
});

test("production URLs fail closed for insecure or malformed values", () => {
  const checks = inspectServiceConfig({ NEXT_PUBLIC_APP_URL: "http://echo.example", PUBLIC_ASSET_BASE_URL: "not-a-url", ROBINHOOD_SERVER_RPC_URL: "http://rpc.example" });
  assert.equal(checks.NEXT_PUBLIC_APP_URL.valid, false);
  assert.equal(checks.PUBLIC_ASSET_BASE_URL.valid, false);
  assert.equal(checks.ROBINHOOD_SERVER_RPC_URL.valid, false);
});
