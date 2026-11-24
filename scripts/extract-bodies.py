"""Turn published WordPress pages and posts into simplified HTML bodies."""

from __future__ import annotations

import csv
import html
import json
import re
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlparse
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
EXPORT = ROOT / "WordPress.2026-11-24.xml"
CHECKLIST = ROOT / "content" / "url-checklist.csv"
BODY_DIR = ROOT / "content" / "bodies"
INDEX_PATH = ROOT / "content" / "body-index.json"

WP = "{http://wordpress.org/export/1.2/}"
CONTENT = "{http://purl.org/rss/1.0/modules/content/}"
LOCAL_HOSTS = {"speedy-move.com", "www.speedy-move.com"}
VOID_TAGS = {"img", "br", "hr", "meta", "link", "input", "source"}
BLOCK_TAGS = {"h1", "h2", "h3", "h4", "h5", "h6", "p", "li", "blockquote"}
SKIP_TAGS = {"script", "style", "noscript", "svg", "iframe"}

BLOCK_REF = re.compile(r"<!--\s*wp:block\s+(\{.*?\})\s*/-->", re.S)
BUTTON_REF = re.compile(r"<!--\s*wp:kadence/singlebtn\s+(\{.*?\})\s*/-->", re.S)
GALLERY_REF = re.compile(r"<!--\s*wp:kadence/advancedgallery\s+(\{.*?\})\s*/-->", re.S)
QUOTE_REF = re.compile(r"<!--\s*wp:kadence/testimonial\s+(\{.*?\})\s*/-->", re.S)
COMMENT_REF = re.compile(r"<!--.*?-->", re.S)
SHORTCODE_REF = re.compile(r"\[[a-zA-Z][^\[\]]{0,200}\]")


def text_of(element: ET.Element | None) -> str:
    if element is None or element.text is None:
        return ""
    return element.text.strip()


def localize(url: str) -> str:
    if not url:
        return ""
    if url.startswith(("mailto:", "tel:", "#")) or "wa.me" in url:
        return url
    parsed = urlparse(url)
    if parsed.netloc and parsed.netloc not in LOCAL_HOSTS:
        return url
    path = unquote(parsed.path or "/")
    if not path.startswith("/"):
        path = "/" + path
    if path != "/" and not path.endswith("/"):
        path += "/"
    return path


def escape(value: str) -> str:
    return html.escape(value or "", quote=True)


def plain(value: str) -> str:
    value = re.sub(r"<[^>]+>", "", value or "")
    return " ".join(html.unescape(value).split())


