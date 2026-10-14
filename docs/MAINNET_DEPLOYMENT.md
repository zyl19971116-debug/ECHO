# Robinhood Chain mainnet readiness

Verified production parameters: chain ID `4663`, native gas token `ETH`, public RPC `https://rpc.mainnet.chain.robinhood.com`, explorer `https://robinhoodchain.blockscout.com`.

Run `npm run contracts:test`, `npm run contracts:compile`, and `npm run preflight:production`. Review gas estimates, contract bytecode, deployer balance, administrator address, operational wallet, existing deployment artifact and configured addresses. Prefer a multisig for `DEFAULT_ADMIN_ROLE`; the operational wallet should hold only `AWARD_ISSUER_ROLE` and `RECORDER_ROLE`.

No deployment occurs during preflight. Actual deployment additionally requires the exact server-only acknowledgement `MAINNET_DEPLOYMENT_APPROVED=I_UNDERSTAND_AND_APPROVE_MAINNET_DEPLOYMENT`, funded keys, and an explicit operator decision to execute `npm run deploy:robinhood-mainnet`. Afterwards record the artifact, configure addresses, run `npm run verify:robinhood-mainnet`, verify source in Blockscout, and revoke unnecessary deployer operational roles.

Runtime result registration and minting remain disabled unless `MAINNET_TRANSACTION_APPROVED=true`. Keep it false until contracts, roles, monitoring and incident response have been independently reviewed.
