import { defineChain } from "viem";

export const ROBINHOOD_CHAIN_ID = Number(
  process.env.NEXT_PUBLIC_ROBINHOOD_CHAIN_ID || 4663
);

export const robinhoodChain = defineChain({
  id: ROBINHOOD_CHAIN_ID,
  name: process.env.NEXT_PUBLIC_ROBINHOOD_CHAIN_NAME || "Robinhood Chain",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: {
    default: {
      http: [
        process.env.NEXT_PUBLIC_ROBINHOOD_RPC_URL ||
          "https://rpc.mainnet.chain.robinhood.com",
      ],
    },
  },
  blockExplorers: {
    default: {
      name: "Robinhood Chain Explorer",
      url:
        process.env.NEXT_PUBLIC_ROBINHOOD_EXPLORER_URL ||
        "https://robinhoodchain.blockscout.com",
    },
  },
  testnet: false,
});

export const walletConnectConfigured = Boolean(
  process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID
);
