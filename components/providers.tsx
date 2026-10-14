"use client";
import "@rainbow-me/rainbowkit/styles.css";
import { RainbowKitProvider, darkTheme } from "@rainbow-me/rainbowkit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { WagmiProvider } from "wagmi";
import { wagmiConfig } from "@/lib/wagmi";
import { WalletSessionProvider } from "@/components/wallet-session-provider";
export function Providers({ children }: { children: React.ReactNode }) {
  const [q] = useState(() => new QueryClient());
  return <WagmiProvider config={wagmiConfig}><QueryClientProvider client={q}><RainbowKitProvider theme={darkTheme({ accentColor: "#21c8ff", borderRadius: "medium" })}><WalletSessionProvider>{children}</WalletSessionProvider></RainbowKitProvider></QueryClientProvider></WagmiProvider>;
}
