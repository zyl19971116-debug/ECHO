import { storage } from "@/lib/storage";
type Row = { id: string; status: string; prompt: string; style: string; format: string; error: string | null; errorCode: string | null; createdAt: Date; updatedAt: Date; moderationStatus: string; asset: { objectKey: string; sha256: string; mimeType: string; fileSize: number } | null };
export async function generationDto(row: Row) {
  const imageUrl = row.asset && row.status === "COMPLETED" ? await storage.getSignedUrl(row.asset.objectKey) : null;
  return { id: row.id, status: row.status, prompt: row.prompt, style: row.style, format: row.format, error: row.error, errorCode: row.errorCode, moderationStatus: row.moderationStatus, imageUrl, imageHash: row.asset?.sha256 || null, fileSize: row.asset?.fileSize || null, createdAt: row.createdAt, updatedAt: row.updatedAt };
}
export const generationInclude = { asset: { select: { objectKey: true, sha256: true, mimeType: true, fileSize: true } } } as const;
