import { db } from "@/lib/db";
import type { Prisma } from "@prisma/client";
export async function audit(action: string, entityType: string, entityId?: string, actorUserId?: string, metadata?: Prisma.InputJsonObject) {
  await db.auditLog.create({ data: { action, entityType, entityId, actorUserId, metadata: metadata || undefined } });
}
