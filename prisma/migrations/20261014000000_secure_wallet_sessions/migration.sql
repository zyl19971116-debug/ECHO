-- Additive-only migration. Apply after reviewing against the target database.
ALTER TABLE "WalletSession" ADD COLUMN "chainId" INTEGER;
ALTER TABLE "WalletSession" ADD COLUMN "revokedAt" TIMESTAMP(3);
CREATE INDEX "WalletSession_address_verifiedAt_idx" ON "WalletSession"("address", "verifiedAt");
