import type { MetadataRoute } from "next";
import { allPages } from "@/lib/pages";
import { site } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  return allPages.map((page) => ({
    url: new URL(page.path, site.url).toString(),
    alternates:
      page.path === "/"
        ? { languages: { "en-HK": `${site.url}/`, "zh-HK": `${site.url}/zh/首頁/`, "x-default": `${site.url}/` } }
        : undefined,
  }));
}
