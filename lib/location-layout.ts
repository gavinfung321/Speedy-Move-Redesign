const VOID_TAGS = new Set(["img", "br", "hr", "source"]);

function topNodes(html: string): string[] {
  const nodes: string[] = [];
  let index = 0;

  while (index < html.length) {
    while (index < html.length && /\s/.test(html[index])) index += 1;
    if (index >= html.length) break;
    if (html[index] !== "<") {
      const next = html.indexOf("<", index);
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

function inner(node: string): string {
  return node.replace(/^<h3[^>]*>/i, "").replace(/<\/h3>$/i, "");
}

export function layoutLocationsPage(html: string): string {
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

    const title = run.find((node) => isTag(node, "h2")) ?? "";
    const regions: string[] = [];
    let region = "";
    const cards: string[] = [];

    const flush = () => {
      if (!region && cards.length === 0) return;
      regions.push(
        `<section class="location-region">${region}<div class="location-cards" data-count="${cards.length}">${cards.join("")}</div></section>`,
      );
      region = "";
      cards.length = 0;
    };

    for (let index = 0; index < run.length; index += 1) {
      const node = run[index];
      if (!isTag(node, "h3")) continue;
      const next = run[index + 1] ?? "";
      if (isTag(next, "ul")) {
        cards.push(`<details><summary>${inner(node)}</summary>${next}</details>`);
        index += 1;
        continue;
      }
      flush();
      region = node;
    }
    flush();
    out.push(`<section class="location-index">${title}${regions.join("")}</section>`);
  }

  return out.join("\n");
}

function headingIndexes(nodes: string[]): number[] {
  return nodes.flatMap((node, index) => (isTag(node, "h2") ? [index] : []));
}

function plainHeading(node: string): string {
  return node.replace(/<\/?strong>/gi, "");
}

function liftSubheads(nodes: string[]): string[] {
  return nodes.map((node) => {
    if (isTag(node, "h2") || isTag(node, "h3")) return plainHeading(node);
    if (/^<p><strong>[\s\S]*<\/strong><\/p>$/i.test(node.trim())) {
      return node.replace(/^<p><strong>/i, "<h3>").replace(/<\/strong><\/p>$/i, "</h3>");
    }
    return node;
  });
}

function serviceSplit(img: string, copy: string[]): string {
  return `<div class="service-detail"><div class="service-split">${img}<div>${copy.join("")}</div></div></div>`;
}

function textSection(copy: string[]): string {
  return `<div class="service-detail">${copy.join("")}</div>`;
}

function donate(img: string, copy: string[]): string {
  return `<div class="home-donate"><div class="split-photo">${img}</div><div>${copy.join("")}</div></div>`;
}

function haulGrid(nodes: string[]): string {
  const articles: string[] = [];
  let index = 0;
  while (index < nodes.length) {
    if (!isTag(nodes[index], "h3")) {
      index += 1;
      continue;
    }
    const title = nodes[index];
    let img = "";
    let list = "";
    if (isTag(nodes[index + 1] ?? "", "img")) {
      img = nodes[index + 1];
      index += 1;
    }
    if (isTag(nodes[index + 1] ?? "", "ul")) {
      list = nodes[index + 1];
      index += 1;
    }
    articles.push(`<article>${img}${title}${list}</article>`);
    index += 1;
  }
  return `<div class="haul-grid">${articles.join("")}</div>`;
}

function layoutNeighbourhoodRun(run: string[]): string {
  const headings = headingIndexes(run);
  if (headings.length < 4 || !isTag(run[0] ?? "", "img")) return run.join("");

  const [first, second, third, fourth] = headings;
  const photo = run.findIndex((node, index) => index > third && isTag(node, "img"));
  const intro = liftSubheads(run.slice(1, second));
  const places = liftSubheads(run.slice(second, third));
  const pitch = liftSubheads(run.slice(third, photo));
  const services = liftSubheads(run.slice(fourth + 1));

  return [
    serviceSplit(run[0], intro),
    textSection(places),
    donate(run[photo], pitch),
    textSection([plainHeading(run[fourth]), haulGrid(services)]),
  ].join("");
}

function placeHero(section: string): string {
  return section
    .replace('class="page-hero"', 'class="page-hero hero-place"')
    .replace(/<h1>Junk Removal Near\s+([\s\S]*?)<\/h1>/, "<h1>Junk Removal Near<br><span>$1</span></h1>");
}

export function layoutNeighbourhoodPage(html: string): string {
  const nodes = topNodes(html);
  const out: string[] = [];
  let cursor = 0;

  while (cursor < nodes.length) {
    if (isTag(nodes[cursor], "section") || /^<div\s+data-shared=/i.test(nodes[cursor])) {
      out.push(isTag(nodes[cursor], "section") ? placeHero(nodes[cursor]) : nodes[cursor]);
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
    out.push(layoutNeighbourhoodRun(run));
  }

  return out.join("\n");
}
