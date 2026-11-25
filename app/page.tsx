import { readFile } from "node:fs/promises";
import path from "node:path";
import type { Metadata } from "next";
import { GoogleCarousel } from "@/components/google-carousel";
import { faqs } from "@/components/home-page";
import { ImportedBody } from "@/components/imported-body";
import { googleCardMark, googleReviewsHtml, loadGoogleReviews, reviewDateLabel } from "@/lib/gbp-reviews";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: { absolute: site.title },
  description: site.description,
  alternates: {
    canonical: "/",
    languages: {
      "en-HK": "/",
      "zh-HK": "/zh/首頁/",
      "x-default": "/",
    },
  },
};

export const revalidate = 3600;

export default async function Page() {
  const source = await readFile(path.join(process.cwd(), "content", "bodies", "4993.html"), "utf8");
  const body = source
    .replaceAll("<!--google-g-->", googleCardMark)
    .replaceAll(/<time datetime="([^"]+)"><\/time>/g, (_, iso: string) => {
      const label = reviewDateLabel(iso);
      return `<time datetime="${iso}">${label}</time>`;
    });
  const reviews = await loadGoogleReviews();
  const html = reviews
    ? body.replace(
        "<h2>Hear From Our Happy Clients</h2>",
        `<h2>Hear From Our Happy Clients</h2>\n${googleReviewsHtml(reviews)}`,
      )
    : body;
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "MovingCompany",
        name: site.name,
        url: site.url,
        telephone: site.phoneTel,
        email: site.email,
        address: {
          "@type": "PostalAddress",
          streetAddress: "Room N, 9/F, Kwun Tong Industrial Centre, 460 Kwun Tong Road",
          addressLocality: "Kowloon",
          addressRegion: "Hong Kong",
          addressCountry: "HK",
        },
        areaServed: "Hong Kong",
      },
      {
        "@type": "FAQPage",
        mainEntity: faqs.map((faq) => ({
          "@type": "Question",
          name: faq.question,
          acceptedAnswer: { "@type": "Answer", text: faq.answer },
        })),
      },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <article className="home-copy">
        <ImportedBody html={html} variant="home" />
        <GoogleCarousel />
      </article>
    </>
  );
}
