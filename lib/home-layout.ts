import { readFileSync } from "node:fs";
import path from "node:path";
import covers from "@/content/blog-covers.json";
import catalog from "@/content/blog-posts.json";

const blogCovers = covers as Record<string, string>;
const blogGroups = new Map(
  (catalog as Array<{ path: string; group?: string; categories: string[] }>).map((post) => [
    post.path,
    post.group || post.categories[0] || "",
  ]),
);

const sections = path.join(process.cwd(), "content", "sections");

const itemLinks: Record<string, string> = {
  梳化: "/zh/棄置梳化/",
  床架和床褥: "/zh/棄置床褥/",
  衣櫃和櫥櫃: "/zh/棄置衣櫃/",
  垃圾雜物: "/zh/清理垃圾/",
  電器: "/zh/棄置電器/",
  電視和電子產品: "/zh/棄置電視/",
  家居垃圾: "/zh/家居垃圾/",
  餐桌餐椅: "/zh/棄置桌子與書桌/",
};

const reviewers: Record<string, { photo: string; date: string }> = {
  "Justine SI": {
    photo: "https://speedy-move.com/wp-content/uploads/Justine-SI-150x150.png",
    date: "2024-02-05T11:00:01.322950Z",
  },
  Lila: {
    photo: "https://speedy-move.com/wp-content/uploads/Lila-150x150.png",
    date: "2024-02-04T08:13:03.891701Z",
  },
  "Jonathan K.": {
    photo: "https://speedy-move.com/wp-content/uploads/Jonathan-K-150x150.png",
    date: "2024-01-13T07:15:03.052194Z",
  },
};

