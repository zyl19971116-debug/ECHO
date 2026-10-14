"use client";
import { useQuery } from "@tanstack/react-query";
import { PageTitle } from "@/components/ui";
import {
  EmptyState,
  ErrorState,
  LoadingState,
  StatusBadge,
  WalletRequiredState,
} from "@/components/states";
import { getJson } from "@/lib/client-api";
import { WalletSessionGuard } from "@/components/wallet-controls";
import { useWalletSession } from "@/components/wallet-session-provider";
import { ArtworkCard } from "@/components/artwork-card";
import { useSignMessage } from "wagmi";
import { useState } from "react";
import { buildVoteMessage } from "@/lib/vote-message";
export default function Vote() {
  const wallet = useWalletSession();
  const { signMessageAsync } = useSignMessage();
  const [pending, setPending] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const q = useQuery({
    queryKey: ["vote-status"],
    queryFn: () => getJson<any>("/api/votes/status"),
    enabled: wallet.isSignedIn,
  });
  async function vote(submissionId: string) {
    if (!wallet.address || !q.data?.challenge) return;
    setPending(submissionId); setMessage("");
    try {
      const nr = await fetch("/api/votes/nonce", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ challengeId: q.data.challenge.id, submissionId }) }); const nonce = await nr.json(); if (!nr.ok) throw new Error(nonce.error || "VOTE_NONCE_FAILED");
      const intent = { domain: nonce.domain, challengeId: q.data.challenge.id, submissionId, wallet: wallet.address, nonce: nonce.nonce, deadline: nonce.deadline, chainId: nonce.chainId };
      const signature = await signMessageAsync({ message: buildVoteMessage(intent) });
      const vr = await fetch("/api/votes", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...intent, signature }) }); const saved = await vr.json(); if (!vr.ok) throw new Error(saved.error || "VOTE_FAILED");
      setMessage("Your off-chain signed vote was saved."); await q.refetch();
    } catch (error) { setMessage(error instanceof Error ? error.message : "Vote signing was rejected."); }
    finally { setPending(null); }
  }
  return (
    <main className="shell pb-24">
      <PageTitle
        kicker="ONE ELIGIBLE WALLET • ONE VOTE"
        title="THE WORLD DECIDES."
        copy="Live rankings remain private. Voting will open only after one-time nonce consumption and eligibility checks are complete."
      />
      {!wallet.isSignedIn ? (
        <WalletSessionGuard copy="Connect and sign in to check challenge phase, eligibility and your existing vote."><span /></WalletSessionGuard>
      ) : q.isLoading ? (
        <LoadingState label="CHECKING VOTING STATUS" />
      ) : q.isError ? (
        <ErrorState
          message="Voting status could not be verified."
          retry={() => q.refetch()}
        />
      ) : !q.data.authenticated ? (
        <WalletRequiredState copy="Sign in to check challenge phase, eligibility and your existing vote." />
      ) : !q.data.challenge ? (
        <EmptyState
          title="NO ACTIVE CHALLENGE"
          copy="There is no submission or voting phase in progress."
        />
      ) : (
        <div className="grid gap-5">
          <section className="panel rounded-2xl p-7">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="eyebrow">
                CHALLENGE #{String(q.data.challenge.number).padStart(3, "0")}
              </span>
              <StatusBadge status={q.data.challenge.status} />
            </div>
            <h2 className="display mt-5 text-3xl">{q.data.challenge.title}</h2>
            <div className="mt-7 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border hairline p-4">
                <div className="eyebrow">ELIGIBILITY</div>
                <p className="mt-2 text-sm text-amber-200">
                  {q.data.eligible ? "Eligible · one wallet, one vote" : q.data.reason}
                </p>
              </div>
              <div className="rounded-xl border hairline p-4">
                <div className="eyebrow">YOUR VOTE</div>
                <p className="mt-2 text-sm text-[#a7b7ca]">
                  {q.data.vote ? "Vote recorded" : "No vote recorded"}
                </p>
              </div>
            </div>
          </section>
          <p className="text-xs text-[#8296b0]">OFF-CHAIN SIGNED VOTE · This one-wallet-one-vote policy is not full anti-Sybil protection. Live totals and rankings remain hidden.</p>
          {message && <p role="status" className="rounded-xl border hairline p-4 text-sm text-cyan-200">{message}</p>}
          <section className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{q.data.submissions.map((item: any) => <div key={item.id}><ArtworkCard artwork={item} /><button className="btn btn-primary mt-3 w-full disabled:opacity-50" disabled={!q.data.eligible || Boolean(q.data.vote) || Boolean(pending)} onClick={() => vote(item.id)}>{pending === item.id ? "WAITING FOR SIGNATURE…" : q.data.vote ? "VOTE RECORDED" : "SIGN & VOTE"}</button></div>)}</section>
        </div>
      )}
    </main>
  );
}
