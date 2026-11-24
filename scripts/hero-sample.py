"""Preview the opening row on one page of each remaining template."""

import importlib.util
import json
from pathlib import Path

spec = importlib.util.spec_from_file_location("extract_bodies", "scripts/extract-bodies.py")
extract_bodies = importlib.util.module_from_spec(spec)
spec.loader.exec_module(extract_bodies)
item = importlib.util.spec_from_file_location("refresh_item", "scripts/refresh-item-pages.py")
refresh = importlib.util.module_from_spec(item)
item.loader.exec_module(refresh)

pages = json.load(open("content/pages.json", encoding="utf-8"))
index = json.load(open("content/body-index.json", encoding="utf-8"))
blocks, items = extract_bodies.load_blocks()
wanted = {
    "location": "/locations/aberdeen/",
    "core-service": "/furniture-disposal/",
    "demolition": "/zh/住宅清拆/",
    "moving": "/moving-process/",
    "company": "/blog/",
    "legal": "/terms-conditions/",
    "homepage": "/zh/首頁/",
}
by_path = {page["path"]: page for page in pages}
for label, path in wanted.items():
    page = by_path[path]
    post_id = str(index[path]["id"])
    source = extract_bodies.expand_refs(items[post_id]["content"], blocks)
    image, inner, _rest = refresh.first_row(source)
    hero = extract_bodies.to_html(inner, blocks).strip()
    print(f"\n== {label} {path} id {post_id}")
    print("bg", (image or "NONE").rsplit("/", 1)[-1])
    print("chars", len(hero), "headings", hero.count("<h"))
    print(hero[:500].replace("\n", " | "))
