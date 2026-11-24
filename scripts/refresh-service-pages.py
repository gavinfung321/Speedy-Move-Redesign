"""Rebuild the eight core service pages without touching the homepage."""

import importlib.util
import re
from pathlib import Path

spec = importlib.util.spec_from_file_location("extract_bodies", Path(__file__).with_name("extract-bodies.py"))
extract_bodies = importlib.util.module_from_spec(spec)
spec.loader.exec_module(extract_bodies)

ROOT = Path(__file__).resolve().parents[1]
PAGES = ["4994", "5195", "5198", "5531", "6686", "6705", "6737", "6796"]
TAB = re.compile(r'<a href="(#tab-[^"]*)">([^<]+)</a>')
HEADING = re.compile(r"<h2([^>]*)>(.*?)</h2>", re.S)


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
    blocks, items = extract_bodies.load_blocks()
    for post_id in PAGES:
        html = bind_tabs(extract_bodies.to_html(items[post_id]["content"], blocks))
        path = ROOT / "content" / "bodies" / f"{post_id}.html"
        path.write_text(html, encoding="utf-8")
        print(post_id, items[post_id]["title"], "partners", html.count("partner-card"), "cards", html.count("item-card"))


if __name__ == "__main__":
    main()
