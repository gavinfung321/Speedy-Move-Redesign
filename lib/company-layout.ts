import covers from "@/content/blog-covers.json";
import catalog from "@/content/blog-posts.json";
import { layoutChineseContact } from "@/lib/home-layout";
import { allPages } from "@/lib/pages";

const VOID_TAGS = new Set(["img", "br", "hr", "source"]);
const blogCovers = covers as Record<string, string>;
const blogPosts = catalog as Array<{ path: string; date: string; categories: string[]; group?: string }>;

export type PostLink = { path: string; title: string; image: string };

function postLink(path: string): PostLink {
  return {
    path,
    title: allPages.find((page) => page.path === path)?.title ?? path,
    image: blogCovers[path] ?? "",
  };
}

export function postCategory(pagePath: string): string {
  const post = blogPosts.find((entry) => entry.path === pagePath);
  return post?.group || post?.categories[0] || "";
}

export function relatedPosts(pagePath: string): {
  previous: PostLink | null;
  next: PostLink | null;
  similar: PostLink[];
} {
  const chinese = pagePath.startsWith("/zh/");
  const posts = blogPosts.filter((post) => post.path.startsWith("/zh/") === chinese);
  const index = posts.findIndex((post) => post.path === pagePath);
  if (index < 0) return { previous: null, next: null, similar: [] };
  const current = posts[index];
  const similar = posts
    .filter(
      (post) => post.path !== pagePath && post.categories.some((category) => current.categories.includes(category)),
    )
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 6)
    .map((post) => postLink(post.path));
  return {
    previous: index > 0 ? postLink(posts[index - 1].path) : null,
    next: index < posts.length - 1 ? postLink(posts[index + 1].path) : null,
    similar,
  };
}

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

function layoutTermsPage(html: string): string {
  const nodes = topNodes(html);
  const hero = nodes.filter((node) => isTag(node, "section")).map(lineHero);
  const shared = nodes.filter(isShared);
  const content = nodes.filter((node) => !isTag(node, "section") && !isShared(node));
  return [...hero, `<div class="service-detail terms-copy">${content.join("")}</div>`, ...shared].join("\n");
}

const MOVE_STARS =
  '<p class="review-stars" role="img" aria-label="5 out of 5 stars"><span></span><span></span><span></span><span></span><span></span></p>';

const MOVE_REVIEWS = [
  ["The movers finished the whole house in just two hours, even the glass display cabinet arrived without a scratch! The final charge matched the quote—honest and reliable.", "https://speedy-move.com/wp-content/uploads/黃先生-住宅搬運-150x150.png", "Mr. Wong", "Residential Move", "Taikoo Shing → Ma On Shan"],
  ["They moved 20 executive chairs and a conference table in half a day, even reassembled everything without disrupting our business.", "https://speedy-move.com/wp-content/uploads/李小姐-辦公室搬遷-150x150.png", "Ms. Lee", "Office Relocation", "Kwun Tong → Tsim Sha Tsui"],
  ["Three flights of stairs, but the team moved the large cabinet without a single bump—even helped dispose of the old furniture!", "https://speedy-move.com/wp-content/uploads/黃太-村屋搬運-150x150.png", "Mrs. Wong", "Village House Move", "Tai Po Village House"],
  ["They dismantled and reassembled the entire warehouse shelving—not a single missing part—and finished faster than we expected!", "https://speedy-move.com/wp-content/uploads/王經理-倉庫搬運-150x150.png", "Manager Wang", "Warehouse Move + Shelving Assembly", "Logistics Company"],
  ["Stored all our furniture and appliances for six months—the crew wrapped them in dust-proof film, and they came out looking brand new!", "https://speedy-move.com/wp-content/uploads/梁生-迷你倉儲服務-150x150.png", "Mr. Leung", "Storage Service", "Lai Chi Kok → Mini Storage"],
  ["Worked overnight to crate everything and delivered it just in time for the last cargo flight! Our German client praised the professional packaging.", "https://speedy-move.com/wp-content/uploads/歐陽太太-機場物流支援-150x150.png", "Mrs. Au-Yeung", "Airport Logistics Support", "Trading Company"],
].map(
  ([quote, photo, name, role, place]) =>
    `<blockquote>${MOVE_STARS}<p>${quote}</p><div class="move-person"><img src="${photo}" alt=""><span><strong>${name}</strong><span>${role}</span><span>${place}</span></span></div></blockquote>`,
);

function plainHeading(node: string): string {
  return node.replace(/<\/?strong>/gi, "");
}

