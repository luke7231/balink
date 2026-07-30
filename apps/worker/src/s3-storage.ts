import { createHash } from "node:crypto";
import { extname } from "node:path";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

export interface S3StorageConfig {
  bucket: string;
  region: string;
  publicBaseUrl: string;
}

let cachedClient: S3Client | null = null;

export function getS3StorageConfig(): S3StorageConfig | null {
  const bucket = process.env.AWS_S3_BUCKET?.trim();
  const region = process.env.AWS_REGION?.trim() || "ap-northeast-2";
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID?.trim();
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY?.trim();

  if (!bucket || !accessKeyId || !secretAccessKey) {
    return null;
  }

  const publicBaseUrl =
    process.env.AWS_S3_PUBLIC_BASE_URL?.trim().replace(/\/$/, "") ||
    `https://${bucket}.s3.${region}.amazonaws.com`;

  return { bucket, region, publicBaseUrl };
}

export function getS3Client(config: S3StorageConfig): S3Client {
  if (cachedClient) return cachedClient;

  cachedClient = new S3Client({
    region: config.region,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
  });

  return cachedClient;
}

export function buildAcademyImageObjectKey(
  source: string,
  sourcePostId: string,
  kind: "logo" | "gallery",
  order: number,
  sourceUrl: string,
): string {
  const hash = createHash("sha256").update(sourceUrl).digest("hex").slice(0, 12);
  const ext = normalizeImageExtension(sourceUrl);
  if (kind === "logo") {
    return `academy-images/${source}/${sourcePostId}/logo-${hash}${ext}`;
  }
  return `academy-images/${source}/${sourcePostId}/gallery-${order}-${hash}${ext}`;
}

export function buildPublicObjectUrl(config: S3StorageConfig, key: string): string {
  return `${config.publicBaseUrl}/${key}`;
}

export async function uploadBufferToS3(
  config: S3StorageConfig,
  key: string,
  body: Buffer,
  contentType: string,
): Promise<string> {
  const client = getS3Client(config);
  await client.send(
    new PutObjectCommand({
      Bucket: config.bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
      CacheControl: "public, max-age=31536000, immutable",
    }),
  );

  return buildPublicObjectUrl(config, key);
}

function normalizeImageExtension(sourceUrl: string): string {
  const ext = extname(new URL(sourceUrl).pathname).toLowerCase();
  if (ext === ".jpg" || ext === ".jpeg" || ext === ".png" || ext === ".webp" || ext === ".gif") {
    return ext;
  }
  return ".jpg";
}

export function detectImageContentType(sourceUrl: string, fallback = "image/jpeg"): string {
  const ext = extname(new URL(sourceUrl).pathname).toLowerCase();
  if (ext === ".png") return "image/png";
  if (ext === ".webp") return "image/webp";
  if (ext === ".gif") return "image/gif";
  return fallback;
}
