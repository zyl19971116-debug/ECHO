"use client";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Download, Sparkles, Upload } from "lucide-react";
import { PageTitle } from "@/components/ui";
import { useQuery } from "@tanstack/react-query";
import { getJson } from "@/lib/client-api";
import { StatusBadge } from "@/components/states";
import { useWalletSession } from "@/components/wallet-session-provider";
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
export default function Create() {
  const [prompt, setPrompt] = useState("");
  const [style, setStyle] = useState("FUTURISTIC");
  const [format, setFormat] = useState("SQUARE");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [result, setResult] = useState<any>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState("");
  const running = useRef(false);
  const wallet = useWalletSession();
  const challenge = useQuery({
    queryKey: ["challenge", "current"],
    queryFn: () => getJson<any>("/api/challenges/current"),
  });
  const generations = useQuery({
    queryKey: ["generations"],
    queryFn: () => getJson<any>("/api/generations"),
    enabled: wallet.isSignedIn,
    refetchInterval: (query) => query.state.data?.generations?.some((job: any) => ["PENDING", "QUEUED", "PROCESSING", "RETRYING"].includes(job.status)) ? 3000 : false,
  });
  useEffect(() => {
    if (result || !generations.data?.generations?.length) return;
    const latest = generations.data.generations[0];
    if (latest.imageUrl || ["FAILED", "REJECTED"].includes(latest.status)) setResult({ ...latest, jobId: latest.id });
    else if (["PENDING", "QUEUED", "PROCESSING", "RETRYING"].includes(latest.status)) setStatus(latest.status === "PROCESSING" ? "AI is creating your artwork…" : "Your generation is queued or retrying…");
  }, [generations.data, result]);
  const open =
    challenge.data?.challenge?.status === "SUBMISSION" &&
    new Date(challenge.data.challenge.submissionEnd) > new Date();
  async function generate() {
    if (busy) return;
    if (prompt.trim().length < 8) {
      setResult({
        error: "Please describe your idea using at least 8 characters.",
      });
      return;
    }
    setBusy(true);
    running.current = true;
    setResult(null);
    setSubmitMessage("");
    setStatus("Checking wallet, challenge, and AI service…");
    try {
      const r = await fetch("/api/generate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ prompt: prompt.trim(), style, format, requestId: crypto.randomUUID() }),
      });
      const body = await r.json();
      if (!r.ok) throw new Error(body.error || "Generation request failed");
      setStatus("Generation queued. You may keep this page open.");
      for (let attempt = 0; attempt < 120 && running.current; attempt++) {
        await sleep(2000);
        const job = await getJson<any>(`/api/generate/${body.jobId}`);
        setStatus(
          job.status === "PROCESSING"
            ? "AI is creating your artwork…"
            : "Waiting for the generation worker…"
        );
        if (["COMPLETED", "SUCCEEDED"].includes(job.status)) {
          setResult({ ...job, jobId: body.jobId });
          setTitle("Untitled Echo");
          setStatus("");
          return;
        }
        if (["FAILED", "REJECTED"].includes(job.status))
          throw new Error(job.error || "Image generation failed");
      }
      throw new Error(
        "Generation is still running. Refresh your profile shortly to check the result."
      );
    } catch (e) {
      setResult({
        error: e instanceof Error ? e.message : "Generation failed",
      });
      setStatus("");
    } finally {
      setBusy(false);
      running.current = false;
    }
  }
  async function submit() {
    if (!result?.imageUrl || !challenge.data?.challenge || !open) return;
    setSubmitting(true);
    setSubmitMessage("");
    try {
      const r = await fetch("/api/submissions", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          challengeId: challenge.data.challenge.id,
          generationId: result.jobId || result.id,
          title,
          description,
        }),
      });
      const body = await r.json();
      if (!r.ok) throw new Error(body.error || "Submission failed");
      setSubmitMessage(
        `Submitted as ANON #${String(body.submission.anonymousNumber).padStart(
          3,
          "0"
        )}.`
      );
    } catch (e) {
      setSubmitMessage(e instanceof Error ? e.message : "Submission failed");
    } finally {
      setSubmitting(false);
    }
  }
  const gate = !wallet.isConnected
    ? "CONNECT WALLET TO CREATE"
    : !wallet.isSignedIn
    ? "CONNECT & SIGN IN TO CREATE"
    : !open
    ? "SUBMISSIONS ARE NOT OPEN"
    : "GENERATE WITH AI";
  return (
    <main className="shell pb-24">
      <PageTitle
        kicker="AI CREATION STUDIO"
        title="CREATE YOUR IDEA"
        copy="Turn a thought into an anonymous visual. Generation uses a real server-side image model—never a canned placeholder."
      />
      <div className="mb-5 flex flex-wrap gap-3">
        <StatusBadge
          status={
            wallet.isSignedIn ? "WALLET SIGNED IN" : wallet.isConnected ? "SIGN-IN REQUIRED" : "WALLET REQUIRED"
          }
        />
        <StatusBadge
          status={challenge.data?.challenge?.status || "NO ACTIVE CHALLENGE"}
        />
        {generations.data?.quota && <StatusBadge status={`${generations.data.quota.remaining} / ${generations.data.quota.limit} GENERATIONS LEFT`} />}
      </div>
      <div className="grid gap-6 lg:grid-cols-[.85fr_1.15fr]">
        <section className="panel rounded-2xl p-6 md:p-8">
          <label className="eyebrow" htmlFor="idea">
            DESCRIBE YOUR IDEA
          </label>
          <textarea
            id="idea"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            maxLength={800}
            placeholder="A memory of rain preserved inside a glass machine…"
            className="mt-4 min-h-40 w-full resize-none rounded-xl border border-[#243b59] bg-[#050a14] p-5 text-base text-white placeholder:text-[#52647c]"
          />
          <div className="mt-2 flex justify-between text-[10px]">
            <span
              className={
                prompt.length > 0 && prompt.trim().length < 8
                  ? "text-amber-300"
                  : "text-[#60728d]"
              }
            >
              {prompt.length > 0 && prompt.trim().length < 8
                ? "Minimum 8 characters"
                : "Be specific about subject, mood and materials"}
            </span>
            <span className="text-[#60728d]">{prompt.length} / 800</span>
          </div>
          <div className="mt-7 grid gap-5 sm:grid-cols-2">
            <label>
              <span className="eyebrow">ART STYLE</span>
              <select
                value={style}
                onChange={(e) => setStyle(e.target.value)}
                className="mt-3 w-full rounded-lg border border-[#29425e] bg-[#071020] p-3 text-sm"
              >
                {[
                  "FUTURISTIC",
                  "ABSTRACT",
                  "CYBERPUNK",
                  "MINIMAL",
                  "SURREAL",
                  "SCULPTURE",
                ].map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
            </label>
            <label>
              <span className="eyebrow">IMAGE FORMAT</span>
              <select
                value={format}
                onChange={(e) => setFormat(e.target.value)}
                className="mt-3 w-full rounded-lg border border-[#29425e] bg-[#071020] p-3 text-sm"
              >
                {["SQUARE", "LANDSCAPE", "PORTRAIT"].map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
            </label>
          </div>
          <button
            onClick={generate}
            disabled={busy || !wallet.isSignedIn || !open}
            className="btn btn-primary mt-8 w-full disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy ? (
              <>
                <i className="loader" />
                {status || "GENERATING WITH AI"}
              </>
            ) : (
              <>
                <Sparkles size={16} />
                {gate}
              </>
            )}
          </button>
          {!wallet.isLoading && !wallet.isSignedIn && (
            <p className="mt-4 text-xs text-amber-200">
              Use CONNECT &amp; SIGN IN in the navigation before generating.
            </p>
          )}
          {wallet.isSignedIn && !open && (
            <p className="mt-4 text-xs text-amber-200">
              There is no active submission window. Generation and submission
              are disabled.
            </p>
          )}
          {result?.error && (
            <div
              role="alert"
              className="mt-5 rounded-lg border border-rose-400/25 bg-rose-400/5 p-4 text-sm text-rose-200"
            >
              {result.error}
              <button
                onClick={generate}
                className="mt-3 block text-xs font-bold tracking-widest text-white"
              >
                RETRY →
              </button>
            </div>
          )}
        </section>
        <section className="panel flex min-h-[520px] items-center justify-center rounded-2xl p-6">
          {result?.imageUrl ? (
            <div className="w-full">
              <Image
                src={result.imageUrl}
                alt="Generated artwork"
                width={1024}
                height={1024}
                unoptimized
                className="max-h-[500px] w-full rounded-xl object-contain"
              />
              <div className="mt-5 grid gap-3">
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={100}
                  placeholder="Artwork title"
                  className="rounded-lg border border-[#29425e] bg-[#071020] p-3"
                />
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  maxLength={500}
                  placeholder="Artwork description"
                  className="min-h-20 rounded-lg border border-[#29425e] bg-[#071020] p-3"
                />
              </div>
              <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                <a className="btn flex-1" href={result.imageUrl} download>
                  <Download size={14} />
                  DOWNLOAD
                </a>
                <button
                  onClick={submit}
                  disabled={
                    submitting ||
                    !open ||
                    !wallet.isSignedIn ||
                    title.trim().length === 0
                  }
                  className="btn btn-primary flex-1 disabled:opacity-50"
                >
                  <Upload size={14} />
                  {submitting
                    ? "SUBMITTING…"
                    : open
                    ? "SUBMIT TO CHALLENGE"
                    : "SUBMISSIONS CLOSED"}
                </button>
              </div>
              {submitMessage && (
                <p role="status" className="mt-4 text-sm text-cyan-200">
                  {submitMessage}
                </p>
              )}
            </div>
          ) : (
            <div className="text-center">
              <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full border border-dashed border-[#2d5378] bg-cyan-400/5">
                <Sparkles className="text-cyan-300/70" size={30} />
              </div>
              <h3 className="display text-xl">
                {busy ? "CREATING YOUR ECHO" : "YOUR ECHO BEGINS HERE"}
              </h3>
              <p className="mt-2 text-sm text-[#788ca7]">
                {busy
                  ? status
                  : "Generate an artwork before entering the challenge."}
              </p>
            </div>
          )}
        </section>
      </div>
      {wallet.isSignedIn && <section className="panel mt-6 rounded-2xl p-6"><div className="flex items-center justify-between"><h2 className="display text-xl">MY GENERATIONS</h2><StatusBadge status={String(generations.data?.generations?.length || 0)} /></div><div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{generations.data?.generations?.slice(0, 6).map((job: any) => <button key={job.id} className="rounded-xl border hairline p-4 text-left" onClick={() => { setResult({ ...job, jobId: job.id }); if (job.imageUrl) setTitle("Untitled Echo"); }}><p className="truncate text-sm text-white">{job.prompt}</p><p className="mt-2 text-[10px] tracking-wider text-cyan-200">{job.status}</p></button>)}</div></section>}
    </main>
  );
}
