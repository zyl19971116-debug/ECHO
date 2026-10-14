# Operations

Monitor HTTP latency/error rate, `/api/health/ready`, PostgreSQL connections and backups, Redis memory/persistence, queue waiting/failed counts, Worker heartbeats, OpenAI spend/quota, storage errors, RPC latency, signer gas balance and transactions stuck in `BROADCASTED`, `CONFIRMING` or `RETRY_REQUIRED`.

Workers log structured heartbeat and error events every 30 seconds and close gracefully on SIGTERM/SIGINT. Run exactly one onchain worker initially; business-key and onchain checks still provide idempotency. Restarted workers inspect stored transaction hashes and contract events before broadcasting again.

For incidents, first set `MAINNET_TRANSACTION_APPROVED=false`, stop the onchain worker, preserve logs and database state, inspect the explorer and reconcile events. Do not delete jobs or manually overwrite transaction hashes. Restore PostgreSQL only from a tested backup, then run reconciliation before resuming traffic.

Rotate OpenAI, WalletConnect, database, Redis and storage credentials independently. Rotate the operational chain key by granting roles to the replacement, verifying them onchain, and only then revoking the old roles. Production administrator governance should migrate to a multisig.
