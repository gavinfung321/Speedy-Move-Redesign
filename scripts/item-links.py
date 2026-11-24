"""Find image links that the item-page HTML never received."""

import importlib.util
import json
import re
from pathlib import Path

spec = importlib.util.spec_from_file_location("extract_bodies", "scripts/extract-bodies.py")
extract_bodies = importlib.util.module_from_spec(spec)
spec.loader.exec_module(extract_bodies)

ROOT = Path(__file__).resolve().parents[1]
index = json.loads((ROOT / "content" / "body-index.json").read_text(encoding="utf-8"))
blocks, items = extract_bodies.load_blocks()
COMMENT = re.compile(r"<!--\s*wp:([\w/-]+)(\s+(\{.*?\}))?\s*/?-->", re.S)

post_id = index["/air-conditioner-removal/"]["id"]
source = extract_bodies.expand_refs(items[post_id]["content"], blocks)
print("post", post_id, "len", len(source))
seen = set()
for match in COMMENT.finditer(source):
    name = match.group(1)
    raw = match.group(3) or ""
    if "link" not in raw.lower() and "url" not in raw.lower():
        continue
    try:
        data = json.loads(raw)
    except json.JSONDecodeError:
        continue

    def walk(value, trail=""):
        if isinstance(value, dict):
            for key, child in value.items():
                walk(child, f"{trail}.{key}")
        elif isinstance(value, list):
            for child in value[:3]:
                walk(child, trail + "[]")
        elif isinstance(value, str) and ("http" in value or value.startswith("/") or value.startswith("#")):
            key = (name, trail, value[:120])
            if key not in seen and any(token in trail.lower() for token in ("link", "url", "href")):
                seen.add(key)
                print(name, trail, value[:140])

    walk(data)

print("--- html anchors containing img ---")
material = extract_bodies.materialize_comments(source)
for match in re.finditer(r"<a\b[^>]*>[\s\S]{0,400}?<img[\s\S]{0,200}?</a>", material):
    print(match.group(0)[:300].replace("\n", " "))
    print("---")
