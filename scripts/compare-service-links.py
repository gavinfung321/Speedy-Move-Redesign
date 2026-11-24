"""Show links present in the WordPress service pages but missing after import."""

import importlib.util
import re
from pathlib import Path

spec = importlib.util.spec_from_file_location("extract_bodies", Path(__file__).with_name("extract-bodies.py"))
extract_bodies = importlib.util.module_from_spec(spec)
spec.loader.exec_module(extract_bodies)

ROOT = Path(__file__).resolve().parents[1]
PAGES = [
    ("4994", "/junk-removal/"),
    ("5195", "/furniture-disposal/"),
    ("5198", "/moving/"),
    ("5531", "/demolition-and-restoration/"),
    ("6686", "/zh/清理垃圾/"),
    ("6705", "/zh/棄置傢俬/"),
    ("6737", "/zh/搬屋/"),
    ("6796", "/zh/清拆服務/"),
]
HREF = re.compile(r'href="([^"]+)"[^>]*>(.*?)</a>', re.S)

blocks, items = extract_bodies.load_blocks()

for post_id, path in PAGES:
    source = extract_bodies.materialize_comments(extract_bodies.expand_refs(items[post_id]["content"], blocks))
    rendered = (ROOT / "content" / "bodies" / f"{post_id}.html").read_text(encoding="utf-8")
    original = []
    for href, label in HREF.findall(source):
        label = re.sub(r"<[^>]+>", " ", label)
        label = re.sub(r"\s+", " ", label).strip()
        original.append((extract_bodies.localize(href), label[:80]))
    current = {(extract_bodies.localize(href), re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", label)).strip()[:80]) for href, label in HREF.findall(rendered)}
    missing = [item for item in original if item not in current and "startertemplatecloud.com" not in item[0]]
    print(f"\n== {path} original {len(original)} missing {len(missing)}")
    for href, label in missing:
        print(f"  {label or '(no text)'} -> {href}")
