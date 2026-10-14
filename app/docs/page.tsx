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
    s: "PARTIAL",
    p: "Voting uses server-issued, single-use, expiring nonces bound to one wallet, challenge and submission, plus verified Robinhood Chain signatures. One-wallet-one-vote and self-vote prevention are live; this is explicitly not full anti-Sybil protection.",
  },
  {
    h: "Reveal System",
    s: "PARTIAL",
    p: "Deterministic persisted rankings, result hashes and scheduled lifecycle transitions are implemented. Results and author identities remain private until REVEAL; no onchain settlement is claimed.",
  },
  {
    h: "Echo Chain",
    s: "PARTIAL",
    p: "The timeline reads revealed EchoChainNode records and creates a moderator-review draft for the next challenge. Unapproved draft themes are not exposed publicly; automated AI theme approval is not claimed.",
  },
  {
    h: "Wallet & SIWE",
    s: "PARTIAL",
    p: "Wagmi, RainbowKit and Viem provide real injected, Coinbase and optional WalletConnect connections on Robinhood Chain Testnet. SIWE uses one-time database nonces and revocable sessions; production deployment still requires Redis, PostgreSQL and a WalletConnect Project ID.",
  },
  {
    h: "NFT Minting",
    s: "PARTIAL",
    p: "Testnet deployment, automatic server-authorized award minting, persistent metadata, receipt confirmation and recovery code are implemented. No contract deployment or mint is claimed until real addresses and successful receipts exist.",
  },
  {
    h: "Onchain Verification",
    s: "PARTIAL",
    p: "Robinhood Chain Testnet result registration, confirmation tracking, explorer links and Blockscout verification scripts are implemented. Contracts remain unverified and undeployed until credentials and funded testnet accounts are configured.",
  },
  {
    h: "Rate Limiting",
    s: "PARTIAL",
    p: "SIWE, AI, vote nonce, vote submission and administrator mutation endpoints use fail-closed Redis limits. Daily generation quota is transactional; production thresholds remain configuration-dependent.",
  },
  {
    h: "Audit Logs",
    s: "PARTIAL",
    p: "Authentication, generation, submission, voting, challenge transitions, settlement and administrator actions write structured audit records. Operational retention and export tooling remain pending.",
  },
  {
    h: "Anti-Sybil",
    s: "COMING SOON",
    p: "One-wallet-one-vote, signature verification, nonce replay protection and self-vote prevention are implemented. Proof-of-personhood, stake or abnormal-behavior monitoring are intentionally pending.",
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
