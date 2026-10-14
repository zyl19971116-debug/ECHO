"use client";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, ChevronRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getJson } from "@/lib/client-api";
import { ChallengeCard } from "@/components/challenge-card";
import { ArtworkCard, Artwork } from "@/components/artwork-card";
import { EmptyState, ErrorState, LoadingState } from "@/components/states";
export default function Home() {
  const challenge = useQuery({
    queryKey: ["challenge", "current"],
    queryFn: () => getJson<any>("/api/challenges/current"),
  });
  const stats = useQuery({
    queryKey: ["stats"],
    queryFn: () => getJson<any>("/api/stats"),
  });
  const gallery = useQuery({
    queryKey: ["submissions", "current"],
    queryFn: () =>
      getJson<{ submissions: Artwork[] }>("/api/submissions?mode=current"),
  });
  const result = useQuery({
    queryKey: ["results", "latest"],
    queryFn: () => getJson<any>("/api/results/latest"),
  });
  const galleryItems = gallery.data?.submissions ?? [];
  return (
    <main>
      <section className="shell grid min-h-[690px] items-center gap-6 py-8 lg:grid-cols-[.9fr_1.2fr_.9fr] xl:grid-cols-[.84fr_1.28fr_.88fr]">
        <div className="relative z-10">
          <p className="eyebrow mb-6">THE ANONYMOUS AI CREATIVE MARKET</p>
          <h1 className="display text-[54px] font-semibold leading-[.9] tracking-[-.065em] sm:text-[70px] xl:text-[80px] 2xl:text-[86px]">
            IDEAS HAVE
            <br />
            <span className="gradient-text">NO NAMES.</span>
          </h1>
          <p className="mt-7 text-xl leading-8 text-[#b5c3d8]">
            Create anonymously.
            <br />
            Let the world decide.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Link href="/create" className="btn btn-primary">
              ENTER CHALLENGE <ChevronRight size={14} />
            </Link>
            <Link href="/gallery" className="btn">
              EXPLORE GALLERY <ArrowUpRight size={14} />
            </Link>
          </div>
          <div className="mt-12 flex items-center gap-4 text-[10px] tracking-[.16em] text-[#7287a5]">
            <span className="h-px w-12 bg-gradient-to-r from-cyan-400 to-purple-500" />
            CREATE • COMPETE • REVEAL
          </div>
        </div>
        <div className="relative flex h-[520px] items-center justify-center overflow-hidden lg:h-[590px] xl:h-[650px] 2xl:h-[690px]">
          <div className="absolute h-[70%] w-[70%] rounded-full bg-cyan-400/10 blur-[90px]" />
          <div className="absolute aspect-square w-[82%] rounded-full border border-cyan-300/10" />
          <div className="absolute aspect-square w-[68%] rotate-45 rounded-full border border-purple-400/10" />
          <Image
            priority
            src="/echo-sculpture.png"
            alt="Glass and liquid chrome Echo sculpture"
            width={700}
            height={1050}
            sizes="(max-width: 1024px) 90vw, 42vw"
            className="float relative z-10 h-[108%] w-auto object-contain mix-blend-screen drop-shadow-[0_0_35px_rgba(33,200,255,.3)]"
          />
        </div>
        <aside className="space-y-4">
          {challenge.isLoading ? (
            <LoadingState label="LOADING CHALLENGE" />
          ) : challenge.isError ? (
            <ErrorState
              message="The current challenge could not be loaded."
              retry={() => challenge.refetch()}
            />
          ) : challenge.data.challenge ? (
            <ChallengeCard challenge={challenge.data.challenge} />
          ) : (
            <EmptyState
              title="NO ACTIVE CHALLENGE"
              copy="The next prompt has not been published yet. Nothing here is simulated."
              action="HOW IT WORKS"
              href="/docs"
            />
          )}
          <div className="panel rounded-2xl p-6">
            <span className="eyebrow">FEATURED WINNER</span>
            {result.isLoading ? (
              <div className="mt-5 h-24 animate-pulse rounded-xl bg-white/5" />
            ) : result.data?.podium?.[0] ? (
              <div className="mt-5">
                <ArtworkCard artwork={result.data.podium[0]} />
              </div>
            ) : (
              <div className="mt-5 rounded-xl border border-dashed border-[#284361] p-6 text-center">
                <p className="display text-sm">AWAITING FIRST REVEAL</p>
                <p className="mt-2 text-xs text-[#7589a4]">
                  The winning work will appear after a finalized vote.
                </p>
              </div>
            )}
          </div>
        </aside>
      </section>
      <section className="border-y hairline bg-[#07101caa]">
        <div className="shell grid grid-cols-2 md:grid-cols-4">
          {["CREATIONS", "CREATORS", "VOTES", "WINNERS"].map((label, i) => {
            const keys = ["creations", "creators", "votes", "winners"];
            return (
              <div
                className="border-r hairline px-5 py-6 last:border-r-0"
                key={label}
              >
                <div className="display text-3xl font-medium">
                  {stats.isLoading
                    ? "…"
                    : stats.isError
                    ? "—"
                    : Number(stats.data?.[keys[i]] || 0).toLocaleString()}
                </div>
                <div className="mt-1 text-[9px] tracking-[.2em] text-[#7187a4]">
                  {label}
                </div>
              </div>
            );
          })}
        </div>
        {stats.isError && (
          <p className="pb-3 text-center text-xs text-rose-300">
            Live statistics are temporarily unavailable.
          </p>
        )}
      </section>
      <section className="shell py-16">
        <div className="mb-7 flex items-end justify-between">
          <div>
            <div className="eyebrow">LIVE COLLECTION</div>
            <h2 className="display mt-2 text-3xl font-semibold">
              ANONYMOUS CREATIONS
            </h2>
          </div>
          <Link
            href="/gallery"
            className="text-xs tracking-[.15em] text-cyan-300"
          >
            VIEW ALL →
          </Link>
        </div>
        {gallery.isLoading ? (
          <LoadingState label="LOADING CREATIONS" />
        ) : gallery.isError ? (
          <ErrorState
            message="Creations could not be loaded."
            retry={() => gallery.refetch()}
          />
        ) : galleryItems.length ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4 xl:grid-cols-8">
            {galleryItems.slice(0, 8).map((x) => (
              <ArtworkCard
                artwork={x}
                href={`/gallery?id=${x.id}`}
                key={x.id}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            title="THE GALLERY IS QUIET—FOR NOW."
            copy="Be the first to leave an anonymous echo."
            action="START CREATING"
            href="/create"
          />
        )}
      </section>
    </main>
  );
}
