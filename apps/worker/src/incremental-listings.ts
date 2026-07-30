import type { SourceName } from "@black-swan/domain";
import { SourcePostRepository } from "@black-swan/db";

const sourcePostRepository = new SourcePostRepository();

export function getListingPostId(source: SourceName, listing: Record<string, unknown>): string {
  const key = source === "balletmania" ? "no" : "postId";
  return String(listing[key]);
}

export async function filterNewListings<T extends Record<string, unknown>>(
  source: SourceName,
  listings: T[],
): Promise<{ newListings: T[]; existingCount: number }> {
  const ids = listings.map((listing) => getListingPostId(source, listing));
  const existingIds = await sourcePostRepository.findExistingSourcePostIds(source, ids);
  const newListings = listings.filter((listing) => !existingIds.has(getListingPostId(source, listing)));
  return { newListings, existingCount: existingIds.size };
}