function textOf(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function readSection(name: string): string {
  return readFileSync(path.join(sections, `${name}.html`), "utf8").replaceAll("\u00a0", " ");
}

function cta(paragraph: string): string {
  return paragraph.replace("<p>", '<p class="cta">');
}

function layoutServices(lines: string[]): string {
  const cards: string[] = [];
  for (let index = 0; index < lines.length; index += 4) {
    const [image, heading, copy, link] = lines.slice(index, index + 4);
    if (!image || !heading || !copy || !link) continue;
    cards.push(`<article class="service-card">${image}<div>${heading}${copy}${cta(link)}</div></article>`);
  }
  return `<section class="home-services" data-section="services"><h2>服務包括</h2><div class="service-grid">${cards.join("")}</div></section>`;
}

function layoutItems(lines: string[], more: string): string {
  const cards: string[] = [];
  for (let index = 0; index < lines.length; index += 2) {
    const image = lines[index];
    const heading = lines[index + 1];
    if (!image || !heading) continue;
    const label = textOf(heading).replace(/\s/g, "");
    const href = itemLinks[label];
    const inner = `${image}<span>${label}</span>`;
    cards.push(href ? `<a class="item-card" href="${href}">${inner}</a>` : `<div class="item-card">${inner}</div>`);
  }
  return `<section class="home-items" data-section="items"><h2>常見處理的物品包括</h2><div class="item-grid">${cards.join("")}</div>${cta(more)}</section>`;
}

function layoutReviews(quotes: string[]): string {
  const cards = quotes.map((quote) => {
    const match = quote.match(/<blockquote>([\s\S]*?)<strong>([\s\S]*?)<\/strong>\s*<\/blockquote>/i);
    if (!match) return quote;
    const name = textOf(match[2]);
    const person = reviewers[name];
    const who = person
      ? `<div class="google-person"><img src="${person.photo}" alt="" width="40" height="40"><span><strong>${name}</strong><time datetime="${person.date}"></time></span></div>`
      : `<div class="google-person"><span><strong>${name}</strong></span></div>`;
    return `<blockquote><!--google-g-->${who}<p class="review-stars" role="img" aria-label="5 out of 5 stars"><span></span><span></span><span></span><span></span><span></span></p><p>${match[1].trim()}</p></blockquote>`;
  });
  return `<section class="home-reviews" data-section="reviews"><h2>客人評分</h2><div class="review-grid">${cards.join("")}</div></section>`;
}

function layoutNear(): string {
  let body = readSection("near-you-zh")
    .replace(/<img\b[^>]*>/i, "")
    .replace("<h2>香港島</h2>", "<h3>香港島</h3>")
    .replace("<h2>九龍</h2>", "<h3>九龍</h3>")
    .replace("<h2>新界</h2>", "<h3>新界</h3>");
  const places = ["香港島", "九龍", "新界"].map((name) => {
    const match = body.match(new RegExp(`<h3>${name}</h3>\\s*(<ul>[\\s\\S]*?</ul>)`));
    if (!match) return "";
    body = body.replace(match[0], "");
    return `<div><h3>${name}</h3>${match[1]}</div>`;
  }).join("");
  return `<section class="home-copy" data-shared="near-you"><div class="near-layout"><div>${body}<div class="near-places">${places}</div></div></div></section>`;
}

function layoutKinds(): string {
  const lines = readSection("all-kinds-zh")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const title = lines.shift() ?? "";
  const cards: string[] = [];
  let image = "";
  let heading = "";
  let list = "";
  let link = "";
  const flush = () => {
    if (!heading) return;
    cards.push(
      `<details class="kind" name="kinds"><summary>${image}${heading}</summary><div class="kind-body">${list}${link}</div></details>`,
    );
    image = "";
    heading = "";
    list = "";
    link = "";
  };
  let note = "";
  for (const line of lines) {
    if (line.startsWith("<img")) {
      flush();
      image = line;
    } else if (line.startsWith("<h2")) heading = line;
    else if (line.startsWith("<ul")) list = line;
    else if (line.startsWith("<p") && heading) link = line;
    else note = line;
  }
  flush();
  return `<section class="home-copy" data-shared="all-kinds">${title}<div class="kind-grid">${cards.join("")}</div>${note}</section>`;
}

function layoutBlog(): string {
  const html = readSection("blog-teaser-zh");
  const title = html.match(/<h2>[\s\S]*?<\/h2>/)?.[0] ?? "";
  const more = html.match(/<p><a[\s\S]*?<\/p>/)?.[0] ?? "";
  const cards = [...html.matchAll(/<li><a href="([^"]+)">([\s\S]*?)<\/a><\/li>/g)].map(([, href, label]) => {
    const pagePath = href.endsWith("/") ? href : `${href}/`;
    const cover = blogCovers[pagePath];
    const group = blogGroups.get(pagePath) ?? "";
    const image = cover ? `<img src="${cover}" alt="${label.replaceAll('"', "&quot;")}">` : "";
    const kicker = group ? `<p class="blog-kicker">${group}</p>` : "";
    return `<article class="blog-card"><a href="${pagePath}">${image}${kicker}<h3>${label}</h3><p class="blog-more">更多 <span aria-hidden="true">→</span></p></a></article>`;
  });
  return `<section class="home-copy" data-shared="blog-teaser">${title}<div class="blog-grid">${cards.join("")}</div>${cta(more)}</section>`;
}

export function layoutChineseContact(): string {
  const html = readSection("contact-info-zh");
  const title = html.match(/<h2>[\s\S]*?<\/h2>/)?.[0] ?? "";
  const items = [...html.matchAll(/<li>([\s\S]*?)<\/li>/g)].map((match) => textOf(match[1]));
  const [phone = "", address = "", email = ""] = items;
  const phoneNumber = phone.replace(/^.*?:\s*/, "");
  const emailAddress = email.replace(/^.*?:\s*/, "");
  return `<section class="home-copy contact-zh" data-shared="contact-info">${title}<div class="contact-layout"><ul class="contact-facts"><li><svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413"/></svg><span>${phone.replace(phoneNumber, "")}<a href="https://wa.me/85298477838">${phoneNumber}</a></span></li><li><svg viewBox="5.2 4.4 13.6 17.6" aria-hidden="true"><path d="M12 21.2c0 0-6-5.1-6-10a6 6 0 0 1 12 0c0 4.9-6 10-6 10Z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><circle cx="12" cy="11.2" r="2" fill="none" stroke="currentColor" stroke-width="1.6"/></svg><span>${address}</span></li><li><svg viewBox="2.7 4.7 18.6 14.6" aria-hidden="true"><rect x="3.5" y="5.5" width="17" height="13" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="m4 7 8 6 8-6" fill="none" stroke="currentColor" stroke-width="1.6"/></svg><span>${email.replace(emailAddress, "")}<a href="mailto:${emailAddress}">${emailAddress}</a></span></li></ul><iframe class="contact-map" title="觀塘 Speedy Move 地圖" referrerpolicy="no-referrer-when-downgrade" src="https://maps.google.com/maps?q=Kwun%20Tong%20Industrial%20Centre%2C%20460%20Kwun%20Tong%20Road%2C%20Kowloon&amp;hl=zh-TW&amp;z=15&amp;output=embed"></iframe></div></section>`;
}

