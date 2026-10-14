# ECHO MARKET

Anonymous AI creation competitions for Robinhood Chain. This repository contains the Next.js app, PostgreSQL/Prisma data model, SIWE session API, BullMQ image worker, transactional voting endpoint, and two tested Solidity contracts.

## Local setup

1. Install Node.js 20+, PostgreSQL and Redis.
2. Copy `.env.example` to `.env` and set values. Obtain Robinhood Chain testnet parameters from the current official documentation; the project intentionally does not guess them.
3. Run `npm install`, `npm run db:generate`, and `npm run db:migrate -- --name init`.
4. In one terminal run `npm run worker`; in another run `npm run dev`.

No challenge or submission seed data is inserted. Create an active challenge through an admin workflow/database before testing generation.

## External configuration

- `OPENAI_API_KEY` enables real image generation. Without it `/api/generate` returns `AI SERVICE NOT CONFIGURED`.
- `DATABASE_URL` and `REDIS_URL` enable persistence and the queue.
- `AUTH_SECRET` must be at least 32 random characters.
- `NEXT_PUBLIC_ROBINHOOD_*` values must come from official Robinhood Chain documentation.
- `DEPLOYER_PRIVATE_KEY` is used only by Hardhat on the server/CLI. Never expose it as `NEXT_PUBLIC_*`.
- `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` is needed when RainbowKit WalletConnect is enabled.

## Commands

`npm run dev` — app · `npm run worker` — AI queue worker · `npm run build` — production build · `npm run contracts:test` — Solidity tests · `npx hardhat run scripts/deploy.ts --network robinhoodTestnet` — deploy.

## Security model

Public submission DTOs omit creator IDs. Nonces expire and are single-use. Sessions use signed HTTP-only cookies. Vote signatures bind domain, challenge, submission, wallet, nonce, deadline and chain ID. The database unique constraint and transaction prevent duplicate votes. Contracts use role-based issuance and immutable result records.

## Configuration-dependent / remaining work

- Connect RainbowKit/Reown UI after official network and WalletConnect values are supplied. The current connect button uses the real injected EIP-1193 provider and never simulates a wallet.
- Production object storage is not configured; the worker stores generated files under `public/generated` for local deployment. Replace this persistence adapter with S3/R2 before horizontally scaling.
- Add an admin console and scheduled challenge-transition workers. The schema and BullMQ foundation are present.
- Add eligibility-provider rules for anti-Sybil checks; one-wallet-one-vote alone is explicitly insufficient.
- Deploy and verify contracts only after RPC and deployer credentials are provided; no deployment is claimed here.
- Add full browser E2E coverage after infrastructure values and an active test challenge exist.

## Test report

Run results are recorded in the final delivery message. No external-service success is claimed without configured credentials.
