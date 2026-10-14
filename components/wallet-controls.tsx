"use client";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { Check, Copy, ExternalLink, LogOut, Wallet } from "lucide-react";
import { useState } from "react";
import { robinhoodTestnet, walletConnectConfigured } from "@/lib/chain";
import { useWalletSession } from "@/components/wallet-session-provider";

export function NetworkBadge() {
  const wallet = useWalletSession();
  if (!wallet.isConnected) return <span className="display flex items-center gap-2 text-[9px] tracking-[.14em] text-[#91a6c3]"><i className="h-1.5 w-1.5 rounded-full bg-slate-500" />WALLET DISCONNECTED</span>;
  return <span className={`display flex items-center gap-2 text-[9px] tracking-[.14em] ${wallet.isCorrectNetwork ? "text-emerald-300" : "text-amber-300"}`}><i className={`h-1.5 w-1.5 rounded-full ${wallet.isCorrectNetwork ? "bg-emerald-400" : "bg-amber-400"}`} />{wallet.isCorrectNetwork ? "ROBINHOOD TESTNET" : "WRONG NETWORK"}</span>;
}

export function SwitchNetworkButton() {
  const wallet = useWalletSession();
  if (wallet.isCorrectNetwork) return null;
  return <button className="btn" onClick={() => wallet.switchNetwork().catch(() => undefined)}>SWITCH NETWORK</button>;
}

export function WalletConnectButton({ mobile = false }: { mobile?: boolean }) {
  const { openConnectModal } = useConnectModal();
  const wallet = useWalletSession();
  const [menu, setMenu] = useState(false);
  const [copied, setCopied] = useState(false);
  if (!wallet.isConnected) return <button className={`btn btn-primary ${mobile ? "w-full" : ""}`} onClick={openConnectModal}><Wallet size={14} />CONNECT WALLET</button>;
  const short = `${wallet.address?.slice(0, 6)}…${wallet.address?.slice(-4)}`;
  return <div className="relative">
    <button className="btn" onClick={() => setMenu(!menu)}><Wallet size={14} />{short}</button>
    {menu && <div className="absolute right-0 top-12 z-[70] w-72 rounded-xl border border-[#29405f] bg-[#08111f] p-4 shadow-2xl">
      <p className="display text-xs text-white">{wallet.connectorName || "EVM WALLET"}</p>
      <p className="mt-1 text-xs text-[#91a6c3]">{short}</p>
      <div className="mt-3"><NetworkBadge /></div>
      {!walletConnectConfigured && <p className="mt-3 text-[10px] leading-4 text-amber-200">WalletConnect QR is unavailable until its Project ID is configured. Browser wallets still work.</p>}
      {wallet.error && <p className="mt-3 text-[10px] text-rose-300">{wallet.error}</p>}
      <div className="mt-4 grid gap-2">
        <SwitchNetworkButton />
        {!wallet.isSignedIn ? <button disabled={wallet.isSigningIn || !wallet.isCorrectNetwork} className="btn btn-primary disabled:opacity-50" onClick={() => wallet.signIn().catch(() => undefined)}>{wallet.isSigningIn ? "WAITING FOR SIGNATURE…" : "SIGN IN"}</button> : <span className="btn justify-center text-emerald-300"><Check size={14} />SIGNED IN</span>}
        <button className="btn" onClick={async () => { if (wallet.address) await navigator.clipboard.writeText(wallet.address); setCopied(true); }}><Copy size={14} />{copied ? "COPIED" : "COPY ADDRESS"}</button>
        {wallet.address && <a className="btn" target="_blank" rel="noreferrer" href={`${robinhoodTestnet.blockExplorers.default.url}/address/${wallet.address}`}><ExternalLink size={14} />EXPLORER</a>}
        {wallet.isSignedIn && <button className="btn" onClick={() => wallet.signOut().catch(() => undefined)}>SIGN OUT</button>}
        <button className="btn" onClick={() => wallet.disconnectWallet().catch(() => undefined)}><LogOut size={14} />DISCONNECT</button>
      </div>
    </div>}
  </div>;
}

export function WalletSessionGuard({ children, copy = "Connect and sign in to continue." }: { children: React.ReactNode; copy?: string }) {
  const wallet = useWalletSession();
  if (wallet.isLoading) return <div className="panel p-6 text-sm text-[#91a6c3]">CHECKING WALLET SESSION…</div>;
  if (!wallet.isConnected) return <div className="panel p-6"><p className="mb-4 text-sm text-[#91a6c3]">{copy}</p><WalletConnectButton /></div>;
  if (!wallet.isCorrectNetwork) return <div className="panel p-6"><p className="mb-4 text-sm text-[#91a6c3]">Robinhood Chain Testnet is required.</p><SwitchNetworkButton /></div>;
  if (!wallet.isSignedIn) return <div className="panel p-6"><p className="mb-4 text-sm text-[#91a6c3]">Sign a secure message to access this feature. No transaction or gas is required.</p><button className="btn btn-primary" disabled={wallet.isSigningIn} onClick={() => wallet.signIn().catch(() => undefined)}>{wallet.isSigningIn ? "WAITING FOR SIGNATURE…" : "SIGN IN"}</button></div>;
  return children;
}
