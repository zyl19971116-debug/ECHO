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
export default function Vote() {
  const q = useQuery({
    queryKey: ["vote-status"],
    queryFn: () => getJson<any>("/api/votes/status"),
  });
  return (
    <main className="shell pb-24">
      <PageTitle
        kicker="ONE ELIGIBLE WALLET • ONE VOTE"
        title="THE WORLD DECIDES."
        copy="Live rankings remain private. Voting will open only after one-time nonce consumption and eligibility checks are complete."
      />
      {q.isLoading ? (
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
        <div className="grid gap-5 lg:grid-cols-[1fr_.7fr]">
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
                  Pending secure eligibility policy
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
          <aside className="panel flex flex-col justify-center rounded-2xl p-7">
            <StatusBadge status="TEMPORARILY UNAVAILABLE" />
            <h3 className="display mt-5 text-xl">
              SECURE VOTING UPGRADE IN PROGRESS
            </h3>
            <p className="mt-3 text-sm leading-6 text-[#8fa2ba]">
              The existing endpoint does not yet consume a server-issued
              one-time vote nonce or enforce anti-Sybil eligibility. Submission
              is intentionally disabled—no vote will be simulated.
            </p>
            <button disabled className="btn mt-6 opacity-45">
              VOTING NOT YET AVAILABLE
            </button>
          </aside>
        </div>
      )}
    </main>
  );
}
