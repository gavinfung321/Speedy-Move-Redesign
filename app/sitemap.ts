import type { MetadataRoute } from "next";
import { allPages, languageAlternates } from "@/lib/pages";
import { site } from "@/lib/site";

function absolute(path: string): string {
  return new URL(path, site.url).toString();
}

export default function sitemap(): MetadataRoute.Sitemap {
  return allPages.map((page) => {
    const languages = languageAlternates(page.path);
    return {
      url: absolute(page.path),
      alternates: languages
        ? { languages: Object.fromEntries(Object.entries(languages).map(([language, path]) => [language, absolute(path)])) }
        : undefined,
    };
  });
}
