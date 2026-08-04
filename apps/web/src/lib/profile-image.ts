import { createHash } from "node:crypto";
import { extname } from "node:path";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

export const DEFAULT_AVATAR_PATH = "/avatars/default.svg";

interface S3StorageConfig {
  bucket: string;
  region: string;
  publicBaseUrl: string;
}

let cachedClient: S3Client | null = null;

function getS3StorageConfig(): S3StorageConfig | null {
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

function getS3Client(config: S3StorageConfig): S3Client {
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

function normalizeImageExtension(sourceUrl: string, contentType: string | null): string {
  try {
    const ext = extname(new URL(sourceUrl).pathname).toLowerCase();
    if (ext === ".jpg" || ext === ".jpeg" || ext === ".png" || ext === ".webp" || ext === ".gif") {
      return ext === ".jpeg" ? ".jpg" : ext;
    }
  } catch {
    // ignore invalid URL pathname
  }

  if (contentType?.includes("png")) return ".png";
  if (contentType?.includes("webp")) return ".webp";
  if (contentType?.includes("gif")) return ".gif";
  return ".jpg";
}

function detectContentType(sourceUrl: string, headerType: string | null): string {
  if (headerType?.startsWith("image/")) return headerType.split(";")[0]!.trim();

  const ext = normalizeImageExtension(sourceUrl, null);
  if (ext === ".png") return "image/png";
  if (ext === ".webp") return "image/webp";
  if (ext === ".gif") return "image/gif";
  return "image/jpeg";
}

/** Download a remote profile image and persist it to S3. Returns public URL or null. */
export async function saveRemoteProfileImage(userId: string, sourceUrl: string): Promise<string | null> {
  const config = getS3StorageConfig();
  if (!config) return null;

  try {
    const response = await fetch(sourceUrl, {
      headers: {
        "User-Agent": "BlackSwanProfileBot/1.0",
        Accept: "image/*",
      },
      redirect: "follow",
      cache: "no-store",
    });

    if (!response.ok) return null;

    const contentType = detectContentType(sourceUrl, response.headers.get("content-type"));
    const body = Buffer.from(await response.arrayBuffer());
    if (body.byteLength < 32) return null;

    const hash = createHash("sha256").update(body).digest("hex").slice(0, 16);
    const ext = normalizeImageExtension(sourceUrl, contentType);
    const key = `user-avatars/${userId}/${hash}${ext}`;

    await getS3Client(config).send(
      new PutObjectCommand({
        Bucket: config.bucket,
        Key: key,
        Body: body,
        ContentType: contentType,
        CacheControl: "public, max-age=31536000, immutable",
      }),
    );

    return `${config.publicBaseUrl}/${key}`;
  } catch (error) {
    console.warn("[profile-image] failed to save remote avatar", error);
    return null;
  }
}
