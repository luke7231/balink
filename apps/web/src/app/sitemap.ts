import type { MetadataRoute } from "next";
import { prisma } from "@balink/db";
import { SITE_URL } from "@/lib/site";

const MAX_DYNAMIC_URLS = 5_000;

function entry(
  path: string,
  options: {
    lastModified?: Date | string | null;
    changeFrequency?: MetadataRoute.Sitemap[number]["changeFrequency"];
    priority?: number;
  } = {},
): MetadataRoute.Sitemap[number] {
  return {
    url: path === "/" ? SITE_URL : `${SITE_URL}${path}`,
    lastModified: options.lastModified ? new Date(options.lastModified) : new Date(),
    changeFrequency: options.changeFrequency ?? "weekly",
    priority: options.priority ?? 0.5,
  };
}

async function dynamicEntries(): Promise<MetadataRoute.Sitemap> {
  try {
    const [jobs, substitutes, organizations] = await Promise.all([
      prisma.jobPost.findMany({
        where: { isBallet: true },
        select: { id: true, updatedAt: true, postedAt: true },
        orderBy: [{ postedAt: "desc" }, { updatedAt: "desc" }],
        take: MAX_DYNAMIC_URLS,
      }),
      prisma.substitutePost.findMany({
        where: { status: "OPEN" },
        select: { id: true, updatedAt: true, postedAt: true },
        orderBy: [{ postedAt: "desc" }, { updatedAt: "desc" }],
        take: MAX_DYNAMIC_URLS,
      }),
      prisma.organization.findMany({
        where: { jobPosts: { some: {} } },
        select: { id: true, updatedAt: true },
        orderBy: { updatedAt: "desc" },
        take: MAX_DYNAMIC_URLS,
      }),
    ]);

    return [
      ...jobs.map((job) =>
        entry(`/jobs/${job.id}`, {
          lastModified: job.updatedAt ?? job.postedAt,
          changeFrequency: "daily",
          priority: 0.7,
        }),
      ),
      ...substitutes.map((post) =>
        entry(`/substitutes/${post.id}`, {
          lastModified: post.updatedAt ?? post.postedAt,
          changeFrequency: "daily",
          priority: 0.7,
        }),
      ),
      ...organizations.map((org) =>
        entry(`/organizations/${org.id}`, {
          lastModified: org.updatedAt,
          changeFrequency: "weekly",
          priority: 0.6,
        }),
      ),
    ];
  } catch {
    // Build/preview environments without DB should still emit static routes.
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    entry("/", { changeFrequency: "hourly", priority: 1 }),
    entry("/substitutes", { changeFrequency: "hourly", priority: 0.9 }),
    entry("/privacy", { changeFrequency: "yearly", priority: 0.2 }),
    entry("/terms", { changeFrequency: "yearly", priority: 0.2 }),
  ];

  const dynamic = await dynamicEntries();
  return [...staticRoutes, ...dynamic];
}