class TreeBuilder(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.root: list = []
        self.stack: list[dict] = []
        self.skip_depth = 0

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        tag = tag.lower()
        if self.skip_depth:
            if tag not in VOID_TAGS:
                self.skip_depth += 1
            return
        if tag in SKIP_TAGS:
            if tag not in VOID_TAGS:
                self.skip_depth = 1
            return
        node = {"tag": tag, "attrs": {key: value or "" for key, value in attrs}, "children": []}
        if self.stack:
            self.stack[-1]["children"].append(node)
        else:
            self.root.append(node)
        if tag not in VOID_TAGS:
            self.stack.append(node)

    def handle_endtag(self, tag: str) -> None:
        tag = tag.lower()
        if self.skip_depth:
            self.skip_depth -= 1
            return
        for index in range(len(self.stack) - 1, -1, -1):
            if self.stack[index]["tag"] == tag:
                del self.stack[index:]
                break

    def handle_data(self, data: str) -> None:
        if self.skip_depth or not data.strip():
            return
        if self.stack:
            self.stack[-1]["children"].append(data)
        else:
            self.root.append(data)


def inline(node: dict) -> str:
    parts: list[str] = []
    for child in node["children"]:
        if isinstance(child, str):
            parts.append(escape(child))
            continue
        tag = child["tag"]
        if tag == "br":
            parts.append("<br>")
        elif tag in {"strong", "b"}:
            parts.append(f"<strong>{inline(child)}</strong>")
        elif tag in {"em", "i"}:
            parts.append(f"<em>{inline(child)}</em>")
        elif tag == "a":
            href = localize(child["attrs"].get("href", ""))
            if "startertemplatecloud.com" in href:
                continue
            label = inline(child).strip() or escape(href)
            if href and label:
                parts.append(f'<a href="{escape(href)}">{label}</a>')
            else:
                parts.append(label)
        elif tag == "img":
            parts.append(image_tag(child))
        else:
            parts.append(inline(child))
    return "".join(parts)


def visible_text(node: dict) -> str:
    parts: list[str] = []
    for child in node["children"]:
        if isinstance(child, str):
            parts.append(child)
        elif child["tag"] != "img":
            parts.append(visible_text(child))
    return plain(" ".join(parts))


def first_image(node: dict) -> dict | None:
    for child in node["children"]:
        if not isinstance(child, dict):
            continue
        if child["tag"] == "img":
            return child
        found = first_image(child)
        if found:
            return found
    return None


def linked_image(node: dict, class_name: str) -> str:
    href = localize(node["attrs"].get("href", ""))
    if not href or "startertemplatecloud.com" in href:
        return ""
    image_node = first_image(node)
    if not image_node:
        return ""
    label = node["attrs"].get("aria-label") or visible_text(node)
    image = image_tag(image_node)
    caption = f"<span>{escape(label)}</span>" if label else ""
    return f'<a class="{class_name}" href="{escape(href)}">{image}{caption}</a>'


def image_tag(node: dict) -> str:
    src = node["attrs"].get("src", "")
    if not src or src.startswith("data:"):
        return ""
    alt = node["attrs"].get("alt", "")
    return f'<img src="{escape(src)}" alt="{escape(alt)}">'


def simplify(nodes: list) -> str:
    chunks: list[str] = []
    last_image = ""

    def add_image(node: dict) -> None:
        nonlocal last_image
        tag = image_tag(node)
        if tag and tag != last_image:
            chunks.append(tag)
            last_image = tag

    def walk(node: object) -> None:
        if isinstance(node, str) or not isinstance(node, dict):
            return
        tag = node["tag"]
        if tag in BLOCK_TAGS:
            rendered = inline(node).strip()
            if rendered and plain(rendered):
                level = "h2" if tag == "h1" else tag
                chunks.append(f"<{level}>{rendered}</{level}>")
            return
        if tag == "div" and "partner-grid" in node["attrs"].get("class", ""):
            cards = []
            for child in node["children"]:
                if isinstance(child, dict) and child["tag"] == "a":
                    cards.append(linked_image(child, "partner-card"))
            if cards:
                chunks.append('<div class="partner-grid">' + "".join(cards) + "</div>")
            return
        if tag == "a":
            card = linked_image(node, "item-card")
            if card:
                chunks.append(card)
                return
            rendered = inline(node).strip()
            if rendered:
                chunks.append(f"<p>{rendered}</p>")
            return
        if tag == "img":
            add_image(node)
            return
        if tag == "ul":
            items = []
            for child in node["children"]:
                if isinstance(child, dict) and child["tag"] == "li":
                    rendered = inline(child).strip()
                    if rendered:
                        items.append(f"<li>{rendered}</li>")
            if items:
                chunks.append("<ul>" + "".join(items) + "</ul>")
            return
        if tag == "ol":
            items = []
            for child in node["children"]:
                if isinstance(child, dict) and child["tag"] == "li":
                    rendered = inline(child).strip()
                    if rendered:
                        items.append(f"<li>{rendered}</li>")
            if items:
                chunks.append("<ol>" + "".join(items) + "</ol>")
            return
        for child in node["children"]:
            walk(child)

    for node in nodes:
        walk(node)
    return "\n".join(chunks)


def load_blocks() -> tuple[dict[str, str], dict[str, dict]]:
    blocks: dict[str, str] = {}
    items: dict[str, dict] = {}
    for _event, element in ET.iterparse(EXPORT, events=("end",)):
        if element.tag != "item":
            continue
        post_type = text_of(element.find(f"{WP}post_type"))
        post_id = text_of(element.find(f"{WP}post_id"))
        content = text_of(element.find(f"{CONTENT}encoded"))
        if post_type == "wp_block":
            blocks[post_id] = content
        elif post_type in {"page", "post"}:
            categories = [
                category.get("nicename", "")
                for category in element.findall("category")
                if category.get("domain") == "category"
            ]
            items[post_id] = {
                "type": post_type,
                "status": text_of(element.find(f"{WP}status")),
                "title": text_of(element.find("title")),
                "content": content,
                "categories": categories,
            }
        element.clear()
    return blocks, items


def expand_refs(source: str, blocks: dict[str, str], seen: set[str] | None = None) -> str:
    seen = set() if seen is None else set(seen)

    def replace(match: re.Match[str]) -> str:
        try:
            ref = str(json.loads(match.group(1)).get("ref", ""))
        except json.JSONDecodeError:
            return ""
        if not ref or ref in seen or ref not in blocks:
            return ""
        seen.add(ref)
        return expand_refs(blocks[ref], blocks, seen)

    return BLOCK_REF.sub(replace, source)


def materialize_comments(source: str) -> str:
    def button(match: re.Match[str]) -> str:
        try:
            data = json.loads(match.group(1))
        except json.JSONDecodeError:
            return ""
        label = plain(str(data.get("text", "")))
        href = localize(str(data.get("link", "")))
        if not label or not href:
            return ""
        return f'<p><a href="{escape(href)}">{escape(label)}</a></p>'

    def quote(match: re.Match[str]) -> str:
        try:
            data = json.loads(match.group(1))
        except json.JSONDecodeError:
            return ""
        quote_text = plain(str(data.get("content", "")))
        name = plain(str(data.get("name", "")))
        if not quote_text:
            return ""
        byline = f"<p><strong>{escape(name)}</strong></p>" if name else ""
        return f"<blockquote><p>{escape(quote_text)}</p>{byline}</blockquote>"

    def gallery(match: re.Match[str]) -> str:
        try:
            data = json.loads(match.group(1))
        except json.JSONDecodeError:
            return ""
        images = data.get("imagesDynamic") or data.get("images") or []
        cards = []
        for image in images:
            src = str(image.get("url") or image.get("thumbUrl") or "")
            href = localize(str(image.get("link") or ""))
            if not src:
                continue
            alt = str(image.get("alt") or image.get("caption") or "")
            if not alt:
                alt = plain(unquote(urlparse(src).path).rsplit("/", 1)[-1].rsplit(".", 1)[0])
            img = f'<img src="{escape(src)}" alt="{escape(alt)}">'
            if href:
                cards.append(f'<a href="{escape(href)}">{img}</a>')
            else:
                cards.append(img)
        if not cards:
            return ""
        return '<div class="partner-grid">' + "".join(cards) + "</div>"

    source = BUTTON_REF.sub(button, source)
    source = GALLERY_REF.sub(gallery, source)
    source = QUOTE_REF.sub(quote, source)
    source = COMMENT_REF.sub("", source)
    return SHORTCODE_REF.sub("", source)


def to_html(source: str, blocks: dict[str, str]) -> str:
    expanded = materialize_comments(expand_refs(source, blocks))
    parser = TreeBuilder()
    parser.feed(expanded)
    parser.close()
    return simplify(parser.root)


def word_count(source: str) -> int:
    return len(plain(re.sub(r"<[^>]+>", " ", source)).split())


def main() -> None:
    blocks, items = load_blocks()
    BODY_DIR.mkdir(parents=True, exist_ok=True)
    index: dict[str, dict[str, str | int]] = {}
    empty: list[str] = []

    with CHECKLIST.open(encoding="utf-8-sig", newline="") as handle:
        rows = [row for row in csv.DictReader(handle) if row["status"] == "publish" and row["path"] != "/"]

    for row in rows:
        post_id = row["id"]
        if row["post_type"] == "category":
            links = []
            for item in items.values():
                if item["status"] == "publish" and item["type"] == "post" and row["slug"] in item["categories"]:
                    # The checklist path is the canonical URL. Match posts below after the index exists.
                    links.append(item)
            index[row["path"]] = {"id": f"category-{row['slug']}", "words": 0, "kind": "category"}
            continue

        item = items.get(post_id)
        if not item:
            empty.append(row["path"])
            continue
        rendered = to_html(item["content"], blocks)
        words = word_count(rendered)
        file_id = post_id
        (BODY_DIR / f"{file_id}.html").write_text(rendered, encoding="utf-8")
        index[row["path"]] = {"id": file_id, "words": words, "kind": row["post_type"]}
        if words < 40:
            empty.append(f"{row['path']} ({words} words)")

    posts_by_category: dict[str, list[tuple[str, str]]] = {}
    path_by_id = {str(value["id"]): path for path, value in index.items()}
    for post_id, item in items.items():
        if item["status"] != "publish" or item["type"] != "post":
            continue
        post_path = path_by_id.get(post_id, "")
        for category in item["categories"]:
            posts_by_category.setdefault(category, []).append((item["title"], post_path))

    for row in rows:
        if row["post_type"] != "category":
            continue
        entries = posts_by_category.get(row["slug"], [])
        list_html = "".join(
            f'<li><a href="{escape(path)}">{escape(title)}</a></li>' for title, path in entries if path
        )
        rendered = f"<ul>{list_html}</ul>" if list_html else ""
        file_id = f"category-{row['slug']}"
        (BODY_DIR / f"{file_id}.html").write_text(rendered, encoding="utf-8")
        index[row["path"]] = {"id": file_id, "words": len(entries), "kind": "category"}

    INDEX_PATH.write_text(json.dumps(index, ensure_ascii=False, indent=2), encoding="utf-8")
    word_values = [int(value["words"]) for value in index.values() if value["kind"] != "category"]
    print(f"bodies {len(index)}")
    print(f"median words {sorted(word_values)[len(word_values)//2] if word_values else 0}")
    print(f"under 40 words {len(empty)}")
    for path in empty[:30]:
        print(" ", path)


if __name__ == "__main__":
    main()