export function layoutChineseHome(html: string): string {
  const lines = html
    .replaceAll("\u00a0", " ")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const title = lines.find((line) => line.startsWith("<h1")) ?? "";
  const subtitle = lines.find((line) => line.startsWith("<p>") && !line.includes("<a")) ?? "";
  const button = lines.find((line) => line.startsWith("<p><a")) ?? "";
  const serviceStart = lines.findIndex((line) => line.includes("服務包括"));
  const itemStart = lines.findIndex((line) => line.includes("常見處理的物品包括"));
  const reviewStart = lines.findIndex((line) => line.includes("客人評分"));
  const awardStart = lines.findIndex((line) => line.includes("香港商業時報"));
  const storyImage = lines.findIndex((line) => line.includes("Speedy-Truck"));
  const donateStart = lines.findIndex((line) => line.includes("回收並捐贈"));
  const faqStart = lines.findIndex((line) => line === "<h2>常見問題</h2>");

  const services = layoutServices(lines.slice(serviceStart + 1, itemStart));
  const moreItems = lines[reviewStart - 1];
  const items = layoutItems(lines.slice(itemStart + 1, reviewStart - 1), moreItems);
  const reviews = layoutReviews(lines.slice(reviewStart + 1, awardStart));
  const awardLines = lines.slice(awardStart, storyImage);
  const story = lines.slice(storyImage + 1, donateStart);
  const donateList = lines.find((line) => line.includes("家庭傢俬")) ?? "";
  const donateLink = lines.find((line) => line.includes("更多有關捐贈")) ?? "";
  const donateImage = lines.find((line) => line.includes("furniture-donation")) ?? "";
  const pricePhoto = lines.find((line) => line.includes("Pricing-1")) ?? "";
  const priceIntro = lines.find((line) => line.includes("以下因素")) ?? "";
  const priceList = lines.find((line) => line.includes("垃圾數量")) ?? "";
  const priceLink = lines.find((line) => line.includes("更多有關收費")) ?? "";
  const answers = lines.slice(faqStart + 1).filter((line) => line.startsWith("<p"));
  const questions = [
    "到你達之前 我能得到確實報價嗎？",
    "如何取消或更改預約？",
    "你們為我所在的地區/地點提供服務嗎？",
    "Speedy Move接受哪些付款方式？",
    "Speedy Move 的營業時間是？",
  ];

  const award = `<section class="home-award" data-section="award"><figure><img src="https://speedy-move.com/wp-content/uploads/Hong-Kong-Commercial-Times-Business-Awards-2024.webp" alt="${textOf(awardLines[0])}"><h2>${awardLines
    .map((line, index) => `<span${index === 1 ? ' class="award-prize"' : ""}>${textOf(line)}</span>`)
    .join("")}</h2></figure></section>`;
  const trust = `<section class="home-trust" data-section="story"><div class="trust-layout"><div class="trust-photo">${lines[storyImage]}</div><div>${story
    .map((line) => (line.startsWith("<p><a") ? cta(line) : line))
    .join("")}</div></div></section>`;
  const donate = `<section class="home-donate" data-section="donate"><div class="split-photo">${donateImage}</div><div><h2>回收並捐贈舊傢俬</h2>${donateList}${cta(donateLink)}</div></section>`;
  const pricing = `<div class="price-layout" data-section="pricing"><div class="split-photo">${pricePhoto}</div><div><h2>收費</h2>${priceIntro}${priceList}${cta(priceLink)}</div></div>`;
  const faqItems = answers
    .map((answer, index) => `<details name="faq"><summary>${questions[index] ?? ""}</summary>${answer}</details>`)
    .join("");
  const faq = `<section class="home-copy faq-zh" data-shared="faq"><h2>常見問題</h2>${faqItems}${cta(readSection("faq-zh"))}</section>`;

  return [
    `<section class="home-hero home-hero-zh">${title}${subtitle}${cta(button)}</section>`,
    `<div data-shared="how-it-works-zh"></div>`,
    services,
    items,
    reviews,
    award,
    trust,
    layoutNear(),
    pricing,
    donate,
    faq,
    layoutKinds(),
    layoutBlog(),
    layoutChineseContact(),
  ].join("\n");
}

