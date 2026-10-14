"use client";
import Link from "next/link";
import { StatusBadge } from "@/components/states";
import { useEffect, useState } from "react";
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
    votingEnd?: string;
    _count?: { submissions: number };
  };
}) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const timer = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(timer); }, []);
  const deadline = challenge.status === "VOTING" ? challenge.votingEnd : challenge.submissionEnd;
  const remaining = Math.max(0, new Date(deadline || 0).getTime() - now);
  const countdown = `${Math.floor(remaining / 86400000)}D ${Math.floor((remaining / 3600000) % 24)}H ${Math.floor((remaining / 60000) % 60)}M ${Math.floor((remaining / 1000) % 60)}S`;
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
      {["SUBMISSION", "VOTING"].includes(challenge.status) && <div className="mt-3 text-xs tracking-[.12em] text-cyan-200">{challenge.status === "VOTING" ? "VOTING ENDS" : "SUBMISSIONS END"} · {countdown}</div>}
      <div className="mt-3 text-[10px] tracking-[.14em] text-[#6f86a4]">PARTICIPATING WORKS · {challenge._count?.submissions || 0}</div>
      {challenge.status === "SUBMISSION" && (
        <Link href="/create" className="btn btn-primary mt-6 w-full">
          CREATE NOW
        </Link>
      )}
    </div>
  );
}
