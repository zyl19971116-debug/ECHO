# Production setup

Run the web server and three workers as four independent processes. PostgreSQL and Redis must be durable managed services or backed-up containers; R2/S3 remains external object storage. Terminate HTTPS at a reverse proxy and forward the original host, protocol and client IP.

Copy `.env.production.example` to a secret-managed runtime configuration. Use an HTTPS `NEXT_PUBLIC_APP_URL`; SIWE domain, URI, cookies and Origin validation derive from it. Never expose server RPC URLs, OpenAI keys, storage credentials or private keys as `NEXT_PUBLIC_*` variables.

Before launch run `npm ci`, `npm run preflight:production`, all tests, and `npm run build`. `/api/health` is liveness. `/api/health/ready` checks PostgreSQL, Redis, storage, AI configuration, mainnet RPC, contracts, WalletConnect and HTTPS origin without returning URLs or exceptions.

Run `npm audit --omit=dev --audit-level=high` in CI. The current dependency tree has upstream advisories whose automatic remediation requires breaking Next, Wagmi, Hardhat and Tailwind major upgrades. Production release remains blocked until those upgrades are handled in a dedicated compatibility branch or the advisories are formally risk-accepted with compensating controls. Never run `npm audit fix --force` directly on production source.

Do not run migrations automatically on web startup. First take and verify a PostgreSQL backup, run `npm run preflight:migrations`, review every SQL file and obtain explicit approval; only then run `npx prisma migrate deploy` from a one-off release job.

R2/S3 requires private-by-default bucket policy, scoped credentials, CORS limited to the production origin, and a separate HTTPS public asset domain. Generation objects stay under `private/`; only approved submissions and immutable NFT metadata are public.
