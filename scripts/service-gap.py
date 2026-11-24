"""Compare visible text and link-like fields on the service pages."""

import importlib.util
import json
import re
from pathlib import Path

spec = importlib.util.spec_from_file_location("extract_bodies", Path(__file__).with_name("extract-bodies.py"))
extract_bodies = importlib.util.module_from_spec(spec)
spec.loader.exec_module(extract_bodies)

ROOT = Path(__file__).resolve().parents[1]
COMMENT = re.compile(r"<!--\s*wp:([\w/-]+)(\s+(\{.*?\}))?\s*/?-->", re.S)
PAGES = ["4994", "5195", "5198", "5531", "6686", "6705", "6737", "6796"]
blocks, items = extract_bodies.load_blocks()

def walk(value, path, found):
    if isinstance(value, dict):
        for key, child in value.items():
            walk(child, f"{path}.{key}", found)
    elif isinstance(value, list):
        for index, child in enumerate(value[:30]):
            walk(child, f"{path}[{index}]", found)
    elif isinstance(value, str) and ("http" in value or value.startswith("/") or "link" in path.lower()):
        if value.startswith(("http", "/", "wa.me", "#")) and "typography" not in path and "color" not in path.lower():
            found.append(f"{path}: {value[:120]}")

for post_id in PAGES:
    source = extract_bodies.expand_refs(items[post_id]["content"], blocks)
    rendered = (ROOT / "content" / "bodies" / f"{post_id}.html").read_text(encoding="utf-8")
    source_words = extract_bodies.word_count(re.sub(r"<[^>]+>", " ", re.sub(r"<!--.*?-->", " ", source, flags=re.S)))
    body_words = extract_bodies.word_count(rendered)
    print(f"\n== {items[post_id]['title']} source-ish {source_words} body {body_words}")
    found = []
    names = {}
    for match in COMMENT.finditer(source):
        names[match.group(1)] = names.get(match.group(1), 0) + 1
        raw = match.group(3)
        if not raw:
            continue
        try:
            data = json.loads(raw)
        except json.JSONDecodeError:
            continue
        walk(data, match.group(1), found)
    print(" blocks", ", ".join(f"{name}:{count}" for name, count in sorted(names.items())))
    for row in found:
        if "singlebtn" in row or "testimonial" in row:
            continue
        print(" ", row[:180])
