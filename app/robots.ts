import type { MetadataRoute } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://batiflow.be";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/fonctionnalites", "/tarifs", "/a-propos"],
      disallow: ["/api/", "/dashboard/"],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
