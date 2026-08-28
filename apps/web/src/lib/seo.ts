import type { Metadata } from "next";
import {
  SITE_DESCRIPTION,
  SITE_KEYWORDS,
  SITE_NAME,
  SITE_NAME_EN,
  SITE_TAGLINE,
  SITE_URL,
  absoluteUrl,
} from "@/lib/site";

const DEFAULT_OG_IMAGE = {
  url: "/brand/og.png",
  width: 1200,
  height: 630,
  alt: `${SITE_NAME} — ${SITE_TAGLINE}`,
};

export const defaultMetadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} | ${SITE_TAGLINE}`,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: [...SITE_KEYWORDS],
  authors: [{ name: SITE_NAME, url: SITE_URL }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  category: "employment",
  alternates: {
    canonical: "/",
    languages: {
      "ko-KR": "/",
    },
  },
  openGraph: {
    title: `${SITE_NAME} | ${SITE_TAGLINE}`,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    siteName: SITE_NAME,
    locale: "ko_KR",
    type: "website",
    images: [DEFAULT_OG_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} | ${SITE_TAGLINE}`,
    description: SITE_DESCRIPTION,
    images: [DEFAULT_OG_IMAGE.url],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  other: {
    "geo.region": "KR",
    "geo.placename": "대한민국",
  },
};

export const noIndexMetadata: Metadata = {
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
};

type BuildPageMetadataInput = {
  title: string;
  description?: string;
  path: string;
  image?: string;
  type?: "website" | "article";
  noIndex?: boolean;
};

export function buildPageMetadata({
  title,
  description = SITE_DESCRIPTION,
  path,
  image = DEFAULT_OG_IMAGE.url,
  type = "website",
  noIndex = false,
}: BuildPageMetadataInput): Metadata {
  const url = absoluteUrl(path);

  return {
    title,
    description,
    alternates: {
      canonical: path,
    },
    openGraph: {
      title: `${title} | ${SITE_NAME}`,
      description,
      url,
      siteName: SITE_NAME,
      locale: "ko_KR",
      type,
      images: [
        {
          ...DEFAULT_OG_IMAGE,
          url: image,
          alt: title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | ${SITE_NAME}`,
      description,
      images: [image],
    },
    ...(noIndex ? noIndexMetadata : {}),
  };
}

function truncate(text: string, max = 160): string {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (normalized.length <= max) return normalized;
  return `${normalized.slice(0, max - 1).trimEnd()}…`;
}

export function buildJobDescription(input: {
  title: string;
  location?: string | null;
  pay?: string | null;
  description?: string | null;
}): string {
  const parts = [
    input.title,
    input.location ? `지역: ${input.location}` : null,
    input.pay ? `급여: ${input.pay}` : null,
    input.description,
  ].filter(Boolean);

  return truncate(parts.join(" · ") || SITE_DESCRIPTION);
}

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    alternateName: [SITE_NAME_EN, "Balink"],
    url: SITE_URL,
    logo: absoluteUrl("/brand/logo-square.png"),
    description: SITE_DESCRIPTION,
    slogan: SITE_TAGLINE,
    areaServed: {
      "@type": "Country",
      name: "KR",
    },
    sameAs: [],
  };
}

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    alternateName: SITE_NAME_EN,
    url: SITE_URL,
    description: SITE_DESCRIPTION,
    inLanguage: "ko-KR",
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      url: SITE_URL,
    },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE_URL}/?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

type JobPostingJsonLdInput = {
  id: string;
  title: string;
  description?: string | null;
  locationText?: string | null;
  sido?: string | null;
  sigungu?: string | null;
  postedAt?: string | null;
  updatedAt?: string | null;
  payMinManwon?: number | null;
  payMaxManwon?: number | null;
  payText?: string | null;
  organizationName?: string | null;
  employmentType?: string | null;
};

export function jobPostingJsonLd(job: JobPostingJsonLdInput) {
  const location = [job.sido, job.sigungu].filter(Boolean).join(" ") || job.locationText;
  const description =
    job.description?.trim() ||
    buildJobDescription({
      title: job.title,
      location,
      pay: job.payText,
    });

  const baseSalary =
    job.payMinManwon != null || job.payMaxManwon != null
      ? {
          "@type": "MonetaryAmount",
          currency: "KRW",
          value: {
            "@type": "QuantitativeValue",
            ...(job.payMinManwon != null
              ? { minValue: Math.round(job.payMinManwon * 10_000) }
              : {}),
            ...(job.payMaxManwon != null
              ? { maxValue: Math.round(job.payMaxManwon * 10_000) }
              : {}),
            unitText: "MONTH",
          },
        }
      : undefined;

  return {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: job.title,
    description,
    datePosted: job.postedAt ?? job.updatedAt ?? undefined,
    validThrough: undefined,
    employmentType: job.employmentType ?? "PART_TIME",
    hiringOrganization: {
      "@type": "Organization",
      name: job.organizationName || SITE_NAME,
      sameAs: SITE_URL,
    },
    jobLocation: location
      ? {
          "@type": "Place",
          address: {
            "@type": "PostalAddress",
            addressLocality: job.sigungu ?? location,
            addressRegion: job.sido ?? undefined,
            addressCountry: "KR",
          },
        }
      : {
          "@type": "Place",
          address: {
            "@type": "PostalAddress",
            addressCountry: "KR",
          },
        },
    identifier: {
      "@type": "PropertyValue",
      name: SITE_NAME,
      value: job.id,
    },
    url: absoluteUrl(`/jobs/${job.id}`),
    ...(baseSalary ? { baseSalary } : {}),
  };
}

export function breadcrumbJsonLd(items: Array<{ name: string; path: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}