function renderMoveStep(heading: string, body: string[], image: string | undefined, index: number): string {
  const copy = withCta(body);
  const title = plainHeading(heading);
  if (!image) return `<article class="move-step"><div>${title}${copy}</div></article>`;
  const side = index % 2 === 1 ? " story-flip" : "";
  return `<article class="home-donate move-step${side}"><div class="split-photo">${image}</div><div>${title}${copy}</div></article>`;
}

function renderMoveSteps(group: Group): string {
  const images = group.body.filter((node) => isTag(node, "img")).map((node) =>
    node.replace(
      "https://speedy-move.com/wp-content/uploads/how-our-service-works.jpg",
      "/how-our-service-works.jpg",
    ),
  );
  const steps: { heading: string; body: string[] }[] = [];
  let heading = "";
  let body: string[] = [];
  const flush = () => {
    if (heading) steps.push({ heading, body });
  };
  for (const node of group.body) {
    if (isTag(node, "h3")) {
      flush();
      heading = node;
      body = [];
      continue;
    }
    if (!isTag(node, "img")) body.push(node);
  }
  flush();
  const rendered = steps.map((step, index) => renderMoveStep(step.heading, step.body, images[index], index));
  return `<section class="move-steps">${group.heading}${rendered.join("")}</section>`;
}

function renderMoveReasons(group: Group): string {
  const image = group.body.find((node) => isTag(node, "img")) ?? "";
  const articles: string[] = [];
  let heading = "";
  let list = "";
  for (const node of group.body) {
    if (isTag(node, "h3")) {
      if (heading) articles.push(`<article>${plainHeading(heading)}${list}</article>`);
      heading = node;
      list = "";
      continue;
    }
    if (isTag(node, "ul")) list = node;
  }
  if (heading) articles.push(`<article>${plainHeading(heading)}${list}</article>`);
  return `<section class="why-move-block">${group.heading}<div class="service-split why-move">${image}<div class="service-types">${articles.join("")}</div></div></section>`;
}

export function layoutMovingProcess(html: string): string {
  const nodes = topNodes(html.replace(/<strong>\s*<\/strong>/gi, " "));
  const hero = nodes
    .filter((node) => isTag(node, "section"))
    .map((node) => node.replace('class="page-hero"', 'class="page-hero process-hero"'));
  const shared = nodes.filter(isShared);
  const groups = groupByH2(nodes.filter((node) => !isTag(node, "section") && !isShared(node)));
  const out = [...hero];
  const questions: Group[] = [];
  let asking = false;
  let faqTitle = "";

  for (const group of groups) {
    const heading = textOf(group.heading);
    if (/Frequently Asked/i.test(heading)) {
      asking = true;
      faqTitle = group.heading;
      continue;
    }
    if (asking) {
      questions.push(group);
      continue;
    }
    if (/^Moving Process$/i.test(heading)) out.push(renderMoveSteps(group));
    else if (/Customer Reviews/i.test(heading)) {
      out.push(`<div class="service-detail">${group.heading}<div class="move-reviews">${MOVE_REVIEWS.join("")}</div></div>`);
    } else if (/Our Partners/i.test(heading)) out.push(`<div class="service-detail">${group.heading}${group.body.join("")}</div>`);
    else if (/Why Choose/i.test(heading)) out.push(renderMoveReasons(group));
    else out.push(`<div class="service-detail">${group.heading}${withCta(group.body)}</div>`);
  }

  const faq = questions
    .map(
      (group) =>
        `<details name="move-process-faq"><summary>${textOf(group.heading)}</summary><div class="faq-a">${group.body.join("")}</div></details>`,
    )
    .join("");
  if (faqTitle) out.push(`<section class="service-faq">${faqTitle}${faq}</section>`);
  return [...out, ...shared].join("\n");
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

function blogCard(href: string, title: string, category: string, more = "Read more"): string {
  const path = href.endsWith("/") ? href : `${href}/`;
  const cover = blogCovers[path];
  const description = allPages.find((page) => page.path === path)?.description ?? "";
  const safeTitle = escapeHtml(decodeText(title));
  const image = cover ? `<img src="${escapeHtml(cover)}" alt="${safeTitle}">` : "";
  const excerpt = description ? `<p class="blog-excerpt">${escapeHtml(description)}</p>` : "";
  return `<article class="blog-card"><a href="${escapeHtml(path)}">${image}<p class="blog-kicker">${escapeHtml(category)}</p><h3>${safeTitle}</h3>${excerpt}<p class="blog-more">${escapeHtml(more)} <span aria-hidden="true">→</span></p></a></article>`;
}

const blogSectionIds: Record<string, string> = {
  "Junk Removal": "junk-removal",
  "Furniture Disposal": "furniture-disposal",
  "Home Moving": "home-moving",
  "Office Moving": "office-moving",
  Recycling: "recycling",
  "Talk to Us": "talk",
  垃圾棄置: "junk-removal",
  傢俬棄置: "furniture-disposal",
  回收: "recycling",
};

function blogSectionAttr(name: string): string {
  const id = blogSectionIds[name];
  return id ? ` id="${id}" data-section="${id}"` : "";
}

function layoutBlogPage(html: string): string {
  const nodes = topNodes(html);
  const content = nodes.filter((node) => !isTag(node, "section") && !isShared(node));
  const groups = groupByH2(content).map((group) => {
    const list = group.body.find((node) => isTag(node, "ul"));
    const category = decodeText(group.heading);
    if (!list) return `<div class="service-detail"${blogSectionAttr(category)}>${group.heading}${withCta(group.body.map(markNotes))}</div>`;
    const cards = [...list.matchAll(/<a href="([^"]+)">([\s\S]*?)<\/a>/gi)].map((match) =>
      blogCard(match[1], match[2], category),
    );
    return `<section class="blog-index"${blogSectionAttr(category)}>${group.heading}<div class="blog-grid">${cards.join("")}</div></section>`;
  });

  return [...nodes.filter((node) => isTag(node, "section")), ...groups, ...nodes.filter(isShared)].join("\n");
}

