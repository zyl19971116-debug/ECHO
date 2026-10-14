type VoteNonceTx = { voteNonce: { updateMany(args: unknown): Promise<{ count: number }> } };
export async function consumeVoteNonce(tx: VoteNonceTx, id: string, now = new Date()) { const result = await tx.voteNonce.updateMany({ where: { id, consumedAt: null, expiresAt: { gt: now } }, data: { consumedAt: now } }); if (result.count !== 1) throw new Error("VOTE_NONCE_ALREADY_USED"); }
