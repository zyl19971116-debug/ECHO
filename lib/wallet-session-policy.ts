export type BrowserSession = {
  authenticated: boolean;
  address: string | null;
  chainId: number | null;
  expiresAt: string | null;
};

export function isWalletSessionCurrent(
  session: BrowserSession | undefined,
  address: string | undefined,
  chainId: number,
  now = new Date(),
) {
  if (!session?.authenticated || !address || !session.address || !session.expiresAt) return false;
  const expiresAt = Date.parse(session.expiresAt);
  return session.address.toLowerCase() === address.toLowerCase()
    && session.chainId === chainId
    && Number.isFinite(expiresAt)
    && expiresAt > now.getTime();
}

export function walletSessionIdentityMismatch(
  session: BrowserSession | undefined,
  address: string | undefined,
  chainId: number,
) {
  return Boolean(session?.authenticated && (!address || !session.address
    || session.address.toLowerCase() !== address.toLowerCase()
    || session.chainId !== chainId));
}
