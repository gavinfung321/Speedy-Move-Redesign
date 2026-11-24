"""Compare images and background photos on item pages with the saved HTML."""

import importlib.util
import json
import re
from collections import Counter
from pathlib import Path
from urllib.parse import unquote, urlparse

spec = importlib.util.spec_from_file_location("extract_bodies", "scripts/extract-bodies.py")
extract_bodies = importlib.util.module_from_spec(spec)
spec.loader.exec_module(extract_bodies)

ROOT = Path(__file__).resolve().parents[1]
index = json.loads((ROOT / "content" / "body-index.json").read_text(encoding="utf-8"))
pages = json.loads((ROOT / "content" / "pages.json").read_text(encoding="utf-8"))
blocks, items = extract_bodies.load_blocks()
IMG = re.compile(r'<img\b[^>]*src="([^"]+)"', re.I)
BG = re.compile(r'"bgImg"\s*:\s*"([^"]+)"')
URL = re.compile(r"https://speedy-move.com/wp-content/uploads/[^\"\\]+")


def file_name(url: str) -> str:
    name = unquote(urlparse(url).path).rsplit("/", 1)[-1]
    return re.sub(r"-\d+x\d+(?=\.)", "", name)


missing_counter = Counter()
pages_missing = []
for page in pages:
    if page["template"] != "item-service":
        continue
    post_id = str(index[page["path"]]["id"])
    source = extract_bodies.expand_refs(items[post_id]["content"], blocks)
    original = {file_name(url) for url in IMG.findall(source)}
    original.update(file_name(url) for url in BG.findall(source))
    body = (ROOT / "content" / "bodies" / f"{post_id}.html").read_text(encoding="utf-8")
    saved = {file_name(url) for url in IMG.findall(body)}
    missing = sorted(original - saved)
    if missing:
        pages_missing.append((page["path"], missing[:8]))
        for name in missing:
            missing_counter[name] += 1

print("item pages missing images", len(pages_missing))
print("most common missing files")
for name, count in missing_counter.most_common(15):
    print(f"  {count} {name}")
print("sample")
for path, names in pages_missing[:6]:
    print(path)
    for name in names:
        print(" ", name)
