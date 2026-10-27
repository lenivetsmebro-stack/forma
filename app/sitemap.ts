import type { MetadataRoute } from "next";

import { projects, siteConfig } from "@/lib/site-content";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = ["", "/services", "/projects", "/calculator", "/planner", "/studio", "/contacts"];
  return [
    ...routes.map((route) => ({ url: `${siteConfig.url}${route}`, changeFrequency: "monthly" as const, priority: route === "" ? 1 : 0.7 })),
    ...projects.map((project) => ({ url: `${siteConfig.url}/projects/${project.slug}`, changeFrequency: "yearly" as const, priority: 0.6 })),
  ];
}
