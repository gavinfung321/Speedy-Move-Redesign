"""See whether the repeated sections are identical across pages."""

import importlib.util
import json
from collections import Counter
from pathlib import Path

spec = importlib.util.spec_from_file_location("extract_bodies", "scripts/extract-bodies.py")
extract_bodies = importlib.util.module_from_spec(spec)
spec.loader.exec_module(extract_bodies)

blocks, _items = extract_bodies.load_blocks()
SECTIONS = {
    "8198": "How it works",
    "8809": "服務流程",
    "8203": "All kinds",
    "8825": "各種垃圾",
    "8200": "Contact",
    "8858": "聯絡資料",
}
root = Path("content/bodies")
for block_id, label in SECTIONS.items():
    html = extract_bodies.to_html(blocks[block_id], blocks).strip()
    hits = 0
    for path in root.glob("*.html"):
        if html and html in path.read_text(encoding="utf-8"):
            hits += 1
    print(f"{label} {block_id} chars {len(html)} exact {hits}")
    print(html[:240].replace("\n", " | "))
    print("---")
