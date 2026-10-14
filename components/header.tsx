"use client";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
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
  const pathname = usePathname();
  const menuRef = useRef<HTMLElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (event: KeyboardEvent | MouseEvent) => {
      if (event instanceof KeyboardEvent && event.key === "Escape") setOpen(false);
      if (event instanceof MouseEvent && menuRef.current && !menuRef.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", close);
    document.addEventListener("mousedown", close);
    return () => { document.removeEventListener("keydown", close); document.removeEventListener("mousedown", close); };
  }, [open]);
  return (
    <header ref={menuRef} className="sticky top-0 z-50 border-b hairline bg-[#050914d9] backdrop-blur-xl">
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
              aria-current={pathname === h ? "page" : undefined}
              className={`display text-[10px] font-bold tracking-[.14em] transition hover:text-white ${pathname === h ? "text-cyan-300" : "text-[#9baec8]"}`}
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
          aria-expanded={open}
          aria-controls="mobile-navigation"
        >
          {open ? <X /> : <Menu />}
        </button>
      </div>
      {open && (
        <div id="mobile-navigation" className="shell grid gap-1 border-t hairline py-4 xl:hidden">
          {links.map(([n, h]) => (
            <Link
              onClick={() => setOpen(false)}
              aria-current={pathname === h ? "page" : undefined}
              className={`display py-3 text-xs tracking-[.15em] ${pathname === h ? "text-cyan-300" : "text-[#9baec8]"}`}
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