const junkQuestions = [
  "到你達之前 我能得到確實報價嗎？",
  "如何取消或更改預約？",
  "你們為我所在的地區/地點提供服務嗎？",
  "Speedy Move接受哪些付款方式？",
  "Speedy Move 的營業時間是？",
];

export function layoutChineseJunk(html: string): string {
  const lines = html
    .replaceAll("\u00a0", " ")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const heroStart = lines.findIndex((line) => line.startsWith("<section"));
  const heroEnd = lines.findIndex((line, lineIndex) => lineIndex > heroStart && line === "</section>");
  const hero = lines
    .slice(heroStart, heroEnd + 1)
    .join("")
    .replace('class="page-hero"', 'class="page-hero hero-clear"');
  let index = lines.findIndex((line) => line.includes("how-it-works"));
  index = index < 0 ? 0 : index + 1;

  const featureIcons = [
    `<svg viewBox="0 0 576 512" aria-hidden="true"><path fill="currentColor" d="M546.2 9.7c-5.6-12.5-21.6-13-28.3-1.2C486.9 62.4 431.4 96 368 96h-80C182 96 96 182 96 288c0 7 .8 13.7 1.5 20.5C161.3 262.8 253.4 224 384 224c8.8 0 16 7.2 16 16s-7.2 16-16 16C132.6 256 26 410.1 2.4 468c-6.6 16.3 1.2 34.9 17.5 41.6 16.4 6.8 35-1.1 41.8-17.3 1.5-3.6 20.9-47.9 71.9-90.6 32.4 43.9 94 85.8 174.9 77.2C465.5 467.5 576 326.7 576 154.3c0-50.2-10.8-102.2-29.8-144.6z"/></svg>`,
    `<svg viewBox="0 0 576 512" aria-hidden="true"><path fill="currentColor" d="M259.3 17.8L194 150.2 47.9 171.5c-26.2 3.8-36.7 36.1-17.7 54.6l105.7 103-25 145.5c-4.5 26.3 23.2 46 46.4 33.7L288 439.6l130.7 68.7c23.2 12.2 50.9-7.4 46.4-33.7l-25-145.5 105.7-103c19-18.5 8.5-50.8-17.7-54.6L382 150.2 316.7 17.8c-11.7-23.6-45.6-23.9-57.4 0z"/></svg>`,
    `<svg viewBox="0 0 512 512" aria-hidden="true"><path fill="currentColor" d="M32 448c0 17.7 14.3 32 32 32h160V320H32v128zm448-288h-42.1c6.2-12.1 10.1-25.5 10.1-40 0-48.5-39.5-88-88-88-41.6 0-68.5 21.3-103 68.3-34.5-47-61.4-68.3-103-68.3-48.5 0-88 39.5-88 88 0 14.5 3.8 27.9 10.1 40H32c-17.7 0-32 14.3-32 32v80c0 8.8 7.2 16 16 16h480c8.8 0 16-7.2 16-16v-80c0-17.7-14.3-32-32-32zm-326.1 0c-22.1 0-40-17.9-40-40s17.9-40 40-40c19.9 0 34.6 3.3 86.1 80h-86.1zm206.1 0h-86.1c51.4-76.5 65.7-80 86.1-80 22.1 0 40 17.9 40 40s-17.9 40-40 40zm-72 320h160c17.7 0 32-14.3 32-32V320H288v160z"/></svg>`,
  ];
  const features: string[] = [];
  while (lines[index]?.startsWith("<h3") && lines[index + 1]?.startsWith("<p")) {
    const icon = featureIcons[features.length] ?? "";
    features.push(`<div class="feature">${icon}${lines[index].replace(/<\/?strong>/g, "")}${lines[index + 1]}</div>`);
    index += 2;
  }

  const photo = lines[index]?.startsWith("<img") ? lines[index++] : "";
  const serviceTitle = lines[index]?.startsWith("<h2") ? lines[index++] : "";
  const services: string[] = [];
  while (lines[index]?.startsWith("<h3") && lines[index + 1]?.startsWith("<p")) {
    services.push(`<article>${lines[index].replace(/<\/?strong>/g, "")}${lines[index + 1]}</article>`);
    index += 2;
  }

  const haulTitle = lines[index]?.startsWith("<h2") ? lines[index++] : "";
  const hauls: string[] = [];
  while (lines[index]?.startsWith("<img") && !lines[index].includes("Pricing")) {
    hauls.push(`<article>${lines[index]}${lines[index + 1] ?? ""}${lines[index + 2] ?? ""}</article>`);
    index += 3;
  }

  const priceImage = lines[index]?.includes("Pricing") ? lines[index++] : "";
  const priceTitle = lines[index]?.startsWith("<h2") ? lines[index++] : "";
  const priceIntro = lines[index]?.startsWith("<p") && !lines[index].includes("<a") ? lines[index++] : "";
  const priceList = lines[index]?.startsWith("<ul") ? lines[index++] : "";
  const priceLink = lines[index]?.includes("更多有關收費") ? cta(lines[index++]) : "";

  const answerStart = lines.findIndex((line) => line.includes("常見問題"));
  const answers: string[] = [];
  for (const line of lines.slice(answerStart + 1)) {
    if (line.startsWith("<h2") || line.includes("data-shared")) break;
    if (line.startsWith("<p") && !line.includes("<a")) answers.push(line);
  }
  const faqItems = answers
    .map((answer, answerIndex) => `<details name="faq"><summary>${junkQuestions[answerIndex] ?? ""}</summary>${answer}</details>`)
    .join("");
  const faq = `<section class="home-copy faq-zh" data-shared="faq"><h2>常見問題</h2>${faqItems}${cta(readSection("faq-zh"))}</section>`;

  const nearStart = lines.findIndex((line) => line.includes("附近的"));
  const nearTitle = lines[nearStart] ?? "";
  const nearIntro = lines[nearStart + 1]?.startsWith("<p") ? lines[nearStart + 1] : "";
  const places: string[] = [];
  for (let cursor = nearStart + 2; cursor < lines.length; cursor += 1) {
    if (!lines[cursor].startsWith("<h2") || !lines[cursor + 1]?.startsWith("<ul")) break;
    places.push(`<div><h3>${textOf(lines[cursor])}</h3>${lines[cursor + 1]}</div>`);
    cursor += 1;
  }
  const near = `<section class="home-copy" data-shared="near-you"><div class="near-layout"><div>${nearTitle}${nearIntro}<div class="near-places">${places.join("")}</div></div></div></section>`;

  return [
    hero,
    `<div data-shared="how-it-works-zh"></div>`,
    `<div class="feature-row">${features.join("")}</div>`,
    `<div class="service-detail"><div class="service-split">${photo}<div class="service-types">${serviceTitle}${services.join("")}</div></div>${haulTitle}<div class="haul-grid">${hauls.join("")}</div></div>`,
    `<div class="price-layout"><div class="split-photo">${priceImage}</div><div>${priceTitle}${priceIntro}${priceList}${priceLink}</div></div>`,
    faq,
    near,
    layoutBlog(),
    layoutKinds(),
    layoutChineseContact(),
  ].join("\n");
}

