import { inspectServiceConfig } from "../lib/service-config";

const checks = inspectServiceConfig(process.env);
const required = Object.entries(checks).filter(([name]) => !name.startsWith("ECHO_MAINNET_") && name !== "S3_ENDPOINT");
const ready = required.every(([, value]) => value.present && value.valid);
console.log(JSON.stringify({
  ready,
  checks,
  aliases: { ROBINHOOD_MAINNET_RPC_URL: "accepted as a legacy alias for ROBINHOOD_SERVER_RPC_URL" },
  safety: "Values are never printed. This command performs no network calls or writes.",
}, null, 2));
if (!ready) process.exitCode = 1;
