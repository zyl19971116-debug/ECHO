"use client";
import { useQuery } from "@tanstack/react-query";
import { PageTitle } from "@/components/ui";
import { ArtworkCard } from "@/components/artwork-card";
import {
  EmptyState,
  ErrorState,
  LoadingState,
  StatusBadge,
} from "@/components/states";
import { getJson } from "@/lib/client-api";
export default function Reveal() {
  const q = useQuery({
    queryKey: ["results", "latest"],
    queryFn: () => getJson<any>("/api/results/latest"),
  });
  return (
    <main className="shell pb-24">
      <PageTitle
        kicker="IDENTITY AFTER JUDGEMENT"
        title="THE REVEAL."
        copy="Rankings, creator addresses and award status are returned only for finalized results after the trusted reveal time."
      />
      {q.isLoading ? (
        <LoadingState label="VERIFYING FINAL RESULT" />
      ) : q.isError ? (
        <ErrorState
          message="Finalized results could not be loaded."
          retry={() => q.refetch()}
        />
      ) : !q.data.challenge ? (
        <EmptyState
          title="NO FINALIZED RESULT"
          copy="No creator identity or ranking will be shown before a real result is finalized."
          action="EXPLORE THE GALLERY"
          href="/gallery"
        />
      ) : (
        <>
          <div className="panel mb-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl p-6">
            <div>
              <span className="eyebrow">
                CHALLENGE #{String(q.data.challenge.number).padStart(3, "0")}
              </span>
              <h2 className="display mt-2 text-2xl">
                {q.data.challenge.title}
              </h2>
            </div>
            <StatusBadge status="FINALIZED" />
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            {q.data.podium.map((item: any) => (
              <div key={item.id}>
                <div className="mb-3 flex items-center justify-between">
                  <span className="display text-xl">#{item.rank}</span>
                  <StatusBadge status={item.nft?.status || "NFT NOT MINTED"} />
                </div>
                <ArtworkCard artwork={item} />
                <div className="mt-3 rounded-xl border hairline p-4 text-xs text-[#93a6bf]">
                  <p>
                    CREATOR · {item.creatorAddress.slice(0, 8)}…
                    {item.creatorAddress.slice(-6)}
                  </p>
                  <p className="mt-2">FINAL VOTES · {item.voteCount}</p>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </main>
  );
}
