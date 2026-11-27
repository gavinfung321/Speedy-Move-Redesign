import { readFile } from "node:fs/promises";
import path from "node:path";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CarouselControls } from "@/components/carousel-controls";
import { ContactForm } from "@/components/contact-form";
import { ImportedBody } from "@/components/imported-body";
import bodyIndex from "@/content/body-index.json";
import { layoutCompanyPage, layoutContactPage } from "@/lib/company-layout";
import { layoutItemPage } from "@/lib/item-layout";
import { layoutLocationsPage, layoutNeighbourhoodPage } from "@/lib/location-layout";
import { allPages, findPage, pageSlug, seoTitle } from "@/lib/pages";
import { site } from "@/lib/site";

const bodies = bodyIndex as Record<string, { id: string }>;

async function readBody(pagePath: string): Promise<string> {
  const entry = bodies[pagePath];
  if (!entry) return "";
  try {
    return await readFile(path.join(process.cwd(), "content", "bodies", `${entry.id}.html`), "utf8");
  } catch {
    return "";
  }
}

type RouteParams = { slug: string[] };

function routePath(slug: string[]): string {
  const decoded = slug.map((segment) => {
    try {
      return decodeURIComponent(segment);
    } catch {
      return segment;
    }
  });
  return `/${decoded.join("/")}/`;
}

export function generateStaticParams(): RouteParams[] {
  return allPages
    .filter((page) => page.path !== "/")
    .map((page) => ({ slug: pageSlug(page.path) }));
}

export async function generateMetadata({ params }: { params: Promise<RouteParams> }): Promise<Metadata> {
  const { slug } = await params;
  const page = findPage(routePath(slug));
  if (!page) return {};
  return {
    title: { absolute: seoTitle(page) },
    description: page.description || undefined,
    alternates: { canonical: page.path },
  };
}

export default async function ChecklistPage({ params }: { params: Promise<RouteParams> }) {
  const { slug } = await params;
  const pagePath = routePath(slug);
  const page = findPage(pagePath);
  if (!page) notFound();
  const body = await readBody(pagePath);
  const serviceBody = page.language === "en" && page.template === "item-service" ? layoutItemPage(body) : body;
  const hero = body.startsWith('<section class="page-hero"');

  const serviceTemplates = new Set(["core-service", "item-service", "moving", "demolition"]);
  if (page.language === "en" && page.path === "/locations/") {
    return (
      <article className="home-copy location-page">
        <ImportedBody html={layoutLocationsPage(body)} variant="home" />
      </article>
    );
  }

  if (page.language === "en" && page.template === "location") {
    return (
      <article className="home-copy service-page">
        <ImportedBody html={layoutNeighbourhoodPage(body)} variant="home" />
        <CarouselControls />
      </article>
    );
  }

  if (page.language === "en" && page.path === "/contact/") {
    const contact = layoutContactPage(body);
    return (
      <article className="home-copy service-page">
        <div className="home-copy">
          <div dangerouslySetInnerHTML={{ __html: contact.hero }} />
          <ul className="contact-points" dangerouslySetInnerHTML={{ __html: contact.facts }} />
          <div className="service-detail contact-ask">
            <div dangerouslySetInnerHTML={{ __html: contact.close }} />
            <ContactForm language="en" />
          </div>
        </div>
      </article>
    );
  }

  if (page.language === "en" && (page.path === "/pricing/" || page.path === "/faq/" || page.path === "/our-story/" || page.path === "/blog/")) {
    return (
      <article className={page.path === "/our-story/" ? "home-copy service-page story-page" : "home-copy service-page"}>
        <ImportedBody html={layoutCompanyPage(page.path, body)} variant="home" />
      </article>
    );
  }

  if (page.language === "en" && (serviceTemplates.has(page.template) || page.path === "/donation/")) {
    return (
      <article className="home-copy service-page">
        <ImportedBody html={serviceBody} variant="home" />
        <CarouselControls />
      </article>
    );
  }

  return (
    <article className={hero ? "mx-auto max-w-3xl px-4 pb-16" : "mx-auto max-w-3xl px-4 py-16"}>
      {hero ? null : <h1 className="text-4xl font-extrabold">{page.title}</h1>}
      {body ? (
        <div className={hero ? undefined : "mt-8"}>
          <ImportedBody html={body} variant="page" />
        </div>
      ) : page.description ? (
        <p className="mt-6 text-lg leading-8">{page.description}</p>
      ) : null}
      <a
        href={site.whatsapp}
        className="site-button mt-10 inline-flex rounded-[var(--radius-button)] bg-[var(--orange)] px-5 py-3 font-bold text-[var(--ink)]"
      >
        WhatsApp a quote
      </a>
      <p className="mt-8">
        <Link href="/" className="font-bold text-[var(--orange-deep)] transition-colors duration-150 hover:text-[var(--orange-link)]">
          Back to the homepage
        </Link>
      </p>
    </article>
  );
}
