"""Show the infobox link markup on one item page."""

import importlib.util
import json
from pathlib import Path

spec = importlib.util.spec_from_file_location("extract_bodies", "scripts/extract-bodies.py")
extract_bodies = importlib.util.module_from_spec(spec)
spec.loader.exec_module(extract_bodies)

ROOT = Path(__file__).resolve().parents[1]
index = json.loads((ROOT / "content" / "body-index.json").read_text(encoding="utf-8"))
blocks, items = extract_bodies.load_blocks()
post_id = index["/air-conditioner-removal/"]["id"]
source = extract_bodies.materialize_comments(extract_bodies.expand_refs(items[post_id]["content"], blocks))
start = source.find("info-box-link")
print(source[max(0, start - 200) : start + 700])
print("--- count", source.count("info-box-link"))
