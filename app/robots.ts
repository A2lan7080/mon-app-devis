import type { MetadataRoute } from "next";

const siteUrl = "https://mon-app-devis-sepia.vercel.app";

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
