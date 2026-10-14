import { db } from "@/lib/db";
export const utcDay = (date = new Date()) => date.toISOString().slice(0, 10);
export const dailyLimit = () => Math.max(1, Number(process.env.DAILY_GENERATION_LIMIT || 5));
type QuotaTx = { generationQuota: { upsert(args: unknown): Promise<unknown>; updateMany(args: unknown): Promise<{ count: number }>; findUniqueOrThrow(args: unknown): Promise<unknown> } };
export async function claimQuotaSlot(tx: QuotaTx, userId: string, day: string, limit: number) {
  await tx.generationQuota.upsert({ where: { userId_day: { userId, day } }, update: {}, create: { userId, day } });
  const result = await tx.generationQuota.updateMany({ where: { userId, day, reserved: { lt: limit } }, data: { reserved: { increment: 1 } } });
  if (result.count !== 1) throw new Error("DAILY_GENERATION_LIMIT_REACHED");
  return tx.generationQuota.findUniqueOrThrow({ where: { userId_day: { userId, day } } });
}
export async function reserveQuota(userId: string, day = utcDay()) {
  const limit = dailyLimit();
  return db.$transaction((tx) => claimQuotaSlot(tx, userId, day, limit));
}
export async function confirmQuota(userId: string, day: string, generationId: string) {
  return db.$transaction(async (tx) => {
    const changed = await tx.generationJob.updateMany({ where: { id: generationId, quotaFinalized: false, quotaRefunded: false }, data: { quotaFinalized: true } });
    if (changed.count) await tx.generationQuota.update({ where: { userId_day: { userId, day } }, data: { consumed: { increment: 1 } } });
  });
}
export async function refundQuota(userId: string, day: string, generationId: string) {
  return db.$transaction(async (tx) => {
    const changed = await tx.generationJob.updateMany({ where: { id: generationId, quotaFinalized: false, quotaRefunded: false }, data: { quotaRefunded: true } });
    if (changed.count) await tx.generationQuota.update({ where: { userId_day: { userId, day }, reserved: { gt: 0 } }, data: { reserved: { decrement: 1 } } });
  });
}
export async function releaseReservation(userId: string, day: string) {
  await db.generationQuota.updateMany({ where: { userId, day, reserved: { gt: 0 } }, data: { reserved: { decrement: 1 } } });
}
export async function quotaStatus(userId: string) {
  const day = utcDay(); const row = await db.generationQuota.findUnique({ where: { userId_day: { userId, day } } });
  return { day, limit: dailyLimit(), reserved: row?.reserved || 0, consumed: row?.consumed || 0, remaining: Math.max(0, dailyLimit() - (row?.reserved || 0)) };
}
