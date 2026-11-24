import { readFile } from "node:fs/promises";
import path from "node:path";
import type { Metadata } from "next";
import { faqs } from "@/components/home-page";
import { ImportedBody } from "@/components/imported-body";
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

export default async function Page() {
  const body = await readFile(path.join(process.cwd(), "content", "bodies", "4993.html"), "utf8");
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
        <ImportedBody html={body} variant="home" />
      </article>
    </>
  );
}
