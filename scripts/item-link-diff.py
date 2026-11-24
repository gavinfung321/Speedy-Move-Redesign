"""Diff published anchors against the saved item-page bodies."""

import importlib.util
import json
import re
from collections import Counter
from pathlib import Path

spec = importlib.util.spec_from_file_location("extract_bodies", "scripts/extract-bodies.py")
extract_bodies = importlib.util.module_from_spec(spec)
spec.loader.exec_module(extract_bodies)

ROOT = Path(__file__).resolve().parents[1]
index = {path: record for path, record in json.loads((ROOT / "content" / "body-index.json").read_text(encoding="utf-8")).items()}
pages = json.loads((ROOT / "content" / "pages.json").read_text(encoding="utf-8"))
blocks, items = extract_bodies.load_blocks()
ANCHOR = re.compile(r'<a\b[^>]*href="([^"]+)"[^>]*>', re.I)

missing_pages = []
missing_kinds = Counter()
for page in pages:
    if page["template"] != "item-service":
        continue
    record = index[page["path"]]
    post_id = str(record["id"])
    source = extract_bodies.materialize_comments(extract_bodies.expand_refs(items[post_id]["content"], blocks))
    original = []
    for href in ANCHOR.findall(source):
        localized = extract_bodies.localize(href)
        if "startertemplatecloud.com" in localized:
            continue
        original.append(localized)
    body = (ROOT / "content" / "bodies" / f"{post_id}.html").read_text(encoding="utf-8")
    saved = ANCHOR.findall(body)
    saved_set = set(saved)
    missing = [href for href in original if href not in saved_set]
    extra_unique = sorted(set(missing))
    if extra_unique:
        missing_pages.append((page["path"], len(extra_unique), extra_unique[:6]))
        for href in extra_unique:
            if href.startswith("#"):
                missing_kinds["hash"] += 1
            elif href.startswith("http"):
                missing_kinds["external"] += 1
            else:
                missing_kinds["internal"] += 1

print("item pages", sum(1 for page in pages if page["template"] == "item-service"))
print("pages missing anchors", len(missing_pages))
print("kinds", dict(missing_kinds))
for path, count, sample in missing_pages[:12]:
    print(count, path)
    for href in sample:
        print(" ", href)