export function layoutChineseBlog(html: string): string {
  const list = html.match(/<ul>[\s\S]*?<\/ul>/)?.[0] ?? "";
  const groups: { name: string; cards: string[] }[] = [];
  for (const match of list.matchAll(/<a href="([^"]+)">([\s\S]*?)<\/a>/gi)) {
    const path = match[1].endsWith("/") ? match[1] : `${match[1]}/`;
    const name = postCategory(path);
    let group = groups.find((item) => item.name === name);
    if (!group) {
      group = { name, cards: [] };
      groups.push(group);
    }
    group.cards.push(blogCard(path, match[2], name, "更多"));
  }
  const hero = `<section class="page-hero" style="--hero:url(&quot;https://speedy-move.com/wp-content/uploads/moving-box-scaled.webp&quot;)"><h1>網誌</h1></section>`;
  const sections = groups
    .map((group) => `<section class="blog-index"${blogSectionAttr(group.name)}><h2>${escapeHtml(group.name)}</h2><div class="blog-grid">${group.cards.join("")}</div></section>`)
    .join("\n");
  return `${hero}\n${sections}\n${layoutChineseContact()}`;
}

export function layoutCategoryPage(title: string, blogHtml: string): string {
  const nodes = topNodes(blogHtml);
  const heroNode = nodes.find((node) => isTag(node, "section")) ?? "";
  const hero = heroNode
    .replace(/<h1>[\s\S]*?<\/h1>/i, `<h1>${escapeHtml(title)}</h1>`)
    .replace(/<p>[\s\S]*?<\/p>/i, "");
  const content = nodes.filter((node) => !isTag(node, "section") && !isShared(node));
  const group = groupByH2(content).find((item) => decodeText(item.heading) === title);
  const list = group?.body.find((node) => isTag(node, "ul")) ?? "";
  const cards = [...list.matchAll(/<a href="([^"]+)">([\s\S]*?)<\/a>/gi)].map((match) =>
    blogCard(match[1], match[2], title),
  );
  const shared = nodes.filter(isShared);
  return `${hero}<section class="blog-index category-index"><div class="blog-grid">${cards.join("")}</div></section>\n${shared.join("\n")}`;
}

export function layoutPostPage(pagePath: string, title: string, category: string, html: string): string {
  const cover = blogCovers[pagePath] ?? "";
  const banner = cover
    ? `<div class="post-banner" style="--hero:url(&quot;${escapeHtml(cover)}&quot;)"></div>`
    : "";
  const kicker = category ? `<p class="blog-kicker">${escapeHtml(category)}</p>` : "";
  return `${banner}<div class="post-article">${kicker}<h1>${escapeHtml(title)}</h1>${html}</div>`;
}

