"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PageTitle } from "@/components/ui";
import { ArtworkCard, Artwork } from "@/components/artwork-card";
import { EmptyState, ErrorState, LoadingState } from "@/components/states";
import { getJson } from "@/lib/client-api";
const filters = [
  { id: "current", label: "CURRENT CHALLENGE" },
  { id: "history", label: "HISTORY" },
  { id: "latest", label: "LATEST" },
] as const;
export default function Gallery() {
  const [mode, setMode] = useState<(typeof filters)[number]["id"]>("current");
  const query = useQuery({
    queryKey: ["submissions", mode],
    queryFn: () =>
      getJson<{ submissions: Artwork[] }>(`/api/submissions?mode=${mode}`),
  });
  const items = query.data?.submissions ?? [];
  return (
    <main className="shell pb-24">
      <PageTitle
        kicker="CURRENT & ARCHIVED WORKS"
        title="ANONYMOUS GALLERY"
        copy="Discover ideas before their creators are revealed. Live vote counts and creator identities remain private until reveal."
      />
      <div
        className="mb-8 flex flex-wrap gap-2"
        role="tablist"
        aria-label="Gallery filters"
      >
        {filters.map((x) => (
          <button
            role="tab"
            aria-selected={mode === x.id}
            className={`btn ${mode === x.id ? "btn-primary" : ""}`}
            onClick={() => setMode(x.id)}
            key={x.id}
          >
            {x.label}
          </button>
        ))}
      </div>
      {query.isLoading ? (
        <LoadingState label="CURATING THE GALLERY" />
      ) : query.isError ? (
        <ErrorState
          message="The gallery could not be loaded."
          retry={() => query.refetch()}
        />
      ) : items.length ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
          {items.map((item) => (
            <ArtworkCard key={item.id} artwork={item} />
          ))}
        </div>
      ) : (
        <EmptyState
          title={
            mode === "history"
              ? "NO REVEALED HISTORY YET"
              : "NO PUBLIC SUBMISSIONS YET"
          }
          copy={
            mode === "history"
              ? "Completed and revealed challenge works will appear here."
              : "Submitted work appears here only after validation and privacy checks."
          }
          action={mode !== "history" ? "CREATE THE FIRST ECHO" : undefined}
          href={mode !== "history" ? "/create" : undefined}
        />
      )}
    </main>
  );
}
