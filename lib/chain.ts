import { defineChain } from "viem";

export const ROBINHOOD_CHAIN_ID = Number(
  process.env.NEXT_PUBLIC_ROBINHOOD_CHAIN_ID || 46630
);

export const robinhoodTestnet = defineChain({
  id: ROBINHOOD_CHAIN_ID,
  name: process.env.NEXT_PUBLIC_ROBINHOOD_CHAIN_NAME || "Robinhood Chain Testnet",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: {
    default: {
      http: [
        process.env.NEXT_PUBLIC_ROBINHOOD_RPC_URL ||
          "https://rpc.testnet.chain.robinhood.com",
      ],
    },
  },
  blockExplorers: {
    default: {
      name: "Robinhood Chain Explorer",
      url:
        process.env.NEXT_PUBLIC_ROBINHOOD_EXPLORER_URL ||
        "https://explorer.testnet.chain.robinhood.com",
    },
  },
  testnet: true,
});

export const walletConnectConfigured = Boolean(
  process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID
);
