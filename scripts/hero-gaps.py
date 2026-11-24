"""Count pages whose opening photo is still only a background in the export."""

import importlib.util
import json
import re
from collections import Counter

spec = importlib.util.spec_from_file_location("extract_bodies", "scripts/extract-bodies.py")
extract_bodies = importlib.util.module_from_spec(spec)
spec.loader.exec_module(extract_bodies)

pages = json.load(open("content/pages.json", encoding="utf-8"))
index = json.load(open("content/body-index.json", encoding="utf-8"))
blocks, items = extract_bodies.load_blocks()
BG = re.compile(r'"bgImg"\s*:\s*"(https://[^"]+)"')
by_template = Counter()
examples = {}
for page in pages:
    record = index.get(page["path"])
    if not record or not str(record["id"]).isdigit():
        continue
    if items.get(str(record["id"]), {}).get("status") != "publish":
        continue
    source = extract_bodies.expand_refs(items[str(record["id"])]["content"], blocks)
    images = BG.findall(source)
    if not images:
        continue
    body_path = f"content/bodies/{record['id']}.html"
    try:
        body = open(body_path, encoding="utf-8").read()
    except FileNotFoundError:
        body = ""
    if "page-hero" in body:
        continue
    name = images[0].rsplit("/", 1)[-1]
    if name in body or extract_bodies.plain(name.rsplit(".", 1)[0]) in body:
        continue
    by_template[page["template"]] += 1
    examples.setdefault(page["template"], page["path"])

print("pages still missing an opening photo")
for template, count in by_template.most_common():
    print(f"  {count:3} {template:16} {examples[template]}")
