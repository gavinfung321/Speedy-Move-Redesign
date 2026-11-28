import { readFileSync } from "node:fs";
import path from "node:path";

const VOID_TAGS = new Set(["img", "br", "hr", "source"]);

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

function isLinkOnly(node: string): boolean {
  return /^<p(?:\s[^>]*)?>\s*<a\b[^>]*>[\s\S]*?<\/a>\s*<\/p>$/i.test(node.trim());
}

function withCta(nodes: string[]): string {
  return nodes
    .map((node) => (isLinkOnly(node) ? node.replace(/^<p\b/i, '<p class="cta"') : node))
    .join("");
}

function groupByHeading(nodes: string[]): string[][] {
  const groups: string[][] = [];
  let current: string[] | null = null;

  for (const node of nodes) {
    if (isTag(node, "h2")) {
      if (current) groups.push(current);
      current = [node];
      continue;
    }
    if (!current) current = [];
    current.push(node);
  }

  if (current?.length) groups.push(current);
  return groups;
}

function textSection(group: string[]): string {
  return `<div class="service-detail">${withCta(group)}</div>`;
}

function donate(img: string, group: string[]): string {
  return `<div class="home-donate"><div class="split-photo">${img}</div><div>${withCta(group)}</div></div>`;
}

function price(img: string, group: string[]): string {
  return `<div class="price-layout"><div class="split-photo">${img}</div><div>${withCta(group)}</div></div>`;
}

function layoutMiddle(run: string[]): string {
  const firstImg = run.findIndex((node) => isTag(node, "img"));
  if (firstImg === -1) return groupByHeading(run).map(textSection).join("");

  let cursor = firstImg;
  const images: string[] = [];
  while (cursor < run.length && isTag(run[cursor], "img")) {
    images.push(run[cursor]);
    cursor += 1;
  }

  const before = run.slice(0, firstImg);
  const after = run.slice(cursor);
  if (!after.length || !isTag(after[0], "h2") || !images.length) {
    return `${groupByHeading(before).map(textSection).join("")}${images.map((img) => textSection([img])).join("")}${layoutMiddle(after)}`;
  }

  const priceImg = images.pop()!;
  const afterGroups = groupByHeading(after);
  const priceGroup = afterGroups[0];
  const rest = afterGroups.slice(1).flat();
  const groups = groupByHeading(before);
  const parts: string[] = [];

  if (images.length === 1 && groups.length) {
    parts.push(donate(images[0], groups.flat()));
  } else {
    const paired: string[] = [];
    while (images.length && groups.length) {
      paired.unshift(donate(images.pop()!, groups.pop()!));
    }
    parts.push(...images.map((img) => textSection([img])), ...groups.map(textSection), ...paired);
  }

  parts.push(price(priceImg, priceGroup));
  if (rest.length) parts.push(layoutMiddle(rest));
  return parts.join("");
}

function layoutOpening(run: string[]): string {
  const parts: string[] = [];
  const splits: string[] = [];
  let cursor = 0;

  while (cursor < run.length) {
    if (!isTag(run[cursor], "img")) {
      const loose: string[] = [];
      while (cursor < run.length && !isTag(run[cursor], "img")) {
        loose.push(run[cursor]);
        cursor += 1;
      }
      parts.push(layoutMiddle(loose));
      continue;
    }

    const img = run[cursor];
    cursor += 1;
    const copy: string[] = [];
    while (cursor < run.length && !isTag(run[cursor], "img")) {
      copy.push(run[cursor]);
      cursor += 1;
    }
    splits.push(`<div class="service-split">${img}<div>${withCta(copy)}</div></div>`);
  }

  if (splits.length) parts.push(`<div class="service-detail item-open">${splits.join("")}</div>`);
  return parts.join("");
}

function layoutFaq(run: string[]): string {
  const title = run.find((node) => isTag(node, "h2")) ?? "";
  const nodes = run.filter((node) => node !== title);
  const lead: string[] = [];
  const details: string[] = [];
  let cta = "";
  let cursor = 0;

  while (cursor < nodes.length && !isTag(nodes[cursor], "h3")) {
    lead.push(nodes[cursor]);
    cursor += 1;
  }

  while (cursor < nodes.length) {
    const question = nodes[cursor].replace(/^<h3[^>]*>/i, "").replace(/<\/h3>$/i, "");
    cursor += 1;
    const body: string[] = [];
    while (cursor < nodes.length && !isTag(nodes[cursor], "h3")) {
      body.push(nodes[cursor]);
      cursor += 1;
    }
    if (cursor >= nodes.length) {
      while (body.length && isLinkOnly(body[body.length - 1])) cta = withCta([body.pop()!]);
    }
    details.push(`<details><summary>${question}</summary><div class="faq-a">${body.join("")}</div></details>`);
  }

  return `<section class="service-faq">${title}${withCta(lead)}${details.join("")}${cta}</section>`;
}

function layoutRun(run: string[]): string {
  if (run.some((node) => isTag(node, "h3"))) return layoutFaq(run);
  if (isTag(run[0] ?? "", "img")) return layoutOpening(run);
  return layoutMiddle(run);
}

function sharedName(node: string): string {
  return /^<div\s+data-shared="([\w-]+)"/i.exec(node.trim())?.[1] ?? "";
}

function sectionCta(name: string): string {
  const file = path.join(process.cwd(), `content/sections/${name}.html`);
  const html = readFileSync(file, "utf8").trim();
  return /^<p\s+class="cta"/i.test(html) ? html : html.replace(/^<p\b/i, '<p class="cta"');
}

function insertPriceLink(html: string, link: string): string {
  const start = html.lastIndexOf('<div class="price-layout">');
  if (start === -1) return `${html}\n${link}`;
  const close = html.indexOf("</div></div>", start);
  if (close === -1) return `${html}\n${link}`;
  return `${html.slice(0, close)}${link}${html.slice(close)}`;
}

export function layoutItemPage(html: string): string {
  const nodes = topNodes(html);
  const out: string[] = [];
  let cursor = 0;

  while (cursor < nodes.length) {
    if (isTag(nodes[cursor], "section") || /^<div\s+data-shared=/i.test(nodes[cursor])) {
      out.push(nodes[cursor]);
      cursor += 1;
      continue;
    }

    const run: string[] = [];
    while (
      cursor < nodes.length &&
      !isTag(nodes[cursor], "section") &&
      !/^<div\s+data-shared=/i.test(nodes[cursor])
    ) {
      run.push(nodes[cursor]);
      cursor += 1;
    }
    const moreFaq = run.some((node) => isTag(node, "h3")) && sharedName(nodes[cursor] ?? "") === "faq-zh";
    const morePrice = !moreFaq && sharedName(nodes[cursor] ?? "") === "pricing-zh";
    if (moreFaq || morePrice) cursor += 1;
    const laid = layoutRun(run);
    if (moreFaq) out.push(laid.replace(/<\/section>$/, `${sectionCta("faq-zh")}</section>`));
    else if (morePrice) out.push(insertPriceLink(laid, sectionCta("pricing-zh")));
    else out.push(laid);
  }

  return out.join("\n");
}
