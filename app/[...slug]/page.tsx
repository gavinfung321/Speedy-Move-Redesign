import { readFile } from "node:fs/promises";
import path from "node:path";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CarouselControls } from "@/components/carousel-controls";
import { GoogleCarousel } from "@/components/google-carousel";
import { ContactForm } from "@/components/contact-form";
import { ImportedBody } from "@/components/imported-body";
import bodyIndex from "@/content/body-index.json";
import { PostFooter } from "@/components/post-footer";
import { layoutCategoryPage, layoutChineseBlog, layoutChineseDonation, layoutCompanyPage, layoutContactPage, layoutMovingProcess, layoutPostPage, postCategory, relatedPosts } from "@/lib/company-layout";
import { layoutChineseDemolition } from "@/lib/demolition-layout";
import { layoutChineseHome, layoutChineseJunk, layoutChineseMoving, layoutChineseProcess } from "@/lib/home-layout";
import { layoutItemPage } from "@/lib/item-layout";
import { layoutLocationsPage, layoutNeighbourhoodPage } from "@/lib/location-layout";
import { allPages, findPage, languageAlternates, pageSlug, seoTitle } from "@/lib/pages";
import { googleCardMark, googleReviewsHtml, loadGoogleReviews, reviewDateLabel } from "@/lib/gbp-reviews";
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
    alternates: { canonical: page.path, languages: languageAlternates(page.path) },
  };
}

export default async function ChecklistPage({ params }: { params: Promise<RouteParams> }) {
  const { slug } = await params;
  const pagePath = routePath(slug);
  const page = findPage(pagePath);
  if (!page) notFound();
  const body = await readBody(pagePath);
  const serviceBody = page.template === "item-service" ? layoutItemPage(body) : body;
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

  if ((page.language === "en" && page.path === "/contact/") || (page.language === "zh" && page.path === "/zh/聯絡我們/")) {
    const contact = layoutContactPage(body, page.language === "zh" ? "zh" : "en");
    return (
      <article className="home-copy service-page">
        <div className="home-copy">
          <div dangerouslySetInnerHTML={{ __html: contact.hero }} />
          <ul className="contact-points" dangerouslySetInnerHTML={{ __html: contact.facts }} />
          <div className="service-detail contact-ask">
            <div dangerouslySetInnerHTML={{ __html: contact.close }} />
            <ContactForm language={page.language === "zh" ? "zh" : "en"} />
          </div>
        </div>
      </article>
    );
  }

  if (page.language === "zh" && page.path === "/zh/網誌/") {
    return (
      <article className="home-copy service-page">
        <ImportedBody html={layoutChineseBlog(body)} variant="home" />
      </article>
    );
  }

  if (page.language === "en" && (page.path === "/pricing/" || page.path === "/faq/" || page.path === "/our-story/" || page.path === "/blog/" || page.path === "/terms-conditions/")) {
    return (
      <article className={page.path === "/our-story/" ? "home-copy service-page story-page" : "home-copy service-page"}>
        <ImportedBody html={layoutCompanyPage(page.path, body)} variant="home" />
      </article>
    );
  }

  if (page.language === "en" && page.template === "category") {
    const blog = await readBody("/blog/");
    return (
      <article className="home-copy service-page">
        <ImportedBody html={layoutCategoryPage(page.title, blog)} variant="home" />
      </article>
    );
  }

  if ((page.language === "en" || page.language === "zh") && page.template === "article") {
    const related = relatedPosts(page.path);
    return (
      <article className="home-copy service-page">
        <ImportedBody html={layoutPostPage(page.path, page.title, postCategory(page.path), body)} variant="home" />
        <PostFooter previous={related.previous} next={related.next} similar={related.similar} language={page.language} />
      </article>
    );
  }

  if (page.language === "en" && page.path === "/moving-process/") {
    return (
      <article className="home-copy service-page process-page">
        <ImportedBody html={layoutMovingProcess(body)} variant="home" />
        <CarouselControls />
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

  if (page.language === "zh" && page.path === "/zh/搬屋流程/") {
    return (
      <article className="home-copy service-page process-page">
        <ImportedBody html={layoutChineseProcess(body)} variant="home" />
        <CarouselControls />
      </article>
    );
  }

  if (
    page.language === "zh" &&
    (page.path === "/zh/搬屋/" ||
      page.path === "/zh/住宅搬屋/" ||
      page.path === "/zh/辦公室搬遷/" ||
      page.path === "/zh/倉庫搬運/" ||
      page.path === "/zh/搬別墅村屋/")
  ) {
    return (
      <article className="home-copy service-page">
        <ImportedBody html={layoutChineseMoving(body)} variant="home" />
        <CarouselControls />
      </article>
    );
  }

  if (page.language === "zh" && (page.path === "/zh/清理垃圾/" || page.path === "/zh/棄置傢俬/")) {
    return (
      <article className="home-copy service-page">
        <ImportedBody html={layoutChineseJunk(body)} variant="home" />
        <CarouselControls />
      </article>
    );
  }

  if (page.language === "zh" && page.path === "/zh/捐贈電器傢俬/") {
    return (
      <article className="home-copy service-page">
        <ImportedBody html={layoutChineseDonation(body)} variant="home" />
        <CarouselControls />
      </article>
    );
  }

  if (page.language === "zh" && (page.template === "demolition" || page.path === "/zh/清拆常見問題/" || page.path === "/zh/工程案例/")) {
    return (
      <article className="home-copy service-page">
        <ImportedBody html={layoutChineseDemolition(body)} variant="home" />
        <CarouselControls />
      </article>
    );
  }

  if (page.language === "zh" && page.template === "homepage") {
    const laidOut = layoutChineseHome(body)
      .replaceAll("<!--google-g-->", googleCardMark)
      .replaceAll(/<time datetime="([^"]+)"><\/time>/g, (_, iso: string) => {
        const label = reviewDateLabel(iso);
        return `<time datetime="${iso}">${label}</time>`;
      });
    const reviews = await loadGoogleReviews();
    const html = reviews
      ? laidOut.replace("<h2>客人評分</h2>", `<h2>客人評分</h2>\n${googleReviewsHtml(reviews, "Google 評論", "在 Google 上查看")}`)
      : laidOut;
    return (
      <article className="home-copy">
        <ImportedBody html={html} variant="home" />
        <GoogleCarousel />
      </article>
    );
  }

  if (page.language === "zh" && page.template === "item-service") {
    return (
      <article className="home-copy service-page">
        <ImportedBody html={serviceBody} variant="home" />
        <CarouselControls />
      </article>
    );
  }

  if (page.language === "zh") {
    return (
      <article className="home-copy service-page">
        {body ? <ImportedBody html={body} variant="home" /> : page.description ? <p>{page.description}</p> : null}
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
