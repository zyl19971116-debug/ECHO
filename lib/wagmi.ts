import { connectorsForWallets } from "@rainbow-me/rainbowkit";
import {
  coinbaseWallet,
  injectedWallet,
  metaMaskWallet,
  rabbyWallet,
  walletConnectWallet,
} from "@rainbow-me/rainbowkit/wallets";
import { createConfig, http } from "wagmi";
import { robinhoodChain } from "@/lib/chain";

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "";
const wallets = [
  metaMaskWallet,
  rabbyWallet,
  coinbaseWallet,
  injectedWallet,
  ...(projectId ? [walletConnectWallet] : []),
];

export const wagmiConfig = createConfig({
  chains: [robinhoodChain],
  connectors: connectorsForWallets(
    [{ groupName: "Supported wallets", wallets }],
    { appName: "ECHO MARKET", projectId: projectId || "not-configured" }
  ),
  transports: {
    [robinhoodChain.id]: http(robinhoodChain.rpcUrls.default.http[0]),
  },
  ssr: true,
});
