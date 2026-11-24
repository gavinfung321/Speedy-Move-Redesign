"""Put each item page's opening photo back in front of its title and quote button."""

import importlib.util
import json
import re
from pathlib import Path

spec = importlib.util.spec_from_file_location("extract_bodies", Path(__file__).with_name("extract-bodies.py"))
extract_bodies = importlib.util.module_from_spec(spec)
spec.loader.exec_module(extract_bodies)

ROOT = Path(__file__).resolve().parents[1]


def first_row(source: str) -> tuple[str, str, str]:
    start = source.find("<!-- wp:kadence/rowlayout")
    brace = source.find("{", start)
    depth = 0
    end_brace = brace
    for index, char in enumerate(source[brace:], brace):
        if char == "{":
            depth += 1
        elif char == "}":
            depth -= 1
            if depth == 0:
                end_brace = index
                break
    data = json.loads(source[brace : end_brace + 1])
    close = source.find("<!-- /wp:kadence/rowlayout -->", end_brace)
    if close == -1:
        raise ValueError("row does not close")
    inner = source[end_brace + 1 : close]
    rest = source[close + len("<!-- /wp:kadence/rowlayout -->") :]
    return str(data.get("bgImg") or ""), inner, rest


def promote_title(html: str) -> str:
    return html.replace("<h2>", "<h1>", 1).replace("</h2>", "</h1>", 1)


def main() -> None:
    pages = json.loads((ROOT / "content" / "pages.json").read_text(encoding="utf-8"))
    index = json.loads((ROOT / "content" / "body-index.json").read_text(encoding="utf-8"))
    blocks, items = extract_bodies.load_blocks()
    written = 0
    for page in pages:
        if page["template"] != "item-service":
            continue
        post_id = str(index[page["path"]]["id"])
        source = extract_bodies.expand_refs(items[post_id]["content"], blocks)
        image, inner, rest = first_row(source)
        hero = promote_title(extract_bodies.to_html(inner, blocks)).strip()
        if not image or "<h1>" not in hero or "<a " not in hero:
            print("skipped", page["path"])
            continue
        body = extract_bodies.to_html(rest, blocks).strip()
        url = extract_bodies.escape(image)
        html = f'<section class="page-hero" style="--hero:url(&quot;{url}&quot;)">\n{hero}\n</section>\n{body}\n'
        path = ROOT / "content" / "bodies" / f"{post_id}.html"
        path.write_text(html, encoding="utf-8")
        written += 1
        if written <= 3:
            print(page["path"], image.rsplit("/", 1)[-1])
    print("wrote", written)


if __name__ == "__main__":
    main()
