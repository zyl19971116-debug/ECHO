import { PageTitle } from "@/components/ui";
import { StatusBadge } from "@/components/states";
const sections = [
  {
    h: "Product & Responsive UI",
    s: "LIVE",
    p: "All eight routes share the same dark gallery design system, navigation, responsive layout and honest empty states.",
  },
  {
    h: "AI Image Generation",
    s: "PARTIAL",
    p: "A real server-side OpenAI adapter and BullMQ worker exist. It requires configured credentials, Redis, PostgreSQL, an active challenge and production object storage before deployment.",
  },
  {
    h: "Anonymous Submission",
    s: "PARTIAL",
    p: "Authenticated generated work can be submitted through the real API. Creator IDs are excluded from public DTOs, but the moderation and production storage pipeline remains incomplete.",
  },
  {
    h: "Voting",
    s: "COMING SOON",
    p: "The existing signature endpoint is not exposed in the UI until server-issued one-time vote nonces and eligibility checks are implemented.",
  },
  {
    h: "Reveal System",
    s: "PARTIAL",
    p: "Finalized database results can be displayed after reveal time. Automatic settlement and scheduled phase transitions are not implemented.",
  },
  {
    h: "Echo Chain",
    s: "PARTIAL",
    p: "The timeline reads real finalized EchoChainNode records. Automated and moderated next-theme creation is not yet implemented.",
  },
  {
    h: "Wallet & SIWE",
    s: "PARTIAL",
    p: "Injected EVM wallets and SIWE login are supported. Multi-wallet connectors, session restoration and network switching remain for the Web3 phase.",
  },
  {
    h: "NFT Minting",
    s: "COMING SOON",
    p: "Contracts and unit tests exist locally, but no deployment, claim flow or confirmed onchain mint is claimed.",
  },
  {
    h: "Onchain Verification",
    s: "COMING SOON",
    p: "No deployed contract addresses or verified result transactions are configured.",
  },
  {
    h: "Rate Limiting",
    s: "COMING SOON",
    p: "A basic daily generation count exists, but production-grade atomic quotas and distributed API rate limiting are not implemented.",
  },
  {
    h: "Audit Logs",
    s: "COMING SOON",
    p: "The database model exists, but application and administrator actions are not yet written to it.",
  },
  {
    h: "Anti-Sybil",
    s: "COMING SOON",
    p: "One-wallet-one-vote is not sufficient. Eligibility policy and abnormal-behavior monitoring are intentionally pending.",
  },
] as const;
export default function Docs() {
  return (
    <main className="shell pb-24">
      <PageTitle
        kicker="PROTOCOL & PRODUCT"
        title="DOCUMENTATION"
        copy="This implementation matrix distinguishes working features from configuration-dependent and future work."
      />
      <div className="mb-7 flex flex-wrap gap-3">
        <StatusBadge status="LIVE" />
        <StatusBadge status="PARTIAL" />
        <StatusBadge status="COMING SOON" />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {sections.map((x) => (
          <section className="panel rounded-xl p-6" key={x.h}>
            <div className="flex items-start justify-between gap-4">
              <h2 className="display text-xl font-semibold">{x.h}</h2>
              <StatusBadge status={x.s} />
            </div>
            <p className="mt-4 text-sm leading-7 text-[#8da0b9]">{x.p}</p>
          </section>
        ))}
      </div>
    </main>
  );
}
