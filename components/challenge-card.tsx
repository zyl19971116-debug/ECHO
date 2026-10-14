import Link from "next/link";
import { StatusBadge } from "@/components/states";
export function ChallengeCard({
  challenge,
}: {
  challenge: {
    number: number;
    title: string;
    description: string;
    theme: string;
    status: string;
    submissionEnd: string;
  };
}) {
  return (
    <div className="panel rounded-2xl p-6">
      <div className="flex items-center justify-between">
        <span className="eyebrow">
          CHALLENGE #{String(challenge.number).padStart(3, "0")}
        </span>
        <StatusBadge status={challenge.status} />
      </div>
      <h2 className="display mt-5 text-2xl font-semibold">{challenge.title}</h2>
      <p className="mt-3 text-sm leading-6 text-[#93a5bd]">
        {challenge.description}
      </p>
      <div className="mt-4 text-[10px] tracking-[.14em] text-[#6f86a4]">
        THEME · {challenge.theme}
      </div>
      {challenge.status === "SUBMISSION" && (
        <Link href="/create" className="btn btn-primary mt-6 w-full">
          CREATE NOW
        </Link>
      )}
    </div>
  );
}