const movePortraits: Record<string, string> = {
  黃先生: "https://speedy-move.com/wp-content/uploads/黃先生-住宅搬運-150x150.png",
  李小姐: "https://speedy-move.com/wp-content/uploads/李小姐-辦公室搬遷-150x150.png",
  黃太: "https://speedy-move.com/wp-content/uploads/黃太-村屋搬運-150x150.png",
  王經理: "https://speedy-move.com/wp-content/uploads/王經理-倉庫搬運-150x150.png",
  梁生: "https://speedy-move.com/wp-content/uploads/梁生-迷你倉儲服務-150x150.png",
  歐陽太太: "https://speedy-move.com/wp-content/uploads/歐陽太太-機場物流支援-150x150.png",
};

function paragraphInner(line: string): string {
  return line.replace(/^<p[^>]*>/, "").replace(/<\/p>$/, "");
}

export function layoutChineseMoving(html: string): string {
  const lines = html
    .replaceAll("\u00a0", " ")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const heroStart = lines.findIndex((line) => line.startsWith("<section"));
  const heroEnd = lines.findIndex((line, lineIndex) => lineIndex > heroStart && line === "</section>");
  const hero = lines
    .slice(heroStart, heroEnd + 1)
    .join("")
    .replace("<p>香港", '<p class="hero-sub">香港');
  let index = heroEnd + 1;

  const serviceTitle = lines[index]?.startsWith("<h2") ? lines[index++] : "";
  const services: string[] = [];
  while (lines[index]?.startsWith("<img")) {
    const image = lines[index++];
    const heading = (lines[index++] ?? "").replace(/<\/?strong>/g, "");
    const copy = lines[index]?.startsWith("<p") && !lines[index].includes("<a") ? lines[index++] : "";
    const link = lines[index]?.startsWith("<p") && lines[index].includes("<a") ? lines[index++] : "";
    services.push(`<article>${image}${heading}${copy}${link}</article>`);
  }
  if (lines[index]?.includes("fast-and-easy")) index += 1;

  const processTitle = lines[index]?.startsWith("<h2") ? lines[index++].replace(/<\/?strong>/g, "") : "";
  const steps: string[] = [];
  while (lines[index]?.startsWith("<img")) {
    const image = lines[index++].includes("how-our-service-works")
      ? `<img src="/how-our-service-works.jpg" alt="我們的服務如何運作">`
      : lines[index - 1];
    const step = (lines[index++] ?? "").replace(/<\/?strong>/g, "");
    const title = (lines[index++] ?? "").replace(/<\/?strong>/g, "");
    const copy = lines[index]?.startsWith("<p") && !lines[index].includes("<a") ? lines[index++] : "";
    steps.push(`<article>${image}${step}${title}${copy}</article>`);
  }
  const quote = lines[index]?.includes("wa.me") ? cta(lines[index++]) : "";
  const procedures = lines[index]?.includes("<a") ? lines[index++].replace("<a ", '<a class="ink-button" ') : "";
  const actions = `<div class="service-actions">${quote}${procedures ? cta(procedures) : ""}</div>`;
  if (lines[index]?.includes("fast-and-easy")) index += 1;

  const reviewTitle = lines[index]?.startsWith("<h2") ? `<h2>${textOf(lines[index++])}</h2>` : "";
  const stars = `<p class="review-stars" role="img" aria-label="5 out of 5 stars"><span></span><span></span><span></span><span></span><span></span></p>`;
  const reviews: string[] = [];
  while (lines[index]?.startsWith("<blockquote")) {
    const match = lines[index].match(/<blockquote>([\s\S]*?)<strong>([\s\S]*?)<\/strong>/i);
    index += 1;
    if (!match) continue;
    const name = textOf(match[2]);
    const portrait = Object.entries(movePortraits).find(([key]) => name.startsWith(key))?.[1] ?? "";
    const photo = portrait ? `<img src="${portrait}" alt="">` : "";
    reviews.push(
      `<blockquote>${stars}<p>${match[1].trim()}</p><div class="move-person">${photo}<span><strong>${name}</strong></span></div></blockquote>`,
    );
  }

  let partnerBlock = "";
  if (lines[index]?.includes("合作夥伴")) {
    const partnerTitle = `<h2>${textOf(lines[index++])}</h2>`;
    const partnerIntro = lines[index]?.startsWith("<p") ? `<p>${textOf(lines[index++])}</p>` : "";
    const partners = lines[index]?.includes("partner-grid") ? lines[index++] : "";
    partnerBlock = `<div class="service-detail">${partnerTitle}${partnerIntro}${partners}</div>`;
  }

  const whyTitle = lines[index]?.startsWith("<h2") ? lines[index++].replace(/<\/?strong>/g, "") : "";
  const whyImage = lines[index]?.startsWith("<img") ? lines[index++] : "";
  const reasons: string[] = [];
  while (lines[index]?.startsWith("<h3")) {
    const heading = lines[index++].replace(/<\/?strong>/g, "");
    const list = lines[index]?.startsWith("<ul") ? lines[index++] : "";
    reasons.push(`<article>${heading}${list}</article>`);
  }

  const priceTitle = lines[index]?.startsWith("<h2") ? lines[index++] : "";
  const priceIntro = lines[index]?.startsWith("<p") ? lines[index++] : "";
  const head = [0, 1, 2, 3].map(() => paragraphInner(lines[index++] ?? ""));
  const priceLabel = paragraphInner(lines[index++] ?? "");
  const priceCells = [0, 1, 2].map(() => paragraphInner(lines[index++] ?? ""));
  const itemLabel = paragraphInner(lines[index++] ?? "");
  const itemCells = [0, 1, 2].map(() => paragraphInner(lines[index++] ?? ""));
  const notes = lines[index]?.startsWith("<p") ? `<p class="notes">${paragraphInner(lines[index++])}</p>` : "";
  const priceImage = lines[index]?.startsWith("<img") ? lines[index++] : "";

  const faqTitle = lines[index]?.includes("常見問題") ? `<h2>${textOf(lines[index++])}</h2>` : "";
  const questions: string[] = [];
  while (index < lines.length && !lines[index].includes("data-shared")) {
    if (!lines[index].startsWith("<h2")) {
      index += 1;
      continue;
    }
    const summary = textOf(lines[index++]);
    let answer = "";
    while (lines[index]?.startsWith("<p") || lines[index]?.startsWith("<ul")) answer += lines[index++];
    questions.push(`<details name="faq"><summary>${summary}</summary><div class="faq-a">${answer}</div></details>`);
  }
  const moreFaq = lines[index]?.includes("faq-zh") ? cta(readSection("faq-zh").trim()) : "";

  const table = `<table class="move-prices"><thead><tr>${head.map((cell) => `<th>${cell}</th>`).join("")}</tr></thead><tbody><tr><th>${priceLabel}</th>${priceCells.map((cell) => `<td>${cell}</td>`).join("")}</tr><tr><th>${itemLabel}</th>${itemCells.map((cell) => `<td>${cell}</td>`).join("")}</tr></tbody></table>`;

  return [
    hero,
    `<div class="service-detail">${serviceTitle}<div class="haul-grid titles-left">${services.join("")}</div></div>`,
    `<div class="service-detail">${processTitle}<div class="haul-grid">${steps.join("")}</div>${actions}</div>`,
    `<div class="service-detail">${reviewTitle}<div class="move-reviews">${reviews.join("")}</div></div>`,
    partnerBlock,
    `<div class="service-split why-move">${whyImage}<div class="service-types">${whyTitle}${reasons.join("")}</div></div>`,
    `<div class="price-layout move-offer"><div class="move-intro">${priceTitle}${priceIntro}</div><div class="move-pair"><div><div class="price-scroll">${table}</div>${notes}</div><div class="split-photo">${priceImage}</div></div></div>`,
    `<section class="service-faq">${faqTitle}${questions.join("")}${moreFaq}</section>`,
    layoutBlog(),
    layoutChineseContact(),
  ].join("\n");
}

