import Image from "next/image";
import Link from "next/link";
import { StatusBadge } from "@/components/states";
export type Artwork = {
  id: string;
  anonymousNumber: number;
  title: string;
  description?: string;
  imageUrl: string;
  voteCount?: number | null;
  challenge?: { number: number; title: string; status: string };
  creatorAddress?: string | null;
  nftStatus?: string | null;
};
export function ArtworkCard({
  artwork,
  href,
}: {
  artwork: Artwork;
  href?: string;
}) {
  const card = (
    <article className="art-card panel h-full overflow-hidden rounded-2xl">
      <div className="relative aspect-[4/5] overflow-hidden bg-[#091322]">
        <Image
          src={artwork.imageUrl}
          alt={artwork.title}
          fill
          sizes="(max-width: 768px) 50vw, 25vw"
          className="object-cover"
        />
      </div>
      <div className="p-4">
        <div className="flex items-center justify-between gap-3">
          <span className="eyebrow">
            ANON #{String(artwork.anonymousNumber).padStart(3, "0")}
          </span>
          {artwork.challenge && (
            <StatusBadge status={artwork.challenge.status} />
          )}
        </div>
        <h3 className="display mt-3 truncate text-lg font-semibold">
          {artwork.title}
        </h3>
        {artwork.voteCount != null && (
          <p className="mt-2 text-xs text-[#8fa2bb]">
            FINAL VOTES · {artwork.voteCount}
          </p>
        )}
      </div>
    </article>
  );
  return href ? (
    <Link href={href} className="block h-full">
      {card}
    </Link>
  ) : (
    card
  );
}
