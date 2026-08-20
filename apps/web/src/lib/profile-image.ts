import { createHash, randomBytes } from "node:crypto";
import { extname } from "node:path";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

export const DEFAULT_AVATAR_PATH = "/avatars/default.svg";
export const MAX_PROFILE_IMAGE_BYTES = 5 * 1024 * 1024;
export const ALLOWED_PROFILE_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

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

export function isProfileImageStorageConfigured(): boolean {
  return getS3StorageConfig() !== null;
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

function extensionForContentType(contentType: string): string {
  if (contentType === "image/png") return ".png";
  if (contentType === "image/webp") return ".webp";
  return ".jpg";
}

async function uploadAvatarBuffer(
  userId: string,
  body: Buffer,
  contentType: string,
): Promise<string> {
  const config = getS3StorageConfig();
  if (!config) {
    throw new Error("프로필 이미지 저장소가 설정되지 않았습니다.");
  }

  const hash = createHash("sha256").update(body).digest("hex").slice(0, 16);
  const ext = extensionForContentType(contentType);
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
}

/** Download a remote profile image and persist it to S3. Returns public URL or null. */
export async function saveRemoteProfileImage(userId: string, sourceUrl: string): Promise<string | null> {
  const config = getS3StorageConfig();
  if (!config) return null;

  try {
    const response = await fetch(sourceUrl, {
      headers: {
        "User-Agent": "BalinkProfileBot/1.0",
        Accept: "image/*",
      },
      redirect: "follow",
      cache: "no-store",
    });

    if (!response.ok) return null;

    const contentType = detectContentType(sourceUrl, response.headers.get("content-type"));
    const body = Buffer.from(await response.arrayBuffer());
    if (body.byteLength < 32) return null;

    return await uploadAvatarBuffer(userId, body, contentType);
  } catch (error) {
    console.warn("[profile-image] failed to save remote avatar", error);
    return null;
  }
}

export async function saveUploadedProfileImage(
  userId: string,
  file: File,
): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  if (!isProfileImageStorageConfigured()) {
    return { ok: false, error: "프로필 이미지 저장소가 설정되지 않았습니다." };
  }

  const contentType = file.type.trim().toLowerCase();
  if (!ALLOWED_PROFILE_IMAGE_TYPES.has(contentType)) {
    return { ok: false, error: "jpg, png, webp 이미지만 올릴 수 있습니다." };
  }

  if (file.size <= 0 || file.size > MAX_PROFILE_IMAGE_BYTES) {
    return { ok: false, error: "이미지는 5MB 이하여야 합니다." };
  }

  try {
    const body = Buffer.from(await file.arrayBuffer());
    if (body.byteLength < 32) {
      return { ok: false, error: "올바른 이미지 파일이 아닙니다." };
    }
    const url = await uploadAvatarBuffer(userId, body, contentType);
    return { ok: true, url };
  } catch (error) {
    console.warn("[profile-image] failed to save uploaded avatar", error);
    return { ok: false, error: "이미지 업로드에 실패했습니다. 잠시 후 다시 시도해 주세요." };
  }
}

export function createEmailChangeToken(): string {
  return randomBytes(32).toString("base64url");
}

export function hashEmailChangeToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
