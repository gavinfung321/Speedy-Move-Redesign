"""List Kadence block links that are not already turned into anchors."""

import importlib.util
import json
import re
from pathlib import Path

spec = importlib.util.spec_from_file_location("extract_bodies", Path(__file__).with_name("extract-bodies.py"))
extract_bodies = importlib.util.module_from_spec(spec)
spec.loader.exec_module(extract_bodies)

COMMENT = re.compile(r"<!--\s*wp:([\w/-]+)(\s+(\{.*?\}))?\s*(/)?-->", re.S)
PAGES = ["4994", "5195", "5198", "5531", "6686", "6705", "6737", "6796"]
blocks, items = extract_bodies.load_blocks()

for post_id in PAGES:
    source = extract_bodies.expand_refs(items[post_id]["content"], blocks)
    print(f"\n== {post_id} {items[post_id]['title']}")
    seen = {}
    for match in COMMENT.finditer(source):
        name = match.group(1)
        raw = match.group(3)
        if not raw or name in {"kadence/singlebtn", "kadence/testimonial"}:
            continue
        try:
            data = json.loads(raw)
        except json.JSONDecodeError:
            continue
        link = data.get("link") or data.get("mediaLink") or data.get("url")
        if isinstance(link, str) and link and not link.startswith("#"):
            text = data.get("text") or data.get("title") or data.get("alt") or ""
            seen.setdefault(name, []).append(f"{text} -> {link}"[:140])
    for name, rows in seen.items():
        print(f"  {name} ({len(rows)})")
        for row in rows[:8]:
            print(f"    {row}")
        if len(rows) > 8:
            print(f"    ... {len(rows) - 8} more")
