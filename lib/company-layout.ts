import covers from "@/content/blog-covers.json";
import { allPages } from "@/lib/pages";

const VOID_TAGS = new Set(["img", "br", "hr", "source"]);
const blogCovers = covers as Record<string, string>;

const PHONE_ICON =
  '<svg viewBox="0 0 24 24" aria-hidden="true"><g transform="translate(12 12) scale(0.82) translate(-12 -12)"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></g></svg>';

const BUILDING_ICON =
  '<svg viewBox="0 0 24 24" aria-hidden="true"><g transform="translate(12 12) scale(0.82) translate(-12 -12)"><polygon fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><line x1="16" y1="6" x2="16" y2="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></g></svg>';

const MAIL_ICON =
  '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" points="22,6 12,13 2,6"/></svg>';

function topNodes(html: string): string[] {
  const nodes: string[] = [];
  let index = 0;

  while (index < html.length) {
    while (index < html.length && /\s/.test(html[index])) index += 1;
    if (index >= html.length) break;

    if (html[index] !== "<") {
      const next = html.indexOf("<", index);
      const text = html.slice(index, next === -1 ? html.length : next);
      if (text.trim()) nodes.push(text);
      index = next === -1 ? html.length : next;
      continue;
    }

    const tagMatch = /^<([a-zA-Z0-9]+)/.exec(html.slice(index));
    if (!tagMatch) break;
    const tag = tagMatch[1].toLowerCase();

    if (VOID_TAGS.has(tag)) {
      const end = html.indexOf(">", index);
      nodes.push(html.slice(index, end + 1));
      index = end + 1;
      continue;
    }

    const open = new RegExp(`<${tag}\\b`, "gi");
    const close = new RegExp(`</${tag}>`, "gi");
    let depth = 0;
    let cursor = index;

    while (cursor < html.length) {
      open.lastIndex = cursor;
      close.lastIndex = cursor;
      const nextOpen = open.exec(html);
      const nextClose = close.exec(html);
      if (!nextClose) break;
      if (nextOpen && nextOpen.index < nextClose.index) {
        depth += 1;
        cursor = nextOpen.index + 1;
        continue;
      }
      depth -= 1;
      cursor = nextClose.index + nextClose[0].length;
      if (depth === 0) {
        nodes.push(html.slice(index, cursor));
        index = cursor;
        break;
      }
    }

    if (depth !== 0) break;
  }

  return nodes;
}

function isTag(node: string, tag: string): boolean {
  return new RegExp(`^<${tag}[\\s>]`, "i").test(node);
}

function isShared(node: string): boolean {
  return /^<div\s+data-shared=/i.test(node);
}

function isLinkOnly(node: string): boolean {
  return /^<p(?:\s[^>]*)?>\s*<a\b[^>]*>[\s\S]*?<\/a>\s*<\/p>$/i.test(node.trim());
}

function withCta(nodes: string[]): string {
  return nodes
    .map((node) => (isLinkOnly(node) ? node.replace(/^<p\b/i, '<p class="cta"') : node))
    .join("");
}