function movePhoto(line: string): string {
  if (line.includes("how-our-service-works")) return `<img src="/how-our-service-works.jpg" alt="我們的服務如何運作">`;
  return line;
}

function moveReview(line: string): string {
  const match = line.match(/<blockquote>([\s\S]*?)<strong>([\s\S]*?)<\/strong>/i);
  if (!match) return "";
  const name = textOf(match[2]);
  const portrait = Object.entries(movePortraits).find(([key]) => name.startsWith(key))?.[1] ?? "";
  const photo = portrait ? `<img src="${portrait}" alt="">` : "";
  const stars = `<p class="review-stars" role="img" aria-label="5 out of 5 stars"><span></span><span></span><span></span><span></span><span></span></p>`;
  return `<blockquote>${stars}<p>${match[1].trim()}</p><div class="move-person">${photo}<span><strong>${name}</strong></span></div></blockquote>`;
}

export function layoutChineseProcess(html: string): string {
  const lines = html
    .replaceAll("\u00a0", " ")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const heroStart = lines.findIndex((line) => line.startsWith("<section"));
  const heroEnd = lines.findIndex((line, lineIndex) => lineIndex > heroStart && line === "</section>");
  const hero = lines
    .slice(heroStart, heroEnd + 1)
    .join("")
    .replace('class="page-hero"', 'class="page-hero process-hero"')
    .replace("<p>香港", '<p class="hero-sub">香港');
  let index = heroEnd + 1;
  const stepsTitle = lines[index]?.startsWith("<h2") ? lines[index++] : "";
  const steps: Array<{ title: string; body: string[] }> = [];
  const images: string[] = [];
  while (index < lines.length && !lines[index].includes("客戶")) {
    if (lines[index].startsWith("<img")) {
      images.push(movePhoto(lines[index++]));
      continue;
    }
    if (lines[index].startsWith("<h3")) {
      steps.push({ title: textOf(lines[index++]), body: [] });
      continue;
    }
    if (lines[index].startsWith("<p") && steps.length > 0) {
      const line = lines[index].includes("<a") ? cta(lines[index]) : lines[index];
      steps[steps.length - 1].body.push(line);
      index += 1;
      continue;
    }
    index += 1;
  }
  const rendered = steps.map((step, stepIndex) => {
    const image = images[stepIndex] ?? "";
    const side = stepIndex % 2 === 1 ? " story-flip" : "";
    const copy = `<h3>${step.title}</h3>${step.body.join("")}`;
    if (!image) return `<article class="move-step"><div>${copy}</div></article>`;
    return `<article class="home-donate move-step${side}"><div class="split-photo">${image}</div><div>${copy}</div></article>`;
  });

  const reviewTitle = lines[index]?.startsWith("<h2") ? `<h2>${textOf(lines[index++])}</h2>` : "";
  const reviews: string[] = [];
  while (lines[index]?.startsWith("<blockquote")) reviews.push(moveReview(lines[index++]));

  let partnerBlock = "";
  if (lines[index]?.includes("合作夥伴")) {
    const partnerTitle = `<h2>${textOf(lines[index++])}</h2>`;
    const partnerIntro = lines[index]?.startsWith("<p") ? `<p>${textOf(lines[index++])}</p>` : "";
    const partners = lines[index]?.includes("partner-grid") ? lines[index++] : "";
    partnerBlock = `<div class="service-detail">${partnerTitle}${partnerIntro}${partners}</div>`;
  }

  const whyTitle = lines[index]?.startsWith("<h2") ? lines[index++].replace(/<\/?strong>/g, "") : "";
  const whyImage = lines[index]?.startsWith("<img") ? lines[index++] : "";
  const reasons: string[] = [];
  while (lines[index]?.startsWith("<h3")) {
    const heading = lines[index++].replace(/<\/?strong>/g, "");
    const list = lines[index]?.startsWith("<ul") ? lines[index++] : "";
    reasons.push(`<article>${heading}${list}</article>`);
  }

  const faqTitle = lines[index]?.includes("常見問題") ? `<h2>${textOf(lines[index++])}</h2>` : "";
  const questions: string[] = [];
  while (index < lines.length && !lines[index].includes("data-shared")) {
    if (!lines[index].startsWith("<h2")) {
      index += 1;
      continue;
    }
    const summary = textOf(lines[index++]);
    let answer = "";
    while (lines[index]?.startsWith("<p") || lines[index]?.startsWith("<ul")) answer += lines[index++];
    questions.push(`<details name="faq"><summary>${summary}</summary><div class="faq-a">${answer}</div></details>`);
  }

  return [
    hero,
    `<section class="move-steps">${stepsTitle}${rendered.join("")}</section>`,
    `<div class="service-detail">${reviewTitle}<div class="move-reviews">${reviews.join("")}</div></div>`,
    partnerBlock,
    `<div class="service-split why-move">${whyImage}<div class="service-types">${whyTitle}${reasons.join("")}</div></div>`,
    `<section class="service-faq">${faqTitle}${questions.join("")}</section>`,
    layoutBlog(),
    layoutChineseContact(),
  ].join("\n");
}

export function applyChineseShared(html: string): string {
  return html.replace(/<div data-shared="([\w-]+)"><\/div>/g, (marker, name: string) => {
    if (name === "fast-and-easy-zh") return "";
    if (name === "blog-teaser-zh") return layoutBlog();
    if (name === "all-kinds-zh") return layoutKinds();
    if (name === "near-you-zh") return layoutNear();
    if (name === "contact-info-zh") return layoutChineseContact();
    if (name === "faq-zh" || name === "pricing-zh") return readSection(name);
    return marker;
  });
}
