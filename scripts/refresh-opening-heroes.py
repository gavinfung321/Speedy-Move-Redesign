"""Add the opening photo to every remaining page whose first row is a banner."""

import importlib.util
import json
import re
from collections import Counter
from pathlib import Path

spec = importlib.util.spec_from_file_location("extract_bodies", Path(__file__).with_name("extract-bodies.py"))
extract_bodies = importlib.util.module_from_spec(spec)
spec.loader.exec_module(extract_bodies)

ROOT = Path(__file__).resolve().parents[1]
OPEN = "<!-- wp:kadence/rowlayout"
CLOSE = "<!-- /wp:kadence/rowlayout -->"
TAB = re.compile(r'<a href="(#tab-[^"]*)">([^<]+)</a>')
HEADING = re.compile(r"<h2([^>]*)>(.*?)</h2>", re.S)


def split_first_row(source: str) -> tuple[str, str, str]:
    start = source.find(OPEN)
    if start == -1:
        return "", "", source
    pos = start + len(OPEN)
    depth = 1
    close = -1
    while depth:
        next_open = source.find(OPEN, pos)
        next_close = source.find(CLOSE, pos)
        if next_close == -1:
            raise ValueError("unclosed row")
        if next_open != -1 and next_open < next_close:
            depth += 1
            pos = next_open + len(OPEN)
            continue
        depth -= 1
        if depth == 0:
            close = next_close
            break
        pos = next_close + len(CLOSE)
    brace = source.find("{", start)
    end_brace = brace
    depth = 0
    for index, char in enumerate(source[brace:], brace):
        if char == "{":
            depth += 1
        elif char == "}":
            depth -= 1
            if depth == 0:
                end_brace = index
                break
    data = json.loads(source[brace : end_brace + 1])
    inner = source[end_brace + 1 : close]
    rest = source[close + len(CLOSE) :]
    return str(data.get("bgImg") or ""), inner, rest


def promote_title(html: str) -> str:
    return html.replace("<h2>", "<h1>", 1).replace("</h2>", "</h1>", 1)


def bind_tabs(html: str) -> str:
    for href, label in TAB.findall(html):
        slug = href[1:]
        if slug in {"tab", "tab-"}:
            slug = "tab-" + re.sub(r"\s+", "-", extract_bodies.plain(label))
            html = html.replace(
                f'<a href="{href}">{label}</a>',
                f'<a href="#{extract_bodies.escape(slug)}">{label}</a>',
                1,
            )
        placed = False

        def add_id(match: re.Match[str], slug: str = slug, label: str = label) -> str:
            nonlocal placed
            text = extract_bodies.plain(re.sub(r"<[^>]+>", "", match.group(2)))
            if placed or (text != label and not text.startswith(label)):
                return match.group(0)
            placed = True
            if "id=" in match.group(1):
                return match.group(0)
            return f'<h2{match.group(1)} id="{extract_bodies.escape(slug)}">{match.group(2)}</h2>'

        html = HEADING.sub(add_id, html)
    return html


def main() -> None:
    pages = json.loads((ROOT / "content" / "pages.json").read_text(encoding="utf-8"))
    index = json.loads((ROOT / "content" / "body-index.json").read_text(encoding="utf-8"))
    blocks, items = extract_bodies.load_blocks()
    written = Counter()
    skipped = []
    for page in pages:
        if page["path"] == "/" or page["template"] == "item-service":
            continue
        record = index.get(page["path"])
        if not record or not str(record["id"]).isdigit():
            continue
        post_id = str(record["id"])
        if items.get(post_id, {}).get("status") != "publish":
            continue
        path = ROOT / "content" / "bodies" / f"{post_id}.html"
        previous = path.read_text(encoding="utf-8") if path.exists() else ""
        if previous.startswith('<section class="page-hero"'):
            continue
        source = extract_bodies.expand_refs(items[post_id]["content"], blocks)
        try:
            image, inner, rest = split_first_row(source)
        except (ValueError, json.JSONDecodeError):
            skipped.append((page["path"], "row"))
            continue
        hero = promote_title(extract_bodies.to_html(inner, blocks)).strip()
        if not image or "<h1>" not in hero or len(hero) > 1200:
            skipped.append((page["path"], "banner" if image else "no-photo"))
            continue
        body = bind_tabs(extract_bodies.to_html(rest, blocks).strip())
        previous_words = len(extract_bodies.plain(previous).split())
        new_words = len(extract_bodies.plain(hero + body).split())
        if previous_words > 40 and new_words < previous_words * 0.8:
            skipped.append((page["path"], f"shorter {new_words}/{previous_words}"))
            continue
        url = extract_bodies.escape(image)
        html = f'<section class="page-hero" style="--hero:url(&quot;{url}&quot;)">\n{hero}\n</section>\n{body}\n'
        path.write_text(html, encoding="utf-8")
        written[page["template"]] += 1
    print("wrote")
    for template, count in written.most_common():
        print(f"  {count} {template}")
    print("skipped", len(skipped))
    for path, reason in skipped:
        print(" ", reason, path)


if __name__ == "__main__":
    main()
