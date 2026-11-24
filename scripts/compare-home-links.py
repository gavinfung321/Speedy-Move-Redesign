"""Compare links on the original English homepage with the rebuilt page."""

import importlib.util
import re
from pathlib import Path

spec = importlib.util.spec_from_file_location("extract_bodies", Path(__file__).with_name("extract-bodies.py"))
extract_bodies = importlib.util.module_from_spec(spec)
spec.loader.exec_module(extract_bodies)

blocks, items = extract_bodies.load_blocks()
source = extract_bodies.expand_refs(items["4993"]["content"], blocks)
source = extract_bodies.materialize_comments(source)
original = re.findall(r'href="([^"]+)"[^>]*>(.*?)</a>', source, re.S)
print(f"original links {len(original)}")
for href, label in original:
    label = re.sub(r"<[^>]+>", "", label)
    label = re.sub(r"\s+", " ", label).strip()
    print(f"- {label or '(image)'} -> {href}")
