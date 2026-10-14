export type ConfigCheck = { present: boolean; valid: boolean; reason: string };

const present = (value: string | undefined) => Boolean(value?.trim());
const url = (value: string | undefined, protocols: string[]) => {
  if (!present(value)) return false;
  try { return protocols.includes(new URL(value!).protocol); } catch { return false; }
};
const address = (value: string | undefined) => !present(value) || /^0x[0-9a-fA-F]{40}$/.test(value!);

export const productionEnvironmentNames = [
  "DATABASE_URL", "REDIS_URL", "AUTH_SECRET", "OPENAI_API_KEY",
  "NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID", "STORAGE_PROVIDER", "S3_ENDPOINT",
  "S3_REGION", "S3_BUCKET", "S3_ACCESS_KEY_ID", "S3_SECRET_ACCESS_KEY",
  "PUBLIC_ASSET_BASE_URL", "NEXT_PUBLIC_APP_URL", "ROBINHOOD_SERVER_RPC_URL",
] as const;

export function inspectServiceConfig(env: Record<string, string | undefined>): Record<string, ConfigCheck> {
  const rpc = env.ROBINHOOD_SERVER_RPC_URL || env.ROBINHOOD_MAINNET_RPC_URL;
  const result: Record<string, ConfigCheck> = {
    DATABASE_URL: check(env.DATABASE_URL, url(env.DATABASE_URL, ["postgresql:", "postgres:"]), "PostgreSQL URL required"),
    REDIS_URL: check(env.REDIS_URL, url(env.REDIS_URL, ["redis:", "rediss:"]), "redis:// or rediss:// required"),
    AUTH_SECRET: check(env.AUTH_SECRET, (env.AUTH_SECRET?.length || 0) >= 32, "at least 32 characters required"),
    OPENAI_API_KEY: check(env.OPENAI_API_KEY, /^sk-[A-Za-z0-9_-]{10,}$/.test(env.OPENAI_API_KEY || ""), "OpenAI key shape required"),
    NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID: check(env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID, /^[A-Za-z0-9_-]{16,}$/.test(env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || ""), "WalletConnect project id required"),
    STORAGE_PROVIDER: check(env.STORAGE_PROVIDER, env.STORAGE_PROVIDER === "s3", "must be s3"),
    S3_ENDPOINT: { present: present(env.S3_ENDPOINT), valid: !present(env.S3_ENDPOINT) || url(env.S3_ENDPOINT, ["https:"]), reason: !present(env.S3_ENDPOINT) ? "optional for AWS; required for R2" : "HTTPS endpoint required" },
    S3_REGION: check(env.S3_REGION, present(env.S3_REGION), "region required; use auto for R2"),
    S3_BUCKET: check(env.S3_BUCKET, present(env.S3_BUCKET), "bucket required"),
    S3_ACCESS_KEY_ID: check(env.S3_ACCESS_KEY_ID, present(env.S3_ACCESS_KEY_ID), "credential required"),
    S3_SECRET_ACCESS_KEY: check(env.S3_SECRET_ACCESS_KEY, present(env.S3_SECRET_ACCESS_KEY), "credential required"),
    PUBLIC_ASSET_BASE_URL: check(env.PUBLIC_ASSET_BASE_URL, url(env.PUBLIC_ASSET_BASE_URL, ["https:"]), "HTTPS public asset URL required"),
    NEXT_PUBLIC_APP_URL: check(env.NEXT_PUBLIC_APP_URL, url(env.NEXT_PUBLIC_APP_URL, ["https:"]), "HTTPS application origin required"),
    ROBINHOOD_SERVER_RPC_URL: check(rpc, url(rpc, ["https:"]), "HTTPS server RPC URL required"),
    ECHO_MAINNET_NFT_ADDRESS: { present: present(env.ECHO_MAINNET_NFT_ADDRESS), valid: address(env.ECHO_MAINNET_NFT_ADDRESS), reason: "optional until deployment; must be an EVM address" },
    ECHO_MAINNET_REGISTRY_ADDRESS: { present: present(env.ECHO_MAINNET_REGISTRY_ADDRESS), valid: address(env.ECHO_MAINNET_REGISTRY_ADDRESS), reason: "optional until deployment; must be an EVM address" },
  };
  return result;
}

function check(value: string | undefined, valid: boolean, reason: string): ConfigCheck {
  return { present: present(value), valid: present(value) && valid, reason };
}
