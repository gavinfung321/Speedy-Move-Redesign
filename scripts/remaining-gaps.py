"""Count content holes still sitting in pages we have not rebuilt."""

import importlib.util
import json
import re
from collections import Counter
from pathlib import Path

spec = importlib.util.spec_from_file_location("extract_bodies", "scripts/extract-bodies.py")
extract_bodies = importlib.util.module_from_spec(spec)
spec.loader.exec_module(extract_bodies)

ROOT = Path(__file__).resolve().parents[1]
DONE = {"4994", "5195", "5198", "5531", "6686", "6705", "6737", "6796", "4993"}
index = json.loads((ROOT / "content" / "body-index.json").read_text(encoding="utf-8"))
blocks, items = extract_bodies.load_blocks()

counts = Counter()
examples = {name: [] for name in ("gallery", "posts", "table", "image-card")}

for path, record in index.items():
    post_id = str(record["id"])
    if post_id in DONE or post_id not in items or items[post_id]["status"] != "publish":
        continue
    source = extract_bodies.expand_refs(items[post_id]["content"], blocks)
    flags = {
        "gallery": "kadence/advancedgallery" in source,
        "posts": "kadence/posts" in source,
        "table": "wp:table" in source,
        "image-card": "info-box-link" in source,
    }
    if not any(flags.values()):
        continue
    counts["pages"] += 1
    for name, present in flags.items():
        if present:
            counts[name] += 1
            if len(examples[name]) < 4:
                examples[name].append(path)

print("pages with a remaining hole", counts["pages"])
for name in ("gallery", "image-card", "posts", "table"):
    print(f"{name}: {counts[name]}")
    for path in examples[name]:
        print(" ", path)
