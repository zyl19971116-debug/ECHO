# Production Service Integration

## Current verified state

The Phase 6A execution environment contained no `.env`, `.env.local`, or `.env.production` file and none of the production variables were present in the process environment. Only example files were present. Consequently no PostgreSQL, Redis, OpenAI, object-storage, WalletConnect, or Robinhood RPC connection is claimed as successful.

Run `npm run preflight:services` in the deployment secret context. It reports only `present`, `valid`, and a format reason; it never prints a value and performs no network calls. Then call `/api/health/ready` to perform bounded read-only dependency checks.

## Required configuration

Configure `DATABASE_URL`, `REDIS_URL`, `AUTH_SECRET` (at least 32 characters), `OPENAI_API_KEY`, `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`, `STORAGE_PROVIDER=s3`, `S3_REGION`, `S3_BUCKET`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `PUBLIC_ASSET_BASE_URL`, `NEXT_PUBLIC_APP_URL`, and `ROBINHOOD_SERVER_RPC_URL`. `ROBINHOOD_MAINNET_RPC_URL` remains a legacy alias. R2 additionally requires an HTTPS `S3_ENDPOINT`; AWS S3 may omit it.

## PostgreSQL — approval gate

Read-only checks after configuration:

```sh
npx prisma validate
npx prisma migrate status
npm run preflight:migrations
```

Before any migration, create a provider snapshot plus a logical backup such as `pg_dump --format=custom --no-owner --file=echo-market-YYYYMMDD.dump "$DATABASE_URL"`, verify the backup can be listed with `pg_restore --list`, review every migration SQL file, and obtain explicit approval. Only then run `npx prisma migrate deploy` as a one-off release job. Never use `migrate reset` in production.

## Redis and workers

Read-only checks are `redis-cli -u "$REDIS_URL" PING` and `/api/health/ready`, which also reports aggregate waiting/delayed/failed job counts. Start workers as independent supervised services:

```sh
npm run worker
npm run worker:contest
npm run worker:onchain
```

Keep one onchain worker initially. All workers handle SIGTERM/SIGINT and emit heartbeats. Docker Compose now waits for healthy PostgreSQL and Redis and gives each process 30 seconds to stop cleanly.

## OpenAI and moderation

`OPENAI_IMAGE_MODEL` defaults to `gpt-image-1`; moderation uses `omni-moderation-latest`. Generation limits and cost budget must be explicitly reviewed. Configuration checks do not call OpenAI. A paid acceptance generation requires separate authorization and should verify moderation, private upload, quota accounting, retry behavior, and failure refund.

## R2 / S3

The readiness endpoint performs `HeadBucket`, a read-only operation. Private generation keys use `private/generations/`; approved artwork is copied to `public/`; NFT JSON uses the configured metadata base URL. Before launch, manually verify that anonymous GET against a private key is denied and a server-generated five-minute signed URL succeeds. Any probe that uploads/deletes an object or changes bucket policy requires approval.

## Wallet and SIWE acceptance

Use the final HTTPS domain and test, in order: Connect Wallet, Sign In, page refresh/session restore, switch account, switch network away from and back to 4663, Sign Out, and Disconnect. Confirm account/network changes revoke the prior session and cookies are `HttpOnly`, `Secure`, `SameSite=Lax`. Repeat with MetaMask, Rabby, Coinbase Wallet, and the intended Robinhood-compatible wallet. These real-wallet checks are currently unverified.

## Robinhood Mainnet read-only verification

Chain ID must be 4663 and the explorer is `https://robinhoodchain.blockscout.com`. After configuring the server RPC, run `npm run preflight:production`; it checks chain identity, balances, bytecode, and gas estimates without signing or broadcasting. Contract, administrator, operator, and minter addresses remain unverified until supplied. Keep `MAINNET_TRANSACTION_APPROVED=false` and `MAINNET_DEPLOYMENT_APPROVED` empty during read-only acceptance.

## Deployment checklist

- Terminate HTTPS at a trusted reverse proxy and preserve Host, protocol, and client IP headers.
- Run web, AI Worker, Contest Worker, and exactly one Onchain Worker as separately monitored processes.
- Alert on `/api/health/ready`, worker heartbeat absence, failed/waiting queue growth, database saturation, Redis memory, OpenAI spend, storage errors, RPC latency, and stuck transaction states.
- Configure encrypted daily PostgreSQL backups, retention, restore drills, Redis persistence, centralized structured logs, and secret rotation.
- Do not release while production High vulnerabilities remain unless an accountable owner signs a time-bounded risk acceptance.
