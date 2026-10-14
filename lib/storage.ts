import { CopyObjectCommand, DeleteObjectCommand, GetObjectCommand, HeadBucketCommand, HeadObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "crypto";

function config() {
  const required = ["S3_REGION", "S3_BUCKET", "S3_ACCESS_KEY_ID", "S3_SECRET_ACCESS_KEY"] as const;
  for (const key of required) if (!process.env[key]) throw new Error("STORAGE_NOT_CONFIGURED");
  return { region: process.env.S3_REGION!, bucket: process.env.S3_BUCKET!, endpoint: process.env.S3_ENDPOINT };
}
function client() {
  const c = config();
  return new S3Client({ region: c.region, endpoint: c.endpoint || undefined, forcePathStyle: Boolean(c.endpoint), credentials: { accessKeyId: process.env.S3_ACCESS_KEY_ID!, secretAccessKey: process.env.S3_SECRET_ACCESS_KEY! } });
}
export const storage = {
  async uploadPrivate(bytes: Buffer, mimeType: string, sha256: string, stableId?: string) {
    const c = config(); const objectKey = stableId ? `private/generations/${stableId}.png` : `private/${new Date().toISOString().slice(0, 10)}/${randomUUID()}.png`;
    await client().send(new PutObjectCommand({ Bucket: c.bucket, Key: objectKey, Body: bytes, ContentType: mimeType, Metadata: { visibility: "private", sha256 } }));
    return objectKey;
  },
  async publishApproved(privateKey: string) {
    const c = config(); const publicKey = `public/${randomUUID()}.png`;
    await client().send(new CopyObjectCommand({ Bucket: c.bucket, Key: publicKey, CopySource: `${c.bucket}/${encodeURIComponent(privateKey).replace(/%2F/g, "/")}`, ContentType: "image/png", MetadataDirective: "REPLACE", Metadata: { visibility: "public" } }));
    const base = process.env.PUBLIC_ASSET_BASE_URL;
    if (!base) throw new Error("PUBLIC_ASSET_BASE_URL_NOT_CONFIGURED");
    return { publicKey, url: `${base.replace(/\/$/, "")}/${publicKey}` };
  },
  async getSignedUrl(objectKey: string) { const c = config(); return getSignedUrl(client(), new GetObjectCommand({ Bucket: c.bucket, Key: objectKey }), { expiresIn: 300 }); },
  async deleteObject(objectKey: string) { const c = config(); await client().send(new DeleteObjectCommand({ Bucket: c.bucket, Key: objectKey })); },
  async getObjectMetadata(objectKey: string) { const c = config(); return client().send(new HeadObjectCommand({ Bucket: c.bucket, Key: objectKey })); },
  async healthCheck() { const c = config(); await client().send(new HeadBucketCommand({ Bucket: c.bucket })); return true; },
  async uploadPublicJson(objectKey: string, value: unknown) {
    const c = config();
    const base = process.env.NFT_METADATA_BASE_URL || process.env.PUBLIC_ASSET_BASE_URL;
    if (!base) throw new Error("NFT_METADATA_BASE_URL_NOT_CONFIGURED");
    await client().send(new PutObjectCommand({ Bucket: c.bucket, Key: objectKey, Body: JSON.stringify(value), ContentType: "application/json", CacheControl: "public, max-age=31536000, immutable", Metadata: { visibility: "public" } }));
    return `${base.replace(/\/$/, "")}/${objectKey}`;
  },
};
