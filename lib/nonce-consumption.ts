type NonceUpdater = {
  walletSession: {
    updateMany(args: unknown): Promise<{ count: number }>;
  };
};

export async function consumeNonce(
  tx: NonceUpdater,
  id: string,
  userId: string,
  sessionExpiresAt: Date,
  now = new Date()
) {
  const result = await tx.walletSession.updateMany({
    where: {
      id,
      verifiedAt: null,
      revokedAt: null,
      expiresAt: { gt: now },
    },
    data: { userId, verifiedAt: now, expiresAt: sessionExpiresAt },
  });
  if (result.count !== 1) throw new Error("NONCE_ALREADY_CONSUMED");
}
