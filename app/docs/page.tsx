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
    p: "The authenticated pipeline performs OpenAI prompt moderation, queued image generation, image moderation, metadata cleanup, SHA-256 hashing and private S3-compatible storage. Live operation requires configured OpenAI, Redis, PostgreSQL and object storage services.",
  },
  {
    h: "Anonymous Submission",
    s: "PARTIAL",
    p: "Only the authenticated owner's approved, integrity-checked stored asset can be submitted. Anonymous numbers use a transactional challenge counter, and public DTOs exclude creator and private storage identity.",
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
    p: "Wagmi, RainbowKit and Viem provide real injected, Coinbase and optional WalletConnect connections on Robinhood Chain Testnet. SIWE uses one-time database nonces and revocable sessions; production deployment still requires Redis, PostgreSQL and a WalletConnect Project ID.",
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
    s: "PARTIAL",
    p: "SIWE and AI request endpoints use fail-closed Redis limits. Daily generation quota is a transactional PostgreSQL record with reservation, confirmation and defined refund behavior; production thresholds remain configuration-dependent.",
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
