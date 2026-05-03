import type { MetadataRoute } from "next";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://mon-app-devis-sepia.vercel.app";

const routes = [
  "/",
  "/fonctionnalites",
  "/tarifs",
  "/a-propos",
  "/exemple-devis",
  "/contact",
  "/mentions-legales",
  "/confidentialite",
  "/conditions-utilisation",
];

export default function sitemap(): MetadataRoute.Sitemap {
  return routes.map((route) => ({
    url: `${siteUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: route === "/" ? "weekly" : "monthly",
    priority: route === "/" ? 1 : route.includes("mentions") ? 0.4 : 0.8,
  }));
}
