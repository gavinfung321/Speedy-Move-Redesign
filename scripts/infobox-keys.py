"""Show infobox and gallery fields that point somewhere."""

import importlib.util
import json
import re

spec = importlib.util.spec_from_file_location("extract_bodies", "scripts/extract-bodies.py")
extract_bodies = importlib.util.module_from_spec(spec)
spec.loader.exec_module(extract_bodies)

COMMENT = re.compile(r"<!--\s*wp:(kadence/(?:infobox|advancedgallery|image))(\s+(\{.*?\}))?\s*/?-->", re.S)
blocks, items = extract_bodies.load_blocks()

for post_id in ["6737", "6686", "6705", "5198"]:
    source = extract_bodies.expand_refs(items[post_id]["content"], blocks)
    print(f"\n== {items[post_id]['title']}")
    for match in COMMENT.finditer(source):
        try:
            data = json.loads(match.group(3) or "{}")
        except json.JSONDecodeError:
            continue
        name = match.group(1)
        if name.endswith("advancedgallery"):
            images = data.get("imagesDynamic") or data.get("images") or []
            print(f" gallery {len(images)}")
            continue
        interesting = {key: data.get(key) for key in data if "link" in key.lower() or key in {"title", "mediaType", "alt"}}
        if interesting:
            print(name, {key: (str(value)[:80] if not isinstance(value, (dict, list)) else type(value).__name__) for key, value in interesting.items()})