function textOf(node: string): string {
  return node
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function markNotes(node: string): string {
  if (/^<p>\s*<em>[\s\S]*<\/em>\s*<\/p>$/i.test(node.trim())) return node.replace(/^<p>/i, '<p class="notes">');
  return node;
}

function lineHero(section: string): string {
  return section
    .replace('class="page-hero"', 'class="page-hero hero-line"')
    .replace(/<h1>([\s\S]*?)<\/h1>/i, (_, inner: string) => {
      const text = inner.replace(/<br\s*\/?>/gi, " ").replace(/\s+/g, " ").trim();
      return `<h1>${text.replace(/\s+(Pricing)$/i, "<br>$1")}</h1>`;
    });
}

type Group = { heading: string; body: string[] };

function groupByH2(nodes: string[]): Group[] {
  const groups: Group[] = [];
  let current: Group | null = null;

  for (const node of nodes) {
    if (isTag(node, "h2")) {
      current = { heading: node, body: [] };
      groups.push(current);
      continue;
    }
    if (!current) current = { heading: "", body: [] };
    if (!groups.length) groups.push(current);
    current.body.push(node);
  }

  return groups;
}

function renderCopy(group: Group): string {
  const images = group.body.filter((node) => isTag(node, "img"));
  const copy = withCta(group.body.filter((node) => !isTag(node, "img")).map(markNotes));

  if (!group.heading && !copy && images.length) {
    return `<div class="photo-stack">${images.join("")}</div>`;
  }

  if (!group.body.length) return `<div class="company-title">${group.heading}</div>`;

  if (images.length === 1) {
    return `<div class="home-donate"><div class="split-photo">${images[0]}</div><div>${group.heading}${copy}</div></div>`;
  }

  if (images.length > 1) {
    return `<div class="home-donate"><div class="photo-stack">${images.join("")}</div><div>${group.heading}${copy}</div></div>`;
  }

  return `<div class="service-detail">${group.heading}${copy}</div>`;
}

function renderFaq(group: Group): string {
  if (!group.body.some((node) => isTag(node, "h3"))) {
    return `<div class="service-detail">${group.heading}${withCta(group.body.map(markNotes))}</div>`;
  }

  const details: string[] = [];
  let cursor = 0;
  const nodes = group.body;

  while (cursor < nodes.length && !isTag(nodes[cursor], "h3")) cursor += 1;

  while (cursor < nodes.length) {
    const question = nodes[cursor].replace(/^<h3[^>]*>/i, "").replace(/<\/h3>$/i, "");
    cursor += 1;
    const answer: string[] = [];
    while (cursor < nodes.length && !isTag(nodes[cursor], "h3")) {
      answer.push(nodes[cursor]);
      cursor += 1;
    }
    details.push(`<details><summary>${question}</summary><div class="faq-a">${answer.join("")}</div></details>`);
  }

  return `<section class="service-faq">${group.heading}${details.join("")}</section>`;
}

function layoutRun(nodes: string[], faq: boolean): string {
  return groupByH2(nodes)
    .map((group) => (faq ? renderFaq(group) : renderCopy(group)))
    .join("");
}

function layoutStoryPage(html: string): string {
  const nodes = topNodes(html);
  const shared = nodes.filter(isShared);
  const content = nodes.filter((node) => !isShared(node) && !isTag(node, "section"));
  const groups = groupByH2(content);
  const title = textOf(groups[0]?.heading || "");
  const chapters = groups.slice(1);
  const images = content.filter((node) => isTag(node, "img"));
  const hero = `<section class="page-hero story-hero" style="--hero:url(&quot;https://speedy-move.com/wp-content/uploads/2023/11/image.jpeg&quot;)"><h1>${title}</h1></section>`;

  const bands = chapters.map((group, index) => {
    const copy = withCta(group.body.filter((node) => !isTag(node, "img")).map(markNotes));
    if (/Talk to Us/i.test(textOf(group.heading))) {
      return `<div class="service-detail">${group.heading}${copy}</div>`;
    }
    const photo = images[index] ? `<div class="split-photo">${images[index]}</div>` : "";
    const flipped = /Empowering Our Family/i.test(textOf(group.heading));
    return `<div class="home-donate${flipped ? " story-flip" : ""}">${photo}<div>${group.heading}${copy}</div></div>`;
  });

  return [hero, ...bands, ...shared].join("\n");
}

function layoutPricingPage(html: string): string {
  const nodes = topNodes(html);
  const hero: string[] = [];
  const shared: string[] = [];
  const content: string[] = [];

  for (const node of nodes) {
    if (isTag(node, "section")) hero.push(lineHero(node));
    else if (isShared(node)) shared.push(node);
    else content.push(node);
  }

  const images = content.filter((node) => isTag(node, "img"));
  let imageIndex = 0;
  const bands = groupByH2(content).map((group, index) => {
    const copy = withCta(group.body.filter((node) => !isTag(node, "img")).map(markNotes));
    const heading = textOf(group.heading);
    if (index === 0 || /Talk to Us/i.test(heading)) {
      return `<div class="service-detail">${group.heading}${copy}</div>`;
    }
    const image = images[imageIndex++] ?? "";
    const photo = image ? `<div class="split-photo">${image}</div>` : "";
    const flip = /Junk Removal Pricing/i.test(heading);
    return `<div class="home-donate${flip ? " story-flip" : ""}">${photo}<div>${group.heading}${copy}</div></div>`;
  });

  return [...hero, ...bands, ...shared].join("\n");
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function decodeText(value: string): string {
  return value
    .replace(/<[^>]+>/g, "")
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function blogCard(href: string, title: string, category: string): string {
  const path = href.endsWith("/") ? href : `${href}/`;
  const cover = blogCovers[path];
  const description = allPages.find((page) => page.path === path)?.description ?? "";
  const safeTitle = escapeHtml(decodeText(title));
  const image = cover ? `<img src="${escapeHtml(cover)}" alt="${safeTitle}">` : "";
  const excerpt = description ? `<p class="blog-excerpt">${escapeHtml(description)}</p>` : "";
  return `<article class="blog-card"><a href="${escapeHtml(path)}">${image}<p class="blog-kicker">${escapeHtml(category)}</p><h3>${safeTitle}</h3>${excerpt}<p class="blog-more">Read more <span aria-hidden="true">→</span></p></a></article>`;
}

function layoutBlogPage(html: string): string {
  const nodes = topNodes(html);
  const content = nodes.filter((node) => !isTag(node, "section") && !isShared(node));
  const groups = groupByH2(content).map((group) => {
    const list = group.body.find((node) => isTag(node, "ul"));
    if (!list) return `<div class="service-detail">${group.heading}${withCta(group.body.map(markNotes))}</div>`;
    const category = decodeText(group.heading);
    const cards = [...list.matchAll(/<a href="([^"]+)">([\s\S]*?)<\/a>/gi)].map((match) =>
      blogCard(match[1], match[2], category),
    );
    return `<section class="blog-index">${group.heading}<div class="blog-grid">${cards.join("")}</div></section>`;
  });

  return [...nodes.filter((node) => isTag(node, "section")), ...groups, ...nodes.filter(isShared)].join("\n");
}

export function layoutCompanyPage(pagePath: string, html: string): string {
  if (pagePath === "/our-story/") return layoutStoryPage(html);
  if (pagePath === "/pricing/") return layoutPricingPage(html);
  if (pagePath === "/blog/") return layoutBlogPage(html);
  const nodes = topNodes(html);
  const out: string[] = [];
  let cursor = 0;
  const faq = pagePath === "/faq/";

  while (cursor < nodes.length) {
    if (isTag(nodes[cursor], "section")) {
      out.push(lineHero(nodes[cursor]));
      cursor += 1;
      continue;
    }

    if (isShared(nodes[cursor])) {
      out.push(nodes[cursor]);
      cursor += 1;
      continue;
    }

    const run: string[] = [];
    while (cursor < nodes.length && !isTag(nodes[cursor], "section") && !isShared(nodes[cursor])) {
      run.push(nodes[cursor]);
      cursor += 1;
    }
    out.push(layoutRun(run, faq));
  }

  return out.join("\n");
}

export function layoutContactPage(html: string): { hero: string; facts: string; close: string } {
  const nodes = topNodes(html).filter((node) => !isShared(node));
  const headings = nodes.filter((node) => isTag(node, "h2"));
  const paragraphs = nodes.filter((node) => isTag(node, "p"));
  const copy = paragraphs.filter((node) => !isLinkOnly(node));
  const button = paragraphs.find(isLinkOnly) ?? "";
  const subtitle = copy[0] ?? "";
  const title = textOf(headings[0] ?? "");
  const facts = copy.slice(1).map((node) => {
    const text = textOf(node);
    if (text.includes("@")) {
      return `<li>${MAIL_ICON}<strong>Email</strong><span><a href="mailto:${text}">${text}</a></span></li>`;
    }
    if (/^\+?\(/.test(text)) {
      return `<li>${PHONE_ICON}<strong>Phone/WhatsApp</strong><span><a href="https://wa.me/85298477838">${text}</a></span></li>`;
    }
    return `<li>${BUILDING_ICON}<strong>Address</strong><span>${text}</span></li>`;
  });

  return {
    hero: `<section class="page-hero contact-hero" style="--hero:url(&quot;https://speedy-move.com/wp-content/uploads/moving-box-scaled.webp&quot;)"><h1>${title}</h1>${subtitle}${button}</section>`,
    facts: facts.join(""),
    close: headings[1] ?? "",
  };
}
