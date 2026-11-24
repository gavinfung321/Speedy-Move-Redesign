import pages from "@/content/pages.json";
import { site } from "@/lib/site";

export type PageRecord = {
  path: string;
  title: string;
  description: string;
  seoTitle: string;
  language: string;
  template: string;
  postType: string;
};

export const allPages = pages as PageRecord[];

export function findPage(path: string): PageRecord | undefined {
  const normalized = path.endsWith("/") ? path : `${path}/`;
  return allPages.find((page) => page.path === normalized);
}

export function pageSlug(path: string): string[] {
  return path.split("/").filter(Boolean);
}

export function seoTitle(page: PageRecord): string {
  const raw = page.seoTitle || page.title;
  return raw
    .replace(/%title%/gi, page.title)
    .replace(/%sitename%/gi, site.name)
    .replace(/%sep%/gi, "-")
    .replace(/%page%/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}
