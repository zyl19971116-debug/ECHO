import Link from "next/link";
import {
  AlertTriangle,
  LoaderCircle,
  LockKeyhole,
  Sparkles,
} from "lucide-react";

export function LoadingState({
  label = "LOADING LIVE DATA",
}: {
  label?: string;
}) {
  return (
    <div
      className="panel flex min-h-56 flex-col items-center justify-center rounded-2xl p-8 text-center"
      aria-live="polite"
    >
      <LoaderCircle className="mb-5 animate-spin text-cyan-300" size={28} />
      <p className="eyebrow">{label}</p>
    </div>
  );
}
export function EmptyState({
  title,
  copy,
  action,
  href,
  className = "",
}: {
  title: string;
  copy: string;
  action?: string;
  href?: string;
  className?: string;
}) {
  return (
    <div
      className={`panel flex min-h-56 flex-col items-center justify-center rounded-2xl p-8 text-center ${className}`}
    >
      <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-full border border-dashed border-[#31547a] bg-[#0b152a]">
        <Sparkles size={18} className="text-cyan-300/70" />
      </div>
      <h3 className="display text-lg font-semibold">{title}</h3>
      <p className="mt-2 max-w-md text-sm leading-6 text-[#8194ae]">{copy}</p>
      {action && href && (
        <Link className="btn mt-6" href={href}>
          {action}
        </Link>
      )}
    </div>
  );
}
export function ErrorState({
  message,
  retry,
}: {
  message: string;
  retry?: () => void;
}) {
  return (
    <div
      role="alert"
      className="panel flex min-h-56 flex-col items-center justify-center rounded-2xl border-rose-400/25 p-8 text-center"
    >
      <AlertTriangle className="mb-5 text-rose-300" size={28} />
      <h3 className="display text-lg font-semibold">DATA UNAVAILABLE</h3>
      <p className="mt-2 max-w-md text-sm text-rose-100/75">{message}</p>
      {retry && (
        <button className="btn mt-6" onClick={retry}>
          TRY AGAIN
        </button>
      )}
    </div>
  );
}
export function WalletRequiredState({
  copy = "Connect your wallet and complete SIWE sign-in to continue.",
}: {
  copy?: string;
}) {
  return (
    <div className="panel flex min-h-56 flex-col items-center justify-center rounded-2xl p-8 text-center">
      <LockKeyhole className="mb-5 text-cyan-300" size={28} />
      <h3 className="display text-lg font-semibold">WALLET SIGN-IN REQUIRED</h3>
      <p className="mt-2 max-w-md text-sm text-[#8194ae]">{copy}</p>
      <p className="eyebrow mt-5">USE CONNECT &amp; SIGN IN ABOVE</p>
    </div>
  );
}
export function StatusBadge({ status }: { status: string }) {
  const tone =
    status === "LIVE" || status === "SUBMISSION" || status === "FINALIZED"
      ? "border-cyan-400/30 bg-cyan-400/10 text-cyan-200"
      : status === "PARTIAL" || status === "VOTING"
      ? "border-amber-400/30 bg-amber-400/10 text-amber-200"
      : "border-[#34506f] bg-[#101b2b] text-[#91a4be]";
  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-[9px] font-bold tracking-[.16em] ${tone}`}
    >
      {status}
    </span>
  );
}
