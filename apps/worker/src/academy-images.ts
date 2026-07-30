import type { RawAcademyImages, SourceName, StoredAcademyImages } from "@black-swan/domain";
import { fetch } from "undici";
import {
  buildAcademyImageObjectKey,
  buildAcademyImageSourcePrefix,
  detectImageContentType,
  getS3StorageConfig,
  uploadBufferToS3,
} from "./s3-storage.js";

export function parseRawAcademyImages(value: unknown): RawAcademyImages | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  const logoUrl = typeof record.logoUrl === "string" && record.logoUrl.trim() ? record.logoUrl.trim() : null;
  const gallery = Array.isArray(record.gallery)
    ? record.gallery
        .map((item, index) => parseGalleryItem(item, index + 1))
        .filter((item): item is NonNullable<typeof item> => item != null)
    : [];

  if (!logoUrl && gallery.length === 0) return null;

  return {
    logoUrl,
    gallery,
    companyProfileUrl:
      typeof record.companyProfileUrl === "string" && record.companyProfileUrl.trim()
        ? record.companyProfileUrl.trim()
        : null,
  };
}

export async function mirrorAcademyImagesToS3(
  source: SourceName,
  sourcePostId: string,
  rawImages: RawAcademyImages | null,
): Promise<StoredAcademyImages | null> {
  if (!rawImages) return null;

  const config = getS3StorageConfig();
  if (!config) {
    console.warn("[academy-images] AWS S3 env missing; keeping source URLs without upload.");
    return {
      logoUrl: rawImages.logoUrl,
      gallery: rawImages.gallery.map((item) => ({ ...item, sourceUrl: item.url })),
    };
  }

  const sourcePrefix = buildAcademyImageSourcePrefix(source);
  const gallery: StoredAcademyImages["gallery"] = [];
  let logoUrl: string | null = null;

  if (rawImages.logoUrl) {
    logoUrl = await uploadRemoteImage(config, sourcePrefix, sourcePostId, "logo", 0, rawImages.logoUrl);
  }

  for (const item of rawImages.gallery) {
    const uploadedUrl = await uploadRemoteImage(
      config,
      sourcePrefix,
      sourcePostId,
      "gallery",
      item.order,
      item.url,
    );
    gallery.push({
      type: item.type,
      order: item.order,
      url: uploadedUrl,
      sourceUrl: item.url,
    });
  }

  if (!logoUrl && gallery.length === 0) return null;

  return { logoUrl, gallery };
}

async function uploadRemoteImage(
  config: NonNullable<ReturnType<typeof getS3StorageConfig>>,
  sourcePrefix: string,
  sourcePostId: string,
  kind: "logo" | "gallery",
  order: number,
  sourceUrl: string,
): Promise<string> {
  const response = await fetch(sourceUrl, {
    headers: { "user-agent": "Mozilla/5.0 compatible; black-swan-academy-images/0.1" },
  });

  if (!response.ok) {
    throw new Error(`Failed to download image ${sourceUrl}: ${response.status}`);
  }

  const body = Buffer.from(await response.arrayBuffer());
  const contentType = response.headers.get("content-type") || detectImageContentType(sourceUrl);
  const key = buildAcademyImageObjectKey(sourcePrefix, sourcePostId, kind, order, sourceUrl);
  return uploadBufferToS3(config, key, body, contentType);
}

function parseGalleryItem(value: unknown, fallbackOrder: number) {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  const url = typeof record.url === "string" && record.url.trim() ? record.url.trim() : null;
  if (!url) return null;

  const type = record.type === "logo" ? "logo" : "interior";
  const order = typeof record.order === "number" && Number.isFinite(record.order) ? record.order : fallbackOrder;

  return { type, order, url } as StoredAcademyImages["gallery"][number];
}
