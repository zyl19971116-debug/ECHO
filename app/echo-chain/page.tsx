"use client";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import { PageTitle } from "@/components/ui";
import {
  EmptyState,
  ErrorState,
  LoadingState,
  StatusBadge,
} from "@/components/states";
import { getJson } from "@/lib/client-api";
export default function EchoChain() {
  const q = useQuery({
    queryKey: ["echo-chain"],
    queryFn: () => getJson<any>("/api/echo-chain"),
  });
  return (
    <main className="shell pb-24">
      <PageTitle
        kicker="CREATIVE LINEAGE"
        title="ECHO CHAIN"
        copy="Each finalized winner can become the moderated reference source for the next challenge."
      />
      {q.isLoading ? (
        <LoadingState label="TRACING THE ECHO" />
      ) : q.isError ? (
        <ErrorState
          message="The creative lineage could not be loaded."
          retry={() => q.refetch()}
        />
      ) : q.data.nodes.length === 0 ? (
        <EmptyState
          title="THE FIRST ECHO HAS NOT BEEN CREATED YET."
          copy="The lineage begins only after a real challenge result is finalized."
        />
      ) : (
        <div className="mx-auto max-w-4xl">
          <div className="relative ml-4 border-l border-cyan-400/20 pl-9">
            {q.data.nodes.map((node: any) => (
              <article
                className="panel relative mb-6 grid gap-5 rounded-2xl p-5 sm:grid-cols-[140px_1fr]"
                key={node.id}
              >
                <i className="absolute -left-[43px] top-8 h-3 w-3 rounded-full bg-cyan-300 shadow-[0_0_14px_#21c8ff]" />
                <div className="relative aspect-square overflow-hidden rounded-xl">
                  <Image
                    src={node.challenge.result.winner.imageUrl}
                    alt={node.challenge.result.winner.title}
                    fill
                    className="object-cover"
                  />
                </div>
                <div>
                  <div className="flex justify-between gap-3">
                    <span className="eyebrow">
                      DAY {String(node.challenge.number).padStart(3, "0")}
                    </span>
                    <StatusBadge
                      status={
                        node.challenge.result.winner.awards[0]?.nft?.status ||
                        "NO NFT"
                      }
                    />
                  </div>
                  <h2 className="display mt-3 text-2xl">
                    {node.challenge.title}
                  </h2>
                  <p className="mt-2 text-sm text-[#91a4bc]">
                    WINNER · {node.challenge.result.winner.title}
                  </p>
                  <p className="mt-2 text-xs text-[#7187a3]">
                    {node.relation || "Genesis echo"}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}