export function layoutCompanyPage(pagePath: string, html: string): string {
  if (pagePath === "/our-story/") return layoutStoryPage(html);
  if (pagePath === "/terms-conditions/") return layoutTermsPage(html);
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

export function layoutContactPage(html: string, language: "en" | "zh" = "en"): { hero: string; facts: string; close: string } {
  const nodes = topNodes(html).filter((node) => !isShared(node));
  const headings = nodes.filter((node) => isTag(node, "h2"));
  const paragraphs = nodes.filter((node) => isTag(node, "p"));
  const copy = paragraphs.filter((node) => !isLinkOnly(node));
  const button = paragraphs.find(isLinkOnly) ?? "";
  const subtitle = copy[0] ?? "";
  const title = textOf(headings[0] ?? "");
  const labels = language === "zh"
    ? { email: "電郵", phone: "WhatsApp 或 致電", address: "地址" }
    : { email: "Email", phone: "Phone/WhatsApp", address: "Address" };
  const facts = copy.slice(1).map((node) => {
    const text = textOf(node);
    if (text.includes("@")) {
      return `<li>${MAIL_ICON}<strong>${labels.email}</strong><span><a href="mailto:${text}">${text}</a></span></li>`;
    }
    if (/^\+?\(/.test(text)) {
      return `<li>${PHONE_ICON}<strong>${labels.phone}</strong><span><a href="https://wa.me/85298477838">${text}</a></span></li>`;
    }
    return `<li>${BUILDING_ICON}<strong>${labels.address}</strong><span>${text}</span></li>`;
  });

  return {
    hero: `<section class="page-hero contact-hero" style="--hero:url(&quot;https://speedy-move.com/wp-content/uploads/moving-box-scaled.webp&quot;)"><h1>${title}</h1>${subtitle}${button}</section>`,
    facts: facts.join(""),
    close: headings[1] ?? "",
  };
}

const DONATE_HERO = "https://speedy-move.com/wp-content/uploads/2023/11/Donation-3-1.jpg";

function donateReasons(list: string): string {
  return [...list.matchAll(/<li>([\s\S]*?)<\/li>/gi)]
    .map((match) => {
      const title = /<strong>([\s\S]*?)<\/strong>/i.exec(match[1])?.[1] ?? "";
      const body = match[1].replace(/<strong>[\s\S]*?<\/strong>/i, "").replace(/^\s*<br\s*\/?>/i, "").trim();
      return `<article><h3>${title}</h3><p>${body}</p></article>`;
    })
    .join("");
}

export function layoutChineseDonation(html: string): string {
  const nodes = topNodes(html);
  const sections: { heading: string; nodes: string[] }[] = [];
  const shared: string[] = [];
  for (const node of nodes) {
    if (isShared(node)) {
      shared.push(node);
      continue;
    }
    if (isTag(node, "h2")) {
      sections.push({ heading: node, nodes: [] });
      continue;
    }
    sections.at(-1)?.nodes.push(node);
  }

  const [hero, lead, why, offer, freeOffer, whyNow, how, choose, more] = sections;
  if (!hero || !lead || !why || !offer || !freeOffer || !whyNow || !how || !choose || !more) return html;

  const images = nodes.filter((node) => isTag(node, "img"));
  const subtitle = hero.nodes.find((node) => isTag(node, "p")) ?? "";
  const leadCopy = lead.nodes.filter((node) => isTag(node, "p"));
  const kicker = leadCopy[0]?.replace(/^<p\b/i, '<p class="donate-kicker"') ?? "";
  const whyNowList = whyNow.nodes.find((node) => isTag(node, "ul")) ?? "";
  const chooseList = choose.nodes.find((node) => isTag(node, "ul")) ?? "";
  const steps = how.nodes.find((node) => isTag(node, "ol")) ?? "";
  const talk = more.nodes.filter((node) => isTag(node, "p") && !isLinkOnly(node)).join("");
  const button = more.nodes.find(isLinkOnly)?.replace(/^<p\b/i, '<p class="cta"') ?? "";

  return `<section class="page-hero donate-hero" style="--hero:url(&quot;${DONATE_HERO}&quot;)"><h1>${textOf(hero.heading)}</h1>${subtitle}</section>
<div class="donate-flow">
<div class="service-detail donate-lead">${lead.heading}${kicker}<div class="service-split">${images[0] ?? ""}<div>${leadCopy.slice(1).join("")}</div></div></div>
<div class="service-detail">${why.heading}<div class="service-split"><div class="service-types">${donateReasons(why.nodes.find((node) => isTag(node, "ul")) ?? "")}</div>${images[1] ?? ""}</div></div>
<div class="service-detail donate-offers"><div class="service-split">${images[2] ?? ""}<div>${offer.heading}${offer.nodes.filter((node) => isTag(node, "p")).join("")}${freeOffer.heading}${freeOffer.nodes.filter((node) => isTag(node, "p")).join("")}</div></div></div>
<div class="service-detail">${whyNow.heading}<div class="service-split"><div>${whyNowList.replace(/^<ul\b/i, '<ul class="donate-points"')}</div>${images[3] ?? ""}</div></div>
<div class="service-detail donate-steps">${how.heading}<div class="service-split">${images[4] ?? ""}<div>${steps}</div></div></div>
<div class="service-detail">${choose.heading}<div class="service-split"><div>${chooseList.replace(/^<ul\b/i, '<ul class="donate-points"')}</div>${images[5] ?? ""}</div></div>
<div class="donate-talk">${more.heading}${talk}${button}</div>
</div>
${shared.join("\n")}`;
}
