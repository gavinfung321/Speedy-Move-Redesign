import { readFileSync } from "node:fs";
import path from "node:path";
import { layoutChineseContact } from "@/lib/home-layout";

type Section = { heading: string; nodes: string[] };

const reviewPortraits: Record<string, string> = {
  陳先生: "/demolition/review-chan.webp",
  李太太: "/demolition/review-lee.webp",
  張小姐: "/demolition/review-cheung.webp",
  王經理: "/demolition/review-wong.webp",
  何婆婆: "/demolition/review-ho.webp",
  林先生: "/demolition/review-lam.webp",
};

const pointIcons = [
  `<svg viewBox="0 0 24 24"><path d="M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2z"/></svg>`,
  `<svg viewBox="0 0 24 24"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg>`,
  `<svg viewBox="0 0 24 24"><path d="M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>`,
];

function textOf(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function plain(html: string): string {
  return html.replace(/<\/?strong>/gi, "");
}

function cta(paragraph: string): string {
  return paragraph.replace("<p>", '<p class="cta">');
}

function introParagraph(node: string): string {
  const parts = node
    .replace(/^<p[^>]*>/, "")
    .replace(/<\/p>$/, "")
    .split(/<br\s*\/?>/i)
    .map((part) => part.trim())
    .filter(Boolean);
  let text = "";
  for (const part of parts) {
    if (!text) {
      text = part;
      continue;
    }
    const tail = text.replace(/<[^>]+>/g, "").trim().slice(-1);
    if ("，、：。！？".includes(tail)) text += part;
    else if (part.includes("、")) text += `、${part}`;
    else text += `。${part}`;
  }
  return `<p class="demo-intro">${text}</p>`;
}

function kindOf(heading: string): string {
  const label = textOf(heading);
  if (label.includes("流程")) return "process";
  if (label.includes("服務包括")) return "services";
  if (label.includes("具體說明")) return "details";
  if (/id="tab-/.test(heading)) return "tab";
  if (label.includes("認可")) return "approved";
  if (label.includes("優勢")) return "why";
  if (label.includes("客戶案例")) return "cases";
  if (label.includes("評價")) return "reviews";
  if (label.includes("合作夥伴")) return "partners";
  if (label.includes("價目") || label.includes("價錢")) return "price";
  if (label.includes("常見問題")) return "faq";
  if (label.includes("18區") || label.includes("附近")) return "near";
  if (label === "香港島" || label === "九龍" || label === "新界") return "district";
  if (label.includes("聯繫我們")) return "contact";
  return "block";
}

function sectionsAfter(lines: string[]): Section[] {
  const sections: Section[] = [];
  let current: Section | null = null;
  const leading: string[] = [];
  for (const line of lines) {
    if (line.includes('data-shared="demo-why-zh"')) {
      if (current) sections.push(current);
      current = { heading: "demo-why-zh", nodes: [] };
      continue;
    }
    if (line.startsWith("<h2")) {
      const heading = plain(line);
      const moved: string[] = [];
      if (current) {
        const nextKind = kindOf(heading);
        if ((nextKind === "tab" || nextKind === "why" || nextKind === "price") && current.nodes.at(-1)?.startsWith("<img")) moved.push(current.nodes.pop()!);
        sections.push(current);
      }
      current = { heading, nodes: [...leading.splice(0), ...moved] };
      continue;
    }
    if (current) current.nodes.push(line);
    else leading.push(line);
  }
  if (current) sections.push(current);
  return sections;
}

function isShortCell(line: string): boolean {
  if (!line.startsWith("<p")) return false;
  if (/<a|📊|🔨|🏷️|⚠️|費用全包|注意事項/.test(line)) return false;
  const label = textOf(line);
  return label.length > 0 && label.length < 48;
}

function inner(line: string): string {
  return line.replace(/^<p[^>]*>/, "").replace(/<\/p>$/, "");
}

function tableFrom(cells: string[]): string {
  const count = cells.length;
  let columns = 0;
  if (count >= 8 && count % 4 === 0 && textOf(cells[3]).length < 6) columns = 4;
  else if (count >= 6 && count % 3 === 0) columns = 3;
  if (!columns) return cells.join("");
  const rows: string[] = [];
  for (let index = 0; index < cells.length; index += columns) {
    const slice = cells.slice(index, index + columns).map(inner);
    const tag = index === 0 ? "th" : "td";
    const head = index === 0 ? `<thead><tr>${slice.map((cell) => `<th>${cell}</th>`).join("")}</tr></thead>` : "";
    if (index === 0) {
      rows.push(head);
      continue;
    }
    rows.push(`<tr>${slice.map((cell, cellIndex) => (cellIndex === 0 ? `<th>${cell}</th>` : `<${tag}>${cell}</${tag}>`)).join("")}</tr>`);
  }
  const body = rows.slice(1).join("");
  const cols =
    columns === 4
      ? `<colgroup><col class="col-item"><col class="col-rate"><col class="col-detail"><col class="col-time"></colgroup>`
      : "";
  return `<div class="price-scroll"><table class="move-prices rate-rows">${cols}${rows[0]}<tbody>${body}</tbody></table></div>`;
}

function notesBlock(paragraph: string): string {
  const lines = paragraph
    .replace(/^<p[^>]*>/, "")
    .replace(/<\/p>$/, "")
    .split(/<br\s*\/?>/i)
    .map((line) => line.trim())
    .filter((line) => textOf(line));
  let html = "";
  let items: string[] = [];
  const flush = () => {
    if (!items.length) return;
    html += `<ul>${items.map((item) => `<li>${item}</li>`).join("")}</ul>`;
    items = [];
  };
  for (const line of lines) {
    const label = textOf(line);
    if (/費用全包|注意事項|價格浮動/.test(label) && label.length < 20) {
      flush();
      html += `<p class="notes">${line}</p>`;
      continue;
    }
    items.push(line);
  }
  flush();
  return html;
}

function renderRich(nodes: string[]): string {
  let html = "";
  let index = 0;
  while (index < nodes.length) {
    if (isShortCell(nodes[index])) {
      const run: string[] = [];
      while (index < nodes.length && isShortCell(nodes[index])) run.push(nodes[index++]);
      html += tableFrom(run);
      continue;
    }
    if (nodes[index].startsWith("<p") && nodes[index].includes("<a") && !nodes[index].includes("<br")) {
      html += cta(nodes[index++]);
      continue;
    }
    if (nodes[index].startsWith("<p") && /費用全包|注意事項|價格浮動/.test(nodes[index])) {
      html += notesBlock(nodes[index++]);
      continue;
    }
    html += nodes[index++];
  }
  return html;
}

function renderServices(section: Section): string {
  const cards = section.nodes.filter((node) => node.includes("item-card"));
  if (cards.length > 0) {
    const loose = section.nodes.filter((node) => !node.includes("item-card"));
    const extras: string[] = [];
    for (let index = 0; index < loose.length; index += 1) {
      if (!loose[index].startsWith("<img")) continue;
      const heading = loose[index + 1]?.startsWith("<h3") ? loose[index + 1] : "";
      extras.push(`<div class="item-card">${loose[index]}<span>${textOf(heading)}</span></div>`);
      if (heading) index += 1;
    }
    return `<section class="home-items">${section.heading}<div class="item-grid">${cards.join("")}${extras.join("")}</div></section>`;
  }
  const articles: string[] = [];
  for (let index = 0; index < section.nodes.length; index += 1) {
    if (!section.nodes[index].startsWith("<img")) continue;
    const heading = section.nodes[index + 1]?.startsWith("<h3") ? plain(section.nodes[index + 1]) : "";
    const copy = section.nodes[index + 2]?.startsWith("<p") ? section.nodes[index + 2] : "";
    articles.push(`<article>${section.nodes[index]}${heading}${copy}</article>`);
    index += copy ? 2 : 1;
  }
  return `<div class="demo-included"><div class="service-detail">${section.heading}<div class="haul-grid titles-left">${articles.join("")}</div></div></div>`;
}

function renderExpert(section: Section, scene: string): string {
  const copy = section.nodes.filter((node) => node.startsWith("<p") && !node.includes("<a")).join("");
  const button = section.nodes.find((node) => node.includes("<a")) ?? "";
  const photo = scene ? ` style="--banner:url('${scene}')"` : "";
  return `<div class="demo-banner"${photo}><div class="demo-banner-copy">${section.heading}${copy}${button ? cta(button) : ""}</div></div>`;
}

function renderProcess(section: Section): string {
  const list = section.nodes.find((node) => node.startsWith("<ol")) ?? "";
  const image = section.nodes.find((node) => node.startsWith("<img")) ?? "";
  const intro = section.nodes.find((node) => node.startsWith("<p") && !node.includes("<a")) ?? "";
  const button = section.nodes.find((node) => node.includes("wa.me")) ?? "";
  const steps = [...list.matchAll(/<li>([\s\S]*?)<\/li>/g)].map((match) => {
    const [title, ...rest] = match[1].split(/<br\s*\/?>/i);
    return `<article><h3>${textOf(title)}</h3><p>${rest.join(" ").trim()}</p></article>`;
  });
  return `<div class="service-split" data-section="process"><div class="service-types">${section.heading}${intro}${steps.join("")}</div>${image}</div>${button ? `<div class="service-actions">${cta(button)}</div>` : ""}`;
}

function renderPoints(nodes: string[]): string {
  const cards: string[] = [];
  for (let index = 0; index < nodes.length; index += 1) {
    if (!nodes[index].startsWith("<h3")) continue;
    const copy = nodes[index + 1]?.startsWith("<p") ? nodes[index + 1] : "";
    const icon = pointIcons[cards.length] ?? pointIcons[2];
    cards.push(`<div class="feature"><span class="demo-icon" aria-hidden="true">${icon}</span>${plain(nodes[index])}${copy}</div>`);
    if (copy) index += 1;
  }
  return `<div class="feature-row demo-points">${cards.join("")}</div>`;
}

function renderWhy(section: Section): string {
  const image = section.nodes.find((node) => node.startsWith("<img")) ?? "";
  const articles: string[] = [];
  for (let index = 0; index < section.nodes.length; index += 1) {
    if (!section.nodes[index].startsWith("<h3")) continue;
    const copy = section.nodes[index + 1]?.startsWith("<p") ? section.nodes[index + 1] : "";
    articles.push(`<article>${plain(section.nodes[index])}${copy}</article>`);
    if (copy) index += 1;
  }
  return `<div class="service-detail">${section.heading}<div class="service-split">${image}<div class="service-types">${articles.join("")}</div></div></div>`;
}

function sharedWhy(): string {
  const html = readFileSync(path.join(process.cwd(), "content", "sections", "demo-why-zh.html"), "utf8").replaceAll("\u00a0", " ");
  const lines = html
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const heading = lines.find((line) => line.startsWith("<h2")) ?? "";
  return renderWhy({ heading: plain(heading), nodes: lines.filter((line) => line !== heading) });
}

function renderFaq(section: Section): string {
  const questions: string[] = [];
  for (let index = 0; index < section.nodes.length; index += 1) {
    if (!section.nodes[index].startsWith("<h3")) continue;
    let answer = "";
    let cursor = index + 1;
    while (section.nodes[cursor] && !section.nodes[cursor].startsWith("<h3") && !section.nodes[cursor].includes("更多常見問題")) {
      answer += section.nodes[cursor];
      cursor += 1;
    }
    questions.push(`<details name="faq"><summary>${textOf(section.nodes[index])}</summary><div class="faq-a">${answer}</div></details>`);
    index = cursor - 1;
  }
  const more = section.nodes.find((node) => node.includes("更多常見問題"));
  return `<section class="service-faq">${section.heading}${questions.join("")}${more ? cta(more) : ""}</section>`;
}

function renderBlock(section: Section): string {
  const photos = section.nodes.filter((node) => node.startsWith("<img")).length;
  if (photos >= 2 && section.nodes.some((node) => node.startsWith("<h3"))) return renderServices(section);
  if (section.nodes.some((node) => node.startsWith("<h3")) && !section.nodes.some((node) => node.startsWith("<img"))) {
    return renderFaq(section);
  }
  const image = section.nodes.find((node) => node.startsWith("<img")) ?? "";
  const rest = section.nodes
    .filter((node) => node !== image)
    .map((node) => (node.startsWith("<p") && node.includes("<a") && !node.includes("<br") ? cta(node) : node))
    .join("");
  if (image) return `<div class="service-split">${image}<div>${section.heading}${rest}</div></div>`;
  return `<div class="service-detail">${section.heading}${rest}</div>`;
}

export function layoutChineseDemolition(html: string): string {
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
    .replace('class="page-hero"', 'class="page-hero hero-copy-left"');
  const afterHero = lines.slice(heroEnd + 1);
  const priceIndex = /<h1>[^<]*清拆價錢/.test(hero);
  const scene = afterHero.find((line) => line.startsWith("<img"))?.match(/src="([^"]+)"/)?.[1] ?? "";
  const sections = sectionsAfter(afterHero);
  const out: string[] = [hero];

  for (let index = 0; index < sections.length; index += 1) {
    const section = sections[index];
    const kind = kindOf(section.heading);
    if (section.heading === "demo-why-zh" || kind === "why") {
      out.push(sharedWhy());
      continue;
    }
    if (kind === "district") continue;
    if (kind === "contact") continue;
    if (kind === "services") {
      if (section.nodes.some((node) => node.includes("item-card"))) continue;
      out.push(renderServices(section));
      continue;
    }
    if (kind === "details") {
      const tabs: Section[] = [];
      let cursor = index + 1;
      while (cursor < sections.length && kindOf(sections[cursor].heading) === "tab") tabs.push(sections[cursor++]);
      index = cursor - 1;
      const links = section.nodes.find((node) => node.startsWith("<ul")) ?? "";
      const anchors = [...links.matchAll(/<a href="([^"]+)">([\s\S]*?)<\/a>/g)]
        .map((match) => `<a href="${match[1]}">${textOf(match[2])}</a>`)
        .join("");
      const intro = section.nodes
        .filter((node) => node.startsWith("<p"))
        .map((node) =>
          node.includes("處理以下工程")
            ? `<p class="demo-intro">Speedy Move 提供住宅、商業及特殊清拆服務，團隊持有政府認證資格。施工符合《建築物條例》及環保規範。</p>`
            : introParagraph(node),
        )
        .join("");
      const articles = tabs
        .map((tab) => {
          const id = tab.heading.match(/id="([^"]+)"/)?.[1] ?? "";
          const image = tab.nodes.find((node) => node.startsWith("<img")) ?? "";
          const copy = tab.nodes.filter((node) => node.startsWith("<p") && !node.includes("詳細")).join("");
          const more = tab.nodes.find((node) => node.includes("詳細"));
          return `<article class="demo-service" id="${id}">${image}<div>${plain(tab.heading.replace(/ id="[^"]+"/, ""))}${copy}${more ? cta(more) : ""}</div></article>`;
        })
        .join("");
      out.push(`<div class="demo-flow"><div class="service-detail">${section.heading}${intro}<div class="demo-services">${anchors}</div>${articles}</div></div>`);
      continue;
    }
    if (kind === "process") {
      out.push(renderProcess(section));
      continue;
    }
    if (kind === "approved") {
      const copy = section.nodes.find((node) => node.startsWith("<p")) ?? "";
      out.push(`<div class="demo-approved" style="--banner:url('/demolition/approved.webp')"><h2><svg class="demo-check" viewBox="0 0 24 24" aria-hidden="true"><path d="M20 6.5 9.5 17 4 11.5" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>${textOf(section.heading)}</h2>${copy}</div>${renderPoints(section.nodes)}`);
      continue;
    }
    if (kind === "why") {
      out.push(renderWhy(section));
      continue;
    }
    if (kind === "cases") {
      const cases: Section[] = [];
      let cursor = index + 1;
      while (cursor < sections.length && kindOf(sections[cursor].heading) === "block" && sections[cursor].nodes.some((node) => node.startsWith("<img"))) {
        cases.push(sections[cursor++]);
      }
      index = cursor - 1;
      const articles = cases
        .map((item) => {
          const image = item.nodes.find((node) => node.startsWith("<img")) ?? "";
          const copy = item.nodes.filter((node) => node !== image && !node.includes("工程案例")).join("");
          return `<article class="demo-case"><div><h3>${textOf(item.heading)}</h3>${copy}</div>${image}</article>`;
        })
        .join("");
      const more = cases.flatMap((item) => item.nodes).find((node) => node.includes("工程案例"));
      out.push(`<div class="service-detail">${section.heading}${articles}${more ? cta(more) : ""}</div>`);
      continue;
    }
    if (kind === "reviews") {
      const stars = `<p class="review-stars" role="img" aria-label="5 out of 5 stars"><span></span><span></span><span></span><span></span><span></span></p>`;
      const quotes = section.nodes
        .filter((node) => node.startsWith("<blockquote"))
        .map((node) => {
          const match = node.match(/<blockquote>([\s\S]*?)<strong>([\s\S]*?)<\/strong>/i);
          if (!match) return "";
          const name = textOf(match[2]);
          const portrait = Object.entries(reviewPortraits).find(([key]) => name.startsWith(key))?.[1] ?? "";
          const photo = portrait ? `<img src="${portrait}" alt="">` : "";
          return `<blockquote>${stars}<p>${match[1].trim()}</p><div class="move-person">${photo}<span><strong>${name}</strong></span></div></blockquote>`;
        })
        .join("");
      out.push(`<div class="service-detail">${section.heading}<div class="move-reviews demo-reviews">${quotes}</div></div>`);
      continue;
    }
    if (kind === "partners") {
      const intro = section.nodes.find((node) => node.startsWith("<p")) ?? "";
      const grid = section.nodes.find((node) => node.includes("partner-grid")) ?? "";
      out.push(`<div class="service-detail">${section.heading}${intro ? `<p>${textOf(intro)}</p>` : ""}${grid}</div>`);
      continue;
    }
    if (kind === "price") {
      const next = sections[index + 1];
      const onlyImages = section.nodes.length > 0 && section.nodes.every((node) => node.startsWith("<img"));
      if (onlyImages && next && kindOf(next.heading) === "price") {
        next.nodes.unshift(...section.nodes);
        continue;
      }
      const images = section.nodes.filter((node) => node.startsWith("<img"));
      const body = renderRich(section.nodes.filter((node) => !node.startsWith("<img")));
      if (priceIndex) {
        if (!body) {
          out.push(`<div class="service-detail price-label" data-section="pricing">${section.heading}</div>`);
          continue;
        }
        const photo = images[0] ? `<div class="split-photo">${images[0]}</div>` : "";
        out.push(`<div class="price-layout move-offer price-block" data-section="pricing"><div class="move-intro">${section.heading}</div><div class="move-pair">${photo}<div>${body}</div></div></div>`);
        continue;
      }
      const image = images[0] ?? "";
      if (image && body) out.push(`<div class="price-layout move-offer" data-section="pricing"><div class="move-intro">${section.heading}</div><div class="move-pair"><div>${body}</div><div class="split-photo">${image}</div></div></div>`);
      else if (image) out.push(`<div class="service-detail" data-section="pricing">${section.heading}<div class="split-photo">${image}</div></div>`);
      else out.push(`<div class="service-detail" data-section="pricing">${section.heading}${body}</div>`);
      continue;
    }
    if (kind === "faq") {
      out.push(renderFaq(section));
      continue;
    }
    if (kind === "near") {
      const districts: Section[] = [];
      let cursor = index + 1;
      while (cursor < sections.length && kindOf(sections[cursor].heading) === "district") districts.push(sections[cursor++]);
      index = cursor - 1;
      const places = districts
        .map((place) => `<div><h2>${textOf(place.heading)}</h2>${place.nodes.find((node) => node.startsWith("<ul")) ?? ""}</div>`)
        .join("");
      const intro = section.nodes.find((node) => node.startsWith("<p")) ?? "";
      out.push(`<div class="near-band"><div class="near-layout">${section.heading}${intro}</div></div><div class="district-grid">${places}</div>`);
      continue;
    }
    if (kind === "block" && textOf(section.heading).includes("專家")) {
      out.push(renderExpert(section, scene));
      continue;
    }
    if (kind === "block" && textOf(section.heading).includes("案例") && !section.nodes.some((node) => node.startsWith("<img"))) {
      const studies: Section[] = [];
      let cursor = index + 1;
      while (cursor < sections.length && kindOf(sections[cursor].heading) === "block" && sections[cursor].nodes.some((node) => node.startsWith("<img")) && !textOf(sections[cursor].heading).includes("案例")) {
        studies.push(sections[cursor++]);
      }
      if (studies.length > 0) {
        index = cursor - 1;
        const articles = studies
          .map((item) => {
            const image = item.nodes.find((node) => node.startsWith("<img")) ?? "";
            const copy = item.nodes.filter((node) => node !== image).join("");
            return `<article class="demo-case"><div><h3>${textOf(item.heading)}</h3>${copy}</div>${image}</article>`;
          })
          .join("");
        out.push(`<div class="service-detail">${plain(section.heading)}${articles}</div>`);
        continue;
      }
    }
    out.push(renderBlock(section));
  }

  out.push(layoutChineseContact());
  return out.filter(Boolean).join("\n");
}
