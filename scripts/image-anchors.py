"""Print anchors that wrap images on the service pages."""

import importlib.util
import re
from pathlib import Path

spec = importlib.util.spec_from_file_location("extract_bodies", Path(__file__).with_name("extract-bodies.py"))
extract_bodies = importlib.util.module_from_spec(spec)
spec.loader.exec_module(extract_bodies)

ANCHOR = re.compile(r"<a\b[^>]*href=\"([^\"]+)\"[^>]*>(.*?)</a>", re.S)
PAGES = ["4994", "5195", "5198", "5531", "6686", "6705", "6737", "6796"]
blocks, items = extract_bodies.load_blocks()

for post_id in PAGES:
    source = extract_bodies.materialize_comments(extract_bodies.expand_refs(items[post_id]["content"], blocks))
    print(f"\n== {items[post_id]['title']}")
    count = 0
    for href, inner in ANCHOR.findall(source):
        if "<img" not in inner:
            continue
        text = re.sub(r"<[^>]+>", " ", inner)
        text = re.sub(r"\s+", " ", text).strip()[:70]
        print(f"  {text or '(image)'} -> {href[:100]}")
        count += 1
    print(f"  image anchors {count}")
