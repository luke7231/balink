import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/account",
          "/login",
          "/signup",
          "/notifications",
          "/saved",
          "/invite",
        ],
      },
      // Generative engines / AI crawlers — allow public content for GEO citations
      {
        userAgent: "GPTBot",
        allow: "/",
        disallow: ["/api/", "/account", "/login", "/signup", "/notifications", "/saved", "/invite"],
      },
      {
        userAgent: "ChatGPT-User",
        allow: "/",
        disallow: ["/api/", "/account", "/login", "/signup", "/notifications", "/saved", "/invite"],
      },
      {
        userAgent: "Google-Extended",
        allow: "/",
        disallow: ["/api/", "/account", "/login", "/signup", "/notifications", "/saved", "/invite"],
      },
      {
        userAgent: "ClaudeBot",
        allow: "/",
        disallow: ["/api/", "/account", "/login", "/signup", "/notifications", "/saved", "/invite"],
      },
      {
        userAgent: "PerplexityBot",
        allow: "/",
        disallow: ["/api/", "/account", "/login", "/signup", "/notifications", "/saved", "/invite"],
      },
      {
        userAgent: "Applebot-Extended",
        allow: "/",
        disallow: ["/api/", "/account", "/login", "/signup", "/notifications", "/saved", "/invite"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
