"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { SiweMessage } from "siwe";
import { useAccount, useChainId, useDisconnect, useSignMessage, useSwitchChain } from "wagmi";
import { ROBINHOOD_CHAIN_ID } from "@/lib/chain";

type Session = { authenticated: boolean; address: string | null; chainId: number | null; expiresAt: string | null };
type WalletState = {
  address?: `0x${string}`; connectorName?: string; isConnected: boolean; isCorrectNetwork: boolean;
  isSignedIn: boolean; isLoading: boolean; isSigningIn: boolean; error: string | null;
  signIn(): Promise<void>; signOut(): Promise<void>; disconnectWallet(): Promise<void>; switchNetwork(): Promise<void>;
};
const Context = createContext<WalletState | null>(null);

async function json<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, options);
  const body = await response.json();
  if (!response.ok) throw new Error(body.error || "REQUEST_FAILED");
  return body;
}

export function WalletSessionProvider({ children }: { children: React.ReactNode }) {
  const account = useAccount();
  const chainId = useChainId();
  const { disconnectAsync } = useDisconnect();
  const { signMessageAsync } = useSignMessage();
  const { switchChainAsync } = useSwitchChain();
  const queryClient = useQueryClient();
  const [isSigningIn, setSigningIn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const invalidating = useRef(false);
  const session = useQuery({ queryKey: ["wallet-session"], queryFn: () => json<Session>("/api/auth/session"), refetchOnWindowFocus: true });
  const isSignedIn = Boolean(session.data?.authenticated && account.address && session.data.address?.toLowerCase() === account.address.toLowerCase() && session.data.chainId === chainId && session.data.expiresAt && new Date(session.data.expiresAt) > new Date());

  const signOut = useCallback(async () => {
    await json("/api/auth/logout", { method: "POST" });
    await queryClient.invalidateQueries({ queryKey: ["wallet-session"] });
  }, [queryClient]);

  useEffect(() => {
    if (!session.data?.authenticated || invalidating.current || account.status === "reconnecting" || account.status === "connecting") return;
    const mismatch = !account.address || session.data.address?.toLowerCase() !== account.address.toLowerCase() || session.data.chainId !== chainId;
    if (!mismatch) return;
    invalidating.current = true;
    signOut().catch(() => queryClient.invalidateQueries({ queryKey: ["wallet-session"] })).finally(() => { invalidating.current = false; });
  }, [account.address, account.status, chainId, queryClient, session.data, signOut]);

  const value = useMemo<WalletState>(() => ({
    address: account.address, connectorName: account.connector?.name,
    isConnected: account.isConnected, isCorrectNetwork: chainId === ROBINHOOD_CHAIN_ID,
    isSignedIn, isLoading: session.isLoading, isSigningIn, error,
    async switchNetwork() {
      setError(null);
      try { await switchChainAsync({ chainId: ROBINHOOD_CHAIN_ID }); }
      catch (cause) { const message = cause instanceof Error ? cause.message : "NETWORK_SWITCH_REJECTED"; setError(message); throw cause; }
    },
    async signIn() {
      if (!account.address) throw new Error("CONNECT_WALLET_FIRST");
      setSigningIn(true); setError(null);
      try {
        if (chainId !== ROBINHOOD_CHAIN_ID) await switchChainAsync({ chainId: ROBINHOOD_CHAIN_ID });
        const nonce = await json<{ nonce: string }>("/api/auth/nonce", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ address: account.address, chainId: ROBINHOOD_CHAIN_ID }) });
        const issuedAt = new Date();
        const message = new SiweMessage({ domain: location.host, address: account.address, statement: "Sign in to ECHO MARKET. This does not initiate a transaction.", uri: location.origin, version: "1", chainId: ROBINHOOD_CHAIN_ID, nonce: nonce.nonce, issuedAt: issuedAt.toISOString(), expirationTime: new Date(issuedAt.getTime() + 10 * 60_000).toISOString() }).prepareMessage();
        const signature = await signMessageAsync({ message });
        await json("/api/auth/verify", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ message, signature }) });
        await queryClient.invalidateQueries({ queryKey: ["wallet-session"] });
      } catch (cause) { const message = cause instanceof Error ? cause.message : "SIGN_IN_FAILED"; setError(message); throw cause; }
      finally { setSigningIn(false); }
    },
    signOut,
    async disconnectWallet() { if (session.data?.authenticated) await signOut(); await disconnectAsync(); },
  }), [account.address, account.connector?.name, account.isConnected, chainId, disconnectAsync, error, isSignedIn, isSigningIn, queryClient, session.data?.authenticated, session.isLoading, signMessageAsync, signOut, switchChainAsync]);
  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useWalletSession() {
  const value = useContext(Context);
  if (!value) throw new Error("WalletSessionProvider is missing");
  return value;
}
