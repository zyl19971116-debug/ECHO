"use client";
import { useQuery } from "@tanstack/react-query";
import { PageTitle } from "@/components/ui";
import {
  ErrorState,
  LoadingState,
  StatusBadge,
  WalletRequiredState,
} from "@/components/states";
import { getJson } from "@/lib/client-api";
export default function Profile() {
  const q = useQuery({
    queryKey: ["profile"],
    queryFn: () => getJson<any>("/api/profile"),
    retry: false,
  });
  if (q.isLoading)
    return (
      <main className="shell pb-24">
        <PageTitle
          kicker="YOUR PRIVATE RECORD"
          title="PROFILE"
          copy="Loading records owned by the authenticated wallet."
        />
        <LoadingState label="LOADING WALLET RECORDS" />
      </main>
    );
  if (q.isError) {
    const auth = (q.error as Error).message === "AUTH_REQUIRED";
    return (
      <main className="shell pb-24">
        <PageTitle
          kicker="YOUR PRIVATE RECORD"
          title="PROFILE"
          copy="Your creations, submissions, votes, awards and NFTs."
        />
        {auth ? (
          <WalletRequiredState />
        ) : (
          <ErrorState
            message="Your profile could not be loaded."
            retry={() => q.refetch()}
          />
        )}
      </main>
    );
  }
  const p = q.data.profile;
  const groups = [
    {
      name: "MY CREATIONS",
      items: p.generations,
      empty: "No generated artworks yet.",
    },
    {
      name: "MY SUBMISSIONS",
      items: p.submissions,
      empty: "No challenge submissions yet.",
    },
    { name: "MY VOTES", items: p.votes, empty: "No recorded votes yet." },
    { name: "MY AWARDS", items: p.awards, empty: "No awards yet." },
    {
      name: "MY NFTs",
      items: p.awards.filter((a: any) => a.nft),
      empty: "No minted achievement NFTs yet.",
    },
  ];
  return (
    <main className="shell pb-24">
      <PageTitle
        kicker="YOUR PRIVATE RECORD"
        title="PROFILE"
        copy={`Authenticated wallet ${p.walletAddress.slice(
          0,
          8
        )}…${p.walletAddress.slice(-6)}`}
      />
      <div className="grid gap-5 lg:grid-cols-2">
        {groups.map((group) => (
          <section className="panel rounded-2xl p-6" key={group.name}>
            <div className="flex items-center justify-between">
              <h2 className="display text-xl">{group.name}</h2>
              <StatusBadge status={String(group.items.length)} />
            </div>
            {group.items.length === 0 ? (
              <p className="mt-6 text-sm text-[#7f93ad]">{group.empty}</p>
            ) : (
              <div className="mt-5 space-y-3">
                {group.items.slice(0, 6).map((item: any) => (
                  <div className="rounded-xl border hairline p-4" key={item.id}>
                    <p className="text-sm text-white">
                      {item.title ||
                        item.prompt ||
                        item.submission?.title ||
                        item.challenge?.title ||
                        `Award rank ${item.rank}`}
                    </p>
                    <p className="mt-2 text-[10px] tracking-wider text-[#7388a4]">
                      {item.status ||
                        item.nft?.status ||
                        new Date(item.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>
        ))}
      </div>
    </main>
  );
}
