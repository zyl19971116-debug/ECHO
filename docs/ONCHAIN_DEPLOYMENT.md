# Robinhood Chain Testnet deployment

Target network: Robinhood Chain Testnet, chain ID `46630`, public RPC `https://rpc.testnet.chain.robinhood.com`, explorer `https://explorer.testnet.chain.robinhood.com`.

## Preconditions

1. Apply all Prisma migrations in order against the intended PostgreSQL database.
2. Configure Redis and run `npm run worker:onchain`.
3. Set `ROBINHOOD_SERVER_RPC_URL` to a production-capable testnet provider endpoint.
4. Set `DEPLOYER_PRIVATE_KEY` and `AWARD_MINTER_PRIVATE_KEY` only in the server secret store. Never use a browser-prefixed variable.
5. Fund the deployer and operational minter with testnet ETH.
6. Confirm that `deployments/robinhood-testnet.json`, `ECHO_NFT_ADDRESS`, and `ECHO_REGISTRY_ADDRESS` do not already describe an existing deployment.

## Deploy and verify

```text
npm run contracts:test
npm run deploy:robinhood-testnet
npm run verify:robinhood-testnet
```

The deploy script refuses the wrong chain, an empty gas balance, missing keys, and an existing deployment record. It writes an immutable deployment artifact only after both receipts succeed. The operator receives `AWARD_ISSUER_ROLE` and `RECORDER_ROLE`; when it differs from the deployer, the deployer's operational roles are revoked while its administrator role remains for testnet governance.

Verification uses the Blockscout-compatible endpoint `https://explorer.testnet.chain.robinhood.com/api/`. A failed verification remains `UNVERIFIED` in the deployment artifact. It must not be presented as verified until the explorer reports verified source code.

If automated verification is unavailable, open each contract address in the explorer, choose contract verification, select Solidity `0.8.24`, optimizer enabled with 200 runs, EVM Cancun, upload the exact source and dependencies, and ABI-encode the constructor admin address from the deployment artifact. Re-run the verification status check before updating application documentation.

## Runtime

Set `ECHO_NFT_ADDRESS`, `ECHO_REGISTRY_ADDRESS`, and `ONCHAIN_CONFIRMATIONS`, then restart the web and onchain worker processes. Result registration is queued only after reveal. NFT awards are queued only after result registration has a successful receipt. A retry first reads contract state and existing events before any new transaction is broadcast.
