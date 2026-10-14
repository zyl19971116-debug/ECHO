"use client";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { NetworkBadge, WalletConnectButton } from "@/components/wallet-controls";
const links = [
  ["HOME", "/"],
  ["CREATE", "/create"],
  ["GALLERY", "/gallery"],
  ["VOTE", "/vote"],
  ["REVEAL", "/reveal"],
  ["ECHO CHAIN", "/echo-chain"],
  ["PROFILE", "/profile"],
  ["DOCS", "/docs"],
];
export function Header() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-50 border-b hairline bg-[#050914d9] backdrop-blur-xl">
      <div className="shell flex h-[74px] items-center gap-7">
        <Link
          href="/"
          className="display flex items-center gap-3 font-bold tracking-[.12em]"
        >
          <span className="relative h-8 w-8 rounded-full border border-cyan-300 shadow-[0_0_20px_#21c8ff66]">
            <i className="absolute inset-[6px] rounded-full border border-purple-400" />
          </span>
          <span>
            ECHO <b className="text-[#78dfff]">MARKET</b>
          </span>
        </Link>
        <nav className="hidden flex-1 justify-center gap-5 xl:flex">
          {links.map(([n, h]) => (
            <Link
              className="display text-[10px] font-bold tracking-[.14em] text-[#9baec8] transition hover:text-white"
              href={h}
              key={h}
            >
              {n}
            </Link>
          ))}
        </nav>
        <div className="ml-auto hidden items-center gap-3 md:flex">
          <NetworkBadge />
          <WalletConnectButton />
        </div>
        <button
          className="ml-auto xl:hidden"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
        >
          {open ? <X /> : <Menu />}
        </button>
      </div>
      {open && (
        <div className="shell grid gap-1 border-t hairline py-4 xl:hidden">
          {links.map(([n, h]) => (
            <Link
              onClick={() => setOpen(false)}
              className="display py-3 text-xs tracking-[.15em] text-[#9baec8]"
              href={h}
              key={h}
            >
              {n}
            </Link>
          ))}
          <div className="mt-2 md:hidden"><WalletConnectButton mobile /></div>
        </div>
      )}
    </header>
  );
}
