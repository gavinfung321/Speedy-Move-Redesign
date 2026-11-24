"""Count WordPress reusable blocks and where they are used."""

import importlib.util
import re
from collections import Counter
from pathlib import Path

spec = importlib.util.spec_from_file_location("extract_bodies", Path(__file__).with_name("extract-bodies.py"))
extract_bodies = importlib.util.module_from_spec(spec)
spec.loader.exec_module(extract_bodies)

REF = re.compile(r'<!--\s*wp:block\s+\{"ref":(\d+)\}')
HEADING = re.compile(r"<h[1-6][^>]*>(.*?)</h[1-6]>", re.S)

blocks, items = extract_bodies.load_blocks()
uses = Counter()
for item in items.values():
    if item["status"] != "publish":
        continue
    for match in REF.finditer(item["content"]):
        uses[match.group(1)] += 1

rows = []
for block_id, content in blocks.items():
    html = extract_bodies.to_html(content, blocks)
    heading = ""
    found = HEADING.search(html)
    if found:
        heading = re.sub(r"<[^>]+>", "", found.group(1))
        heading = re.sub(r"\s+", " ", heading).strip()
    title = ""
    rows.append((uses[block_id], block_id, heading[:80], len(html)))

rows.sort(key=lambda row: (-row[0], row[2]))
print(f"blocks {len(blocks)} used {sum(1 for row in rows if row[0])} unused {sum(1 for row in rows if row[0] == 0)}")
for count, block_id, heading, size in rows:
    if count == 0 and size < 40:
        continue
    print(f"{count:4}  {block_id:6}  {size:6}  {heading}")
