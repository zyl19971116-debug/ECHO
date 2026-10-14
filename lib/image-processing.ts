import { createHash } from "crypto";
import sharp from "sharp";
export async function normalizeGeneratedImage(raw: Buffer, maxBytes = Number(process.env.MAX_IMAGE_BYTES || 20_000_000)) {
  if (!raw.length || raw.length > maxBytes) throw new Error("IMAGE_SIZE_INVALID");
  const metadata = await sharp(raw, { failOn: "error" }).metadata();
  if (metadata.format !== "png" || !metadata.width || !metadata.height) throw new Error("IMAGE_FORMAT_INVALID");
  const bytes = await sharp(raw).rotate().png({ compressionLevel: 9 }).toBuffer();
  return { bytes, mimeType: "image/png", sha256: createHash("sha256").update(bytes).digest("hex"), width: metadata.width, height: metadata.height };
}
